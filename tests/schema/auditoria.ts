import type { PGlite } from '@electric-sql/pglite'
import { FUNCIONES, PARAMETROS_PROHIBIDOS, type Clasificacion } from './funciones'

type Queryable = Pick<PGlite, 'query'>

export interface FuncionCatalogada {
  oid: number
  identidadPostgres: string
  firma: string
  argumentos: string
  securityDefiner: boolean
  configuracion: string[]
  ejecuta: string[]
  clasificacion: Clasificacion | null
}

interface FuncionRow {
  oid: number
  nombre: string
  identidad: string
  argumentos_identidad: string
  nombres_argumentos: string[] | null
  argumentos: string
  definer: boolean
  configuracion: string[] | null
}

/**
 * Convierte la identidad que devuelve PostgreSQL en la clave canónica usada
 * por la auditoría. Los nombres salen de `proargnames`; no se adivinan
 * cortando el primer token del tipo, que rompería tipos como
 * `timestamp with time zone`.
 */
export function normalizarFirmaIdentidad(
  nombre: string,
  argumentosIdentidad: string,
  nombres: string[] | null,
): string {
  if (!argumentosIdentidad.trim()) return `${nombre}()`
  const partes = argumentosIdentidad.split(',').map((parte) => parte.trim().replace(/\s+/g, ' '))
  const tipos = partes.map((parte, indice) => {
    const nombreArgumento = nombres?.[indice]
    if (!nombreArgumento) return parte
    const prefijo = new RegExp(`^(?:IN\\s+|INOUT\\s+|VARIADIC\\s+)?${nombreArgumento}\\s+`, 'i')
    return parte.replace(prefijo, '').replace(/\s+/g, ' ').trim()
  })
  return `${nombre}(${tipos.join(',')})`
}

/**
 * Inventario único de las funciones propias. Las funciones de extensiones se
 * excluyen por su dependencia real en `pg_depend`, no por `proname`: una
 * sobrecarga del proyecto con el mismo nombre seguiría apareciendo.
 */
export async function catalogarFunciones(db: Queryable): Promise<FuncionCatalogada[]> {
  const { rows } = await db.query<FuncionRow>(
    `select p.oid::int as oid,
            p.proname as nombre,
            p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as identidad,
            pg_get_function_identity_arguments(p.oid) as argumentos_identidad,
            p.proargnames as nombres_argumentos,
            pg_get_function_arguments(p.oid) as argumentos,
            p.prosecdef as definer,
            p.proconfig as configuracion
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and not exists (
          select 1
            from pg_depend d
            join pg_extension e on e.oid = d.refobjid
           where d.classid = 'pg_proc'::regclass
             and d.objid = p.oid
             and d.deptype = 'e'
        )
      order by p.proname, pg_get_function_identity_arguments(p.oid)`,
  )

  const { rows: acl } = await db.query<{ oid: number; rol: string }>(
    `select distinct p.oid::int as oid,
            coalesce(r.rolname, 'PUBLIC') as rol
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
       left join pg_roles r on r.oid = a.grantee
      where n.nspname = 'public'
        and a.privilege_type = 'EXECUTE'
        and coalesce(r.rolname, 'PUBLIC') <> pg_get_userbyid(p.proowner)
        and not exists (
          select 1
            from pg_depend d
            join pg_extension e on e.oid = d.refobjid
           where d.classid = 'pg_proc'::regclass
             and d.objid = p.oid
             and d.deptype = 'e'
        )
      order by p.oid::int, rol`,
  )
  const roles = new Map<number, string[]>()
  for (const permiso of acl) {
    roles.set(permiso.oid, [...(roles.get(permiso.oid) ?? []), permiso.rol])
  }

  return rows.map((row) => {
    const firma = normalizarFirmaIdentidad(
      row.nombre,
      row.argumentos_identidad,
      row.nombres_argumentos,
    )
    return {
      oid: row.oid,
      identidadPostgres: row.identidad,
      firma,
      argumentos: row.argumentos,
      securityDefiner: row.definer,
      configuracion: row.configuracion ?? [],
      ejecuta: roles.get(row.oid) ?? [],
      clasificacion: FUNCIONES[firma] ?? null,
    }
  })
}

export interface ResultadoAuditoria {
  catalogo: FuncionCatalogada[]
  problemas: string[]
}

/** Audita el catálogo final completo con una sola fuente de reglas. */
export async function auditarCatalogo(db: Queryable): Promise<ResultadoAuditoria> {
  const catalogo = await catalogarFunciones(db)
  const problemas: string[] = []
  const porFirma = new Map(catalogo.map((funcion) => [funcion.firma, funcion]))

  for (const funcion of catalogo) {
    const clasificacion = funcion.clasificacion
    if (!clasificacion) {
      problemas.push(`función inesperada o sin clasificar: ${funcion.firma}`)
      continue
    }
    const ejecutaEsperado = [...clasificacion.ejecuta].sort()
    if (JSON.stringify(funcion.ejecuta) !== JSON.stringify(ejecutaEsperado)) {
      problemas.push(
        `${funcion.firma}: EXECUTE esperado [${ejecutaEsperado}] · real [${funcion.ejecuta}]`,
      )
    }
    if (funcion.ejecuta.includes('PUBLIC')) {
      problemas.push(`${funcion.firma}: conserva EXECUTE para PUBLIC`)
    }
    if (funcion.securityDefiner !== clasificacion.securityDefiner) {
      problemas.push(
        `${funcion.firma}: SECURITY DEFINER esperado ${clasificacion.securityDefiner} · ` +
          `real ${funcion.securityDefiner}`,
      )
    }
    if (
      funcion.securityDefiner &&
      !funcion.configuracion.some((valor) => valor.startsWith('search_path='))
    ) {
      problemas.push(`${funcion.firma}: SECURITY DEFINER sin search_path fijo`)
    }
    for (const prohibido of PARAMETROS_PROHIBIDOS) {
      if (!new RegExp(`\\b${prohibido}\\b`).test(funcion.argumentos)) continue
      if (prohibido in (clasificacion.parametrosPermitidos ?? {})) continue
      problemas.push(`${funcion.firma}: parámetro sensible no permitido ${prohibido}`)
    }
  }

  for (const firma of Object.keys(FUNCIONES)) {
    if (!porFirma.has(firma)) problemas.push(`falta la función clasificada ${firma}`)
  }

  const firmas = catalogo.map((funcion) => funcion.firma)
  if (new Set(firmas).size !== firmas.length) {
    problemas.push('el catálogo contiene firmas duplicadas')
  }

  return { catalogo, problemas }
}

/** Representación estable para comparar instalación e idempotencia. */
export function serializarCatalogo(catalogo: FuncionCatalogada[]): string {
  return JSON.stringify(
    catalogo.map((funcion) => ({
      firma: funcion.firma,
      argumentos: funcion.argumentos,
      securityDefiner: funcion.securityDefiner,
      configuracion: funcion.configuracion,
      ejecuta: funcion.ejecuta,
      categoria: funcion.clasificacion?.categoria ?? null,
    })),
  )
}
