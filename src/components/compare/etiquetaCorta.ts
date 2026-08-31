// ============================================================================
// CÓMO SE NOMBRA UN PRODUCTO DENTRO DE UN ATRIBUTO.
//
// EL PROBLEMA
//
// En la comparación vertical, cada valor va precedido del producto al que
// pertenece. Repetir «iPhone 17 Pro», «iPhone 17» y «iPhone 17 Pro Max» en
// cada uno de los siete bloques es ruido: la palabra que se repite es
// justamente la que no distingue nada.
//
// LA REGLA, SIN LISTA DE EXCEPCIONES
//
// Se quita el prefijo común de PALABRAS de toda la familia, no del par que se
// está comparando. Calculado sobre el catálogo real:
//
//   iPhone 17 Pro · iPhone 17 Pro Max · iPhone Air · iPhone 17
//     → prefijo «iPhone»        → 17 Pro · 17 Pro Max · Air · 17
//   iPad Pro M5 · iPad Air M4 · iPad mini · iPad A16
//     → prefijo «iPad»          → Pro M5 · Air M4 · mini · A16
//   Apple Watch Ultra 3 · Apple Watch Series 11 · Apple Watch SE 3
//     → prefijo «Apple Watch»   → Ultra 3 · Series 11 · SE 3
//   AirPods Pro 3 · AirPods 4 · AirPods Max · AirPods 4 con Cancelación…
//     → prefijo «AirPods»       → Pro 3 · 4 · Max · 4 con Cancelación…
//   MacBook Air M4 · Mac Studio · iMac 24" M4 · Mac mini M4
//     → NO hay prefijo común    → nombres completos
//
// Se calcula sobre la familia entera y no sobre lo comparado porque el par
// «iPhone 17» / «iPhone 17 Pro» comparte «iPhone 17», y recortar ahí dejaría
// una etiqueta vacía y otra «Pro»: perderíamos el modelo base.
//
// TRES RESERVAS, Y SI SALTA ALGUNA SE USA EL NOMBRE ENTERO
//
//   1. no hay prefijo común de la familia;
//   2. alguna abreviatura quedaría vacía;
//   3. dos productos de esta comparación quedarían con la misma etiqueta.
//
// Nunca se corta por la mitad ni se trunca: o es una abreviatura completa e
// inequívoca, o es el nombre tal cual.
// ============================================================================

/** El prefijo común de palabras de una lista de nombres. Vacío si no lo hay. */
function prefijoComunDePalabras(nombres: readonly string[]): string[] {
  if (nombres.length === 0) return []
  const porPalabras = nombres.map((n) => n.trim().split(/\s+/))
  const comun: string[] = []
  for (let i = 0; i < porPalabras[0].length; i++) {
    const palabra = porPalabras[0][i]
    if (!porPalabras.every((p) => p[i] === palabra)) break
    comun.push(palabra)
  }
  // Un prefijo que se coma TODO el nombre más corto no sirve como prefijo.
  while (comun.length > 0 && porPalabras.some((p) => p.length <= comun.length)) comun.pop()
  return comun
}

/**
 * Etiquetas cortas para los productos comparados.
 *
 * @param nombresComparados los nombres de los productos que se están comparando
 * @param nombresDeLaFamilia todos los nombres de la familia, de donde sale el prefijo
 * @returns una etiqueta por producto comparado, en el mismo orden
 */
export function etiquetasCortas(nombresComparados: readonly string[], nombresDeLaFamilia: readonly string[]): string[] {
  const completos = [...nombresComparados]
  if (completos.length < 2) return completos

  const prefijo = prefijoComunDePalabras(nombresDeLaFamilia)
  if (prefijo.length === 0) return completos

  const cortas = completos.map((nombre) => {
    const palabras = nombre.trim().split(/\s+/)
    const empieza = prefijo.every((p, i) => palabras[i] === p)
    return empieza ? palabras.slice(prefijo.length).join(' ') : nombre
  })

  if (cortas.some((c) => c.length === 0)) return completos
  if (new Set(cortas).size !== cortas.length) return completos
  return cortas
}
