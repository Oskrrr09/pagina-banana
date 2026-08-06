---
tipo: sesion
fecha: 2026-08-06
tema: sesiones anónimas, DELETE de Storage y migración aplicada en producción
---

# Sesiones anónimas, DELETE de Storage y migración aplicada en producción

## Objetivo

Cerrar los bloqueos de seguridad que quedaban en la PR #35 y, una vez cerrados,
llevar la migración al proyecto real de Supabase con respaldo previo y
verificación posterior.

## Estado inicial

CI en verde con las cuatro comprobaciones, pero con dos huecos detectados en
revisión: las sesiones anónimas del chat valían como cuentas de cliente, y el
DELETE del bucket educativo no exigía cuenta permanente. Ninguna migración
estaba aplicada en producción y la máquina no tenía Docker.

## Trabajo realizado

### Separación de sesiones anónimas

`signInAnonymously()` no crea un rol aparte: Supabase le da a la sesión anónima
el mismo rol PostgreSQL que a una cuenta real, `authenticated`, y la única
diferencia es el reclamo `is_anonymous` del JWT. Nadie lo miraba, así que abrir
el widget del chat bastaba para quedar dado de alta en `clientes` —el proveedor
creaba la ficha solo— y para poder crear pedidos, reservas y justificantes.

Se cierra con `public.es_usuario_permanente()` aplicada de tres formas:
políticas **restrictivas** en `clientes`, `pedidos` y `reservas`; condición
incorporada en las políticas del bucket, porque una restrictiva sobre
`storage.objects` alcanzaría a todos los buckets del proyecto; y comprobación
dentro de cada RPC de cliente, que al ser `security definer` no pasa por RLS.

### DELETE del bucket

Se había quedado fuera, y era el más delicado: la carpeta se llama como el
`auth.uid()` y la conversión de anónimo a permanente **conserva ese uid**, de
modo que un token anónimo emitido antes de convertir seguía siendo válido y
apuntaba a la carpeta de la cuenta ya registrada.

### Registro en dos pasos

Se hacía `updateUser({ email, password })` en una llamada, que sólo funciona con
la confirmación de email desactivada. Ahora va el email primero y la contraseña
sólo tras verificarlo, y **quién decide si hace falta confirmar es el servidor**,
no una suposición: si tras refrescar la sesión sigue siendo anónima, se devuelve
`needsEmailConfirmation` y no se crea ninguna ficha.

### Despliegue de la base de datos

Con Docker Desktop ya instalado:

1. Respaldo completo **fuera del repositorio** —roles, esquema, datos, evidencia
   del historial previo, personalizaciones de `auth`/`storage` y los archivos
   físicos del bucket—, dejando el repositorio limpio y los respaldos fuera de
   Git.
2. `supabase link` contra el proyecto remoto.
3. `supabase migration list` y `db push --dry-run` antes de tocar nada.
4. Aplicación de las **cuatro** migraciones.
5. `migration list` final: los cuatro identificadores iguales en Local y Remote.
6. `db push --dry-run`: `Remote database is up to date`.
7. Verificación de políticas RLS, funciones y condiciones de seguridad, con las
   **cinco comprobaciones SQL** devolviendo `true`.

## Decisiones tomadas

- [[02-decisiones#D-059]]: una sesión anónima no es una sesión de cliente, y la
  condición se escribe en tres capas según lo que sea seguro en cada sitio.
- [[02-decisiones#D-060]]: el registro convierte la sesión anónima en vez de
  reemplazarla, para conservar el chat, y sigue el orden documentado de dos
  pasos.
- [[02-decisiones#D-061]]: la base se migra antes que el frontend, y los
  inicios anónimos se activan al final. Se acepta a cambio que el chat público
  quede sin servicio en la ventana intermedia.
- Confirm sign up debe **permanecer desactivado**: el backend lo soporta, la
  interfaz no sabe terminar el registro con la confirmación activada.

## Comprobaciones

- CI en verde: 182 unitarias y de esquema, 36 RLS, 5 de conversión con
  confirmación activada, 2 de integración, 296 E2E aprobadas y 1 omitida en los
  cinco motores, 6 del panel aislado.
- Producción, por API pública de sólo lectura: el rol anónimo pasó de leer **36
  filas de `visitantes`** —con nombre, email y teléfono— a **no leer ninguna**.
  También cero en `conversaciones`, `mensajes` y `clientes`.
- Authentication: alta de usuarios **activada**, enlazado manual **activado**,
  confirmación de registro **desactivada**, inicios anónimos **todavía
  desactivados**, límite de **30 por hora e IP**, CAPTCHA **no localizado ni
  configurado**.
- Secretos `SUPABASE_URL` y `SUPABASE_ANON_KEY` presentes en GitHub Actions.

## Archivos afectados

- `supabase/migrations/20260806000400_separa_sesiones_anonimas.sql` (nuevo)
- `src/lib/customerAuth.tsx`
- `tests/schema/anonimos.test.ts`, `tests/confirmacion/conversion.spec.ts`,
  `tests/integration/chat-anonimo.spec.ts` (nuevos)
- `tests/rls/politicas.spec.ts`, `tests/schema/{andamio,funciones,instalacion}.ts`
- `scripts/test-supabase-confirmacion.mjs` (nuevo), `scripts/test-supabase-local.mjs`
- `playwright.config.ts`, `package.json`, `.github/workflows/supabase-integration.yml`
- `docs/08-predespliegue-supabase.md` (nuevo) y el resto de documentos de estado

## Siguiente paso

Por este orden: revisar el commit documental, comprobar el CI, sacar la PR #35
de borrador, fusionar, esperar el despliegue de GitHub Pages, activar
**Allow anonymous sign-ins** y hacer pruebas de humo en producción —chat,
`/cuenta`, reserva, justificante y panel `/agente`—.

Hasta que se publique, el chat de la web pública no funciona: la base ya rechaza
las escrituras directas del frontend anterior. Ver [[08-predespliegue-supabase]].
