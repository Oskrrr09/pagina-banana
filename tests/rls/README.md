# Pruebas de políticas RLS

Comprueban que las políticas de fila de Supabase hacen lo que dicen: que un
visitante no puede leer, editar ni escribir en los datos de otro, y que un
cliente no puede ver pedidos ajenos ni aprobarse el descuento educativo.

## Por qué no están en la suite E2E

RLS es una característica de Postgres. Comprobarla exige una base de datos
real. Un mock devolvería lo que yo le programe, que es justo la afirmación que
se quiere verificar — así que una prueba con mocks aquí no probaría nada y
daría una falsa sensación de cobertura.

## Opción recomendada: Supabase local

El repositorio incluye la CLI, `supabase/config.toml` y un seed deliberadamente
sin credenciales. Los usuarios y datos A/B se crean por las APIs reales en la
propia suite y se limpian al terminar; así también se prueba GoTrue.

Requisito externo: Docker Desktop o un daemon Docker compatible.

```sh
npm ci
npm run supabase:start
npm run supabase:reset
npm run test:integration
npm run supabase:stop
```

`test:integration` obtiene URL y claves efímeras mediante
`supabase status -o json`; no las imprime ni las guarda en archivos. CI ejecuta
la misma secuencia desde `.github/workflows/supabase-integration.yml` y no usa
secretos de la demostración.

## Alternativa: proyecto dedicado alojado

Un **proyecto de Supabase dedicado a pruebas**. Nunca el de la demostración:
las pruebas crean y borran filas, y una de ellas intenta escribir datos ajenos
a propósito.

En ese proyecto:

1. Aplicar la fuente ejecutable única:
   `supabase/migrations/20260802000100_estado_seguro.sql`. Con la CLI se hace
   mediante `supabase db reset` en una base nueva o `supabase db push` sobre
   una ya desplegada. `supabase/schema.sql` es solo un puntero y **no se
   ejecuta**.
2. Activar **Authentication → Providers → Anonymous sign-ins**.
3. Desactivar la confirmación por email (Authentication → Providers → Email),
   para que el alta de clientes de prueba no se quede esperando un correo.

Y tres variables de entorno:

```sh
export RLS_TEST_URL=https://<proyecto-de-pruebas>.supabase.co
export RLS_TEST_ANON_KEY=<clave anónima>
export RLS_TEST_SERVICE_KEY=<clave de servicio>

npm run test:rls
```

La clave de servicio se usa **solo** para montar el escenario y limpiar al
terminar. No entra en el bundle, no se lee desde `import.meta.env` y no lleva
prefijo `VITE_`, que es lo que la expondría.

## Qué ya está comprobado sin ellas

`npm run test:schema` instala las migraciones en **PostgreSQL real**
(PGlite, Postgres 18 en WebAssembly, sin Docker) y comprueba el
comportamiento de las políticas: aislamiento entre visitantes, suplantación
del bot y del agente, alta de clientes, reservas y justificantes. La suite
forma parte de `npm run test:unit`; el conteo exacto lo informa Vitest en cada
ejecución.

Lo que ese arnés **no** cubre, y por lo que estas siguen haciendo falta:

- **GoTrue**: el alta real de usuarios y las sesiones anónimas. Allí
  `auth.uid()` se simula.
- **Storage de Supabase**: `storage.objects` es una imitación, así que las
  políticas de Storage se comprueban en su forma, no en su integración con el
  servicio real.
- **PostgREST**: cómo traduce las peticiones y aplica los roles.

## Estado actual en esta máquina

**Docker Desktop ya está instalado** (2026-08-06) y se usó para los respaldos de
Supabase, así que `npm run test:integration` puede ejecutarse aquí. Las cifras
que se registran en la documentación siguen siendo **las de CI**, porque la
suite local completa no se ha vuelto a ejecutar desde entonces.

Si Docker no estuviera disponible, `npm run test:integration` falla antes de
consultar Supabase con un diagnóstico explícito. La suite no cae nunca sobre la
demostración como alternativa silenciosa.

La suite tiene actualmente **33 casos** —27 más los seis que separan la sesión anónima del chat de una cuenta de cliente permanente— y ya usa la API final: RPC de chat,
agentes y reservas, GoTrue real y operaciones reales de Storage. La versión
anterior tenía 21 casos, pero varios seguían insertando directamente en
`mensajes` y `reservas`, permisos que el esquema final retiró; por eso no era
válido configurar secretos y ejecutarla sin actualizarla primero.

El workflow anterior, dependiente de secretos, conservaba un informe JSON y un
recuento exacto. Se mantiene ese verificador como regresión unitaria, pero CI
usa ahora Supabase local y deja que Playwright falle directamente ante una
prueba omitida o fallida.

Con el arnés de PGlite lo que falta por verificar se ha reducido mucho —las
políticas ya están probadas contra Postgres— pero **no a cero**: la
integración con GoTrue y Storage sigue sin comprobarse.

Sin ese proyecto dedicado, `test.skip` las marca como omitidas con el motivo
escrito. No se declaran verdes.
