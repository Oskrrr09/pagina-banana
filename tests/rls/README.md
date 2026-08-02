# Pruebas de políticas RLS

Comprueban que las políticas de fila de Supabase hacen lo que dicen: que un
visitante no puede leer, editar ni escribir en los datos de otro, y que un
cliente no puede ver pedidos ajenos ni aprobarse el descuento educativo.

## Por qué no están en la suite E2E

RLS es una característica de Postgres. Comprobarla exige una base de datos
real. Un mock devolvería lo que yo le programe, que es justo la afirmación que
se quiere verificar — así que una prueba con mocks aquí no probaría nada y
daría una falsa sensación de cobertura.

## Qué hace falta para ejecutarlas

Un **proyecto de Supabase dedicado a pruebas**. Nunca el de la demostración:
las pruebas crean y borran filas, y una de ellas intenta escribir datos ajenos
a propósito.

En ese proyecto:

1. Aplicar `supabase/schema.sql` y luego los ficheros de
   `supabase/migraciones/` en orden.
2. Activar **Authentication → Providers → Anonymous sign-ins**.
3. Desactivar la confirmación por email (Authentication → Providers → Email),
   para que el alta de clientes de prueba no se quede esperando un correo.

Y tres variables de entorno:

```sh
export RLS_TEST_URL=https://<proyecto-de-pruebas>.supabase.co
export RLS_TEST_ANON_KEY=<clave anónima>
export RLS_TEST_SERVICE_KEY=<clave de servicio>

npx playwright test --project=rls
```

La clave de servicio se usa **solo** para montar el escenario y limpiar al
terminar. No entra en el bundle, no se lee desde `import.meta.env` y no lleva
prefijo `VITE_`, que es lo que la expondría.

## Estado actual

**No se han ejecutado.** El entorno de desarrollo no tiene Docker ni la CLI de
Supabase, así que no se puede levantar Postgres en local, y los secretos que
hay configurados en GitHub Actions (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
apuntan al proyecto de la demostración, que no debe usarse para esto.

Sin ese proyecto dedicado, `test.skip` las marca como omitidas con el motivo
escrito. No se declaran verdes.

## Alternativa sin proyecto en la nube

Si se prefiere no depender de un proyecto alojado, la CLI de Supabase levanta
todo en local con Docker:

```sh
supabase start
supabase db reset            # aplica schema.sql y las migraciones
```

y las mismas variables apuntando a `http://127.0.0.1:54321`. Requiere Docker
instalado, que es el requisito externo que hoy falta.
