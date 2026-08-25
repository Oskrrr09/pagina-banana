import { beforeEach, describe, expect, it, vi } from 'vitest'

// ============================================================================
// AUD-001 — EL JUSTIFICANTE DISTINGUE LO QUE PUEDE CONTAR DE LO QUE NO.
//
// QUÉ CONTRATO SE FIJA AQUÍ
//
// `uploadEducationalProof` devolvía un `string` que mezclaba cuatro cosas: dos
// mensajes de dominio útiles —formato y tamaño—, un aviso de configuración, y
// el `message` crudo de Storage y del RPC. Con esa firma, pintar el error en
// la cuenta era pintar lo que dijera Supabase.
//
// Ahora devuelve una CATEGORÍA cerrada. El texto lo elige la interfaz, que es
// donde vive el diccionario. Esto fija que:
//
//   1. formato y tamaño siguen distinguiéndose —no se degradan a genérico—;
//   2. todo lo demás cae en `'tecnico'`, incluido lo que aún no existe;
//   3. la compensación del huérfano sigue ejecutándose.
//
// EL CLEANUP NO TENÍA REGRESIÓN
//
// Si `registrar_mi_justificante` falla después de subir el archivo, éste queda
// en el bucket sin solicitud que lo respalde: nadie lo revisa y el cliente no
// puede borrarlo. El código lo compensa con un `remove([path])`. Lo único que
// lo cubría eran las pruebas de la función SQL, que no ven esa compensación.
// Como esta entrega toca exactamente esa rama, se protege ahora.
// ============================================================================

const upload = vi.fn()
const remove = vi.fn()
const rpc = vi.fn()

vi.mock('../../src/lib/supabase', () => ({
  EDUCATIONAL_DISCOUNT_BUCKET: 'descuentos-educativos',
  supabase: {
    storage: { from: () => ({ upload, remove }) },
    rpc: (...args: unknown[]) => rpc(...args),
  },
}))

const { uploadEducationalProof, MAX_FILE_BYTES } = await import('../../src/lib/educationalDiscount')

const UID = '11111111-1111-1111-1111-111111111111'

/** Un archivo del tamaño y tipo que se quiera, sin tocar el disco. */
function archivo(nombre: string, tipo: string, bytes = 10) {
  const file = new File([new Uint8Array(bytes)], nombre, { type: tipo })
  // `File` no deja fijar `size`, y fabricar 5 MB reales en memoria para una
  // prueba de límite es gasto sin cobertura añadida.
  Object.defineProperty(file, 'size', { value: bytes })
  return file
}

const PDF_VALIDO = () => archivo('matricula.pdf', 'application/pdf')

beforeEach(() => {
  upload.mockReset().mockResolvedValue({ error: null })
  remove.mockReset().mockResolvedValue({ error: null })
  rpc.mockReset().mockResolvedValue({ error: null })
})

describe('uploadEducationalProof()', () => {
  it('acepta un justificante correcto y no devuelve error', async () => {
    expect(await uploadEducationalProof(UID, PDF_VALIDO())).toEqual({ error: null })
    expect(upload).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('registrar_mi_justificante', { p_ruta: `${UID}/justificante.pdf` })
    expect(remove, 'si todo va bien no se borra nada').not.toHaveBeenCalled()
  })

  it('distingue el formato no admitido, que sí es asunto de quien sube', async () => {
    expect(await uploadEducationalProof(UID, archivo('virus.exe', 'application/x-msdownload'))).toEqual({
      error: 'formato',
    })
    expect(upload, 'ni siquiera se intenta subir').not.toHaveBeenCalled()
  })

  it('distingue el archivo demasiado grande', async () => {
    expect(await uploadEducationalProof(UID, archivo('enorme.pdf', 'application/pdf', MAX_FILE_BYTES + 1))).toEqual({
      error: 'tamano',
    })
    expect(upload).not.toHaveBeenCalled()
  })

  it('acepta justo el límite: 5 MB no es «más de 5 MB»', async () => {
    expect(await uploadEducationalProof(UID, archivo('justo.pdf', 'application/pdf', MAX_FILE_BYTES))).toEqual({
      error: null,
    })
  })

  it('un fallo de Storage es técnico y no cuenta lo que dijo Storage', async () => {
    upload.mockResolvedValue({ error: { message: 'new row violates row-level security policy' } })

    const resultado = await uploadEducationalProof(UID, PDF_VALIDO())

    expect(resultado).toEqual({ error: 'tecnico' })
    expect(JSON.stringify(resultado), 'el mensaje de Storage no viaja de vuelta').not.toContain('row-level security')
    expect(rpc, 'sin archivo subido no hay nada que registrar').not.toHaveBeenCalled()
  })

  it('un fallo del RPC es técnico Y borra el archivo que ya se había subido', async () => {
    rpc.mockResolvedValue({ error: { message: 'permission denied for function registrar_mi_justificante' } })

    const resultado = await uploadEducationalProof(UID, PDF_VALIDO())

    expect(resultado).toEqual({ error: 'tecnico' })
    expect(JSON.stringify(resultado), 'el mensaje del RPC no viaja de vuelta').not.toContain('permission denied')
    expect(remove, 'el justificante huérfano se limpia').toHaveBeenCalledWith([`${UID}/justificante.pdf`])
  })

  it('si además falla la limpieza, lo deja anotado y sigue siendo técnico', async () => {
    rpc.mockResolvedValue({ error: { message: 'boom' } })
    remove.mockResolvedValue({ error: { message: 'no se pudo borrar' } })
    const anotado = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(await uploadEducationalProof(UID, PDF_VALIDO())).toEqual({ error: 'tecnico' })
    expect(anotado, 'un huérfano que nadie puede borrar tiene que quedar en el log').toHaveBeenCalled()

    anotado.mockRestore()
  })

  it('conserva la extensión real del archivo en la ruta', async () => {
    await uploadEducationalProof(UID, archivo('carne.PNG', 'image/png'))
    expect(rpc).toHaveBeenCalledWith('registrar_mi_justificante', { p_ruta: `${UID}/justificante.png` })
  })
})
