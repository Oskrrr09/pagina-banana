import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Vigila el SQL sin necesidad de una base de datos.
//
// Las pruebas de RLS de verdad (`tests/rls/`) necesitan Postgres y hoy no se
// pueden ejecutar aquí. Estas no lo sustituyen —comprueban el texto, no el
// comportamiento— pero sí evitan la regresión concreta que ya ocurrió: la
// migración cerró las políticas abiertas y `schema.sql` seguía recreándolas,
// así que volver a ejecutarlo deshacía la seguridad entera.

const RUTA_ESQUEMA = join(process.cwd(), 'supabase/schema.sql')
const DIR_MIGRACIONES = join(process.cwd(), 'supabase/migraciones')

/** Todo el SQL del proyecto: el esquema y sus migraciones. */
function todoElSql(): { fichero: string; sql: string }[] {
  const salida = [{ fichero: 'schema.sql', sql: readFileSync(RUTA_ESQUEMA, 'utf8') }]
  for (const f of readdirSync(DIR_MIGRACIONES).filter((f) => f.endsWith('.sql'))) {
    salida.push({ fichero: f, sql: readFileSync(join(DIR_MIGRACIONES, f), 'utf8') })
  }
  return salida
}

/**
 * Quita los comentarios antes de buscar.
 *
 * Hace falta de verdad: el propio esquema explica en un comentario que ahí
 * hubo un `using (true)`, y sin esto la prueba se dispararía con su propia
 * documentación.
 */
function sinComentarios(sql: string): string {
  return sql
    .split('\n')
    .filter((linea) => !linea.trimStart().startsWith('--'))
    .join('\n')
}

test('ninguna política deja el acceso abierto a datos personales', () => {
  const abiertas: string[] = []

  for (const { fichero, sql } of todoElSql()) {
    const limpio = sinComentarios(sql)
    // Se recorre política a política para poder decir cuál es, en vez de
    // limitarse a "hay un using(true) por ahí".
    for (const bloque of limpio.split(/create policy/i).slice(1)) {
      const cuerpo = bloque.split(/;\s*$/m)[0]
      const nombre = cuerpo.match(/"([^"]+)"/)?.[1] ?? '(sin nombre)'
      if (/\busing\s*\(\s*true\s*\)|\bwith\s+check\s*\(\s*true\s*\)/i.test(cuerpo)) {
        abiertas.push(`${fichero}: «${nombre}»`)
      }
    }
  }

  expect(
    abiertas,
    'Estas políticas dan acceso incondicional. Si alguna es legítima, ' +
      'documenta por qué y añádela a la excepción de esta prueba:\n  ' +
      abiertas.join('\n  '),
  ).toEqual([])
})

test('el visitante no puede escribir mensajes firmados por el bot o el agente', () => {
  const { sql } = todoElSql().find((f) => f.fichero === 'schema.sql')!
  const limpio = sinComentarios(sql)

  const politicaVisitante = limpio
    .split(/create policy/i)
    // `.slice(1)`: el trozo 0 es todo lo anterior al primer `create policy`, y
    // ahí están los `drop policy if exists`, que mencionan el mismo nombre.
    .slice(1)
    .find((b) => /^\s*"visitante manda mensaje"/.test(b))

  expect(politicaVisitante, 'debe existir la política de mensajes del visitante').toBeTruthy()
  expect(
    politicaVisitante,
    "la política debe fijar autor = 'visitor'; permitir 'bot' o 'agent' deja " +
      'suplantarlos desde el navegador',
  ).toMatch(/autor\s*=\s*'visitor'/)
  expect(politicaVisitante).not.toMatch(/autor\s+in\s*\(/i)
})

test('el esquema no conserva la versión de enviar_valoracion que se fía del cliente', () => {
  for (const { fichero, sql } of todoElSql()) {
    // La firma antigua recibía `p_visitor_id` del navegador: quien conociera
    // los dos UUID podía puntuar la conversación de otro.
    const declaraLaVieja = /create or replace function public\.enviar_valoracion\([^)]*p_visitor_id/is.test(
      sql,
    )
    expect(declaraLaVieja, `${fichero} declara la versión antigua`).toBe(false)
  }
})

test('toda función security definer fija su search_path', () => {
  const sinRuta: string[] = []

  for (const { fichero, sql } of todoElSql()) {
    for (const bloque of sinComentarios(sql).split(/create or replace function/i).slice(1)) {
      const cabecera = bloque.split(/\bas\s+\$\$/i)[0]
      if (!/security\s+definer/i.test(cabecera)) continue
      if (!/set\s+search_path\s*=/i.test(cabecera)) {
        const nombre = bloque.trim().split(/[(\s]/)[0]
        sinRuta.push(`${fichero}: ${nombre}`)
      }
    }
  }

  expect(
    sinRuta,
    'Una función `security definer` sin `search_path` fijo es una vía de ' +
      'escalada: quien controle su search_path puede anteponer una tabla ' +
      'propia y hacer que la función escriba donde no debe.\n  ' +
      sinRuta.join('\n  '),
  ).toEqual([])
})

test('las funciones de escritura no reciben el identificador del propietario', () => {
  // El dueño sale siempre de `auth.uid()`. Aceptarlo por parámetro es pedirle
  // al cliente la respuesta a la pregunta que hay que comprobar.
  const sospechosas: string[] = []
  const deEscritura = [
    'actualizar_mi_ficha',
    'registrar_mi_justificante',
    'cancelar_mi_reserva',
    'vincular_mi_visitante_a_cliente',
    'enviar_valoracion',
    'abrir_conversacion',
  ]

  for (const { fichero, sql } of todoElSql()) {
    for (const nombre of deEscritura) {
      const re = new RegExp(
        `create or replace function public\\.${nombre}\\s*\\(([^)]*)\\)`,
        'is',
      )
      const params = sql.match(re)?.[1] ?? ''
      if (/p_(cliente_id|visitor_id|usuario|user_id|uid)\b/i.test(params)) {
        sospechosas.push(`${fichero}: ${nombre}`)
      }
    }
  }

  expect(sospechosas, `Reciben el propietario por parámetro:\n  ` + sospechosas.join('\n  ')).toEqual(
    [],
  )
})
