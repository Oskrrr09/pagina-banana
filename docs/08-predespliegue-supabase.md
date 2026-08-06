---
tipo: predespliegue
actualizado: 2026-08-06
---

# Predespliegue de Supabase

Estado del despliegue de la migración de seguridad al proyecto de la
demostración. **Las cuatro migraciones ya están aplicadas en producción**
(2026-08-06); lo que queda es publicar el frontend y activar los inicios de
sesión anónimos, en ese orden.

> [!warning] Situación actual: base nueva, frontend viejo
> La base ya tiene el esquema seguro, pero GitHub Pages sigue sirviendo el
> frontend anterior, que escribe directamente en las tablas. Ese frontend ya no
> puede hacerlo, así que **el chat de la web pública no funciona ahora mismo**.
> Se arregla fusionando la PR #35 y dejando que se publique. Mientras tanto la
> tienda —catálogo, carrito, comparador, checkout demostrativo— sigue
> funcionando con normalidad, porque no depende de Supabase.

## 1. Pasos completados

Verificado el 2026-08-06.

### Respaldo

- Copia completa hecha **fuera del repositorio**: roles, esquema, datos,
  evidencia del historial previo, cambios personalizados de `auth` y `storage`
  y **los archivos físicos del bucket**.
- El repositorio quedó limpio: los respaldos **no** están versionados en Git.

### Entorno

- Docker Desktop instalado y en marcha, que es lo que faltaba para poder
  ejecutar la CLI contra contenedores y las suites de integración.
- CLI de Supabase enlazada al proyecto remoto.

### Migraciones

- Las **cuatro** migraciones aplicadas correctamente:
  1. `20260802000100_estado_seguro.sql`
  2. `20260804000200_minimiza_chat_y_limita_storage.sql`
  3. `20260805000300_permisos_de_tabla.sql`
  4. `20260806000400_separa_sesiones_anonimas.sql`
- `supabase migration list` muestra los **cuatro identificadores iguales en
  Local y en Remote**.
- `supabase db push --dry-run` responde `Remote database is up to date`.

### Verificación en producción

- Políticas RLS, funciones y condiciones de seguridad comprobadas contra el
  proyecto real.
- Las **cinco comprobaciones SQL** de seguridad devolvieron `true`. El texto
  exacto de las consultas queda en la sesión de quien las ejecutó; aquí se
  registra el resultado, no su contenido.
- Comprobación independiente por API pública de sólo lectura, el 2026-08-06:
  el rol anónimo ya **no lee ninguna fila** de `visitantes`, `conversaciones`,
  `mensajes` ni `clientes`. Antes de migrar leía **36 filas de `visitantes`**
  con nombre, email y teléfono. La exposición que motivó todo este trabajo está
  cerrada.

### Authentication

| Ajuste                        | Estado verificado                |
| ----------------------------- | -------------------------------- |
| Allow new users to sign up    | **activado**                     |
| Allow manual linking          | **activado**                     |
| Confirm sign up               | **desactivado**, y debe seguir así |
| Allow anonymous sign-ins      | **todavía desactivado**          |
| Límite de anonymous sign-ins  | **30 por hora e IP**             |
| CAPTCHA / Turnstile           | **no localizado / no configurado** |

### CI

- Los secretos `SUPABASE_URL` y `SUPABASE_ANON_KEY` existen en GitHub Actions.
- El CI de la rama está en verde.

## 2. Pasos pendientes

### Publicar el frontend

Es lo único que separa a la web pública de volver a tener chat. Sale de fusionar
la PR #35: el flujo de CI publica en GitHub Pages al llegar a `main`.

### Activar Allow anonymous sign-ins

- Sigue **desactivado**, y así debe quedarse hasta que el frontend nuevo esté
  publicado.
- El orden ya no es peligroso por el lado de la base —la migración que separa
  las sesiones anónimas está aplicada—, pero activarlo antes de publicar no
  sirve de nada: el frontend viejo no sabe usar sesiones anónimas.
- Mientras siga desactivado, el chat del frontend nuevo **no se rompe**: cae a
  modo demostración con un aviso en consola.

### CAPTCHA — no activar todavía

- **No se ha localizado ni configurado.** No se declara activo.
- Activarlo **no es un interruptor**: el frontend tendría que enviar el token
  del captcha en `signInAnonymously()`, y **hoy no lo hace**. Encenderlo sin esa
  implementación dejaría el chat sin poder abrir sesión.
- El límite de 30 por hora e IP ya está puesto y cubre el abuso más obvio
  mientras tanto.

### Confirm sign up — debe permanecer desactivado

- El backend hace lo correcto en las dos configuraciones —el email primero, la
  contraseña sólo tras verificarlo, y ninguna ficha de cliente mientras la
  sesión siga siendo anónima—, pero **la interfaz no sabe terminar el registro**
  con la confirmación activada: `signUp()` devuelve `needsEmailConfirmation`
  antes de poder fijar la contraseña, `RegisterPage` manda a iniciar sesión, y
  no hay contraseña con la que hacerlo ni pantalla donde establecerla al volver
  del correo.
- Los cinco casos de `tests/confirmacion/conversion.spec.ts` validan el
  **procedimiento de backend y la seguridad**, no el recorrido en el navegador.
- Soportarlo entero es tarea aparte:
  [[03-roadmap#5.2 Registro con Confirm Email activado]].

### Limpieza de cuentas anónimas antiguas

- Sigue **sin procedimiento**. Supabase no las borra solo.
- Cuidado con el orden: `visitantes.auth_id` es `ON DELETE SET NULL`, así que
  borrar el usuario de Auth **no** se lleva su ficha de visitante, la deja
  huérfana. Hay que borrar primero por `auth_id` y después el usuario, que es lo
  que hace el `afterAll` de `tests/rls/politicas.spec.ts`.

### Pruebas de humo en producción

Tras publicar: chat, `/cuenta`, reserva, justificante educativo y panel
`/agente`.

## 3. Orden restante

1. Revisar este commit documental.
2. Comprobar que el CI está en verde.
3. Sacar la PR #35 de borrador.
4. Fusionar a `main`.
5. Esperar a que termine el despliegue de GitHub Pages.
6. Activar **Allow anonymous sign-ins**.
7. Pruebas de humo en producción.

Los pasos 3 a 7 son decisiones y acciones del responsable del proyecto.

## Comandos de referencia

Se conservan por si hiciera falta repetir el respaldo o revisar el estado.
Sintaxis comprobada con `--help` en la CLI 2.111.0.

```sh
# Respaldo, cada pieza en su fichero.
supabase db dump --linked --role-only -f respaldo/01-roles.sql
supabase db dump --linked             -f respaldo/02-esquema-publico.sql
supabase db dump --linked --data-only --use-copy -f respaldo/03-datos-publicos.sql
supabase db dump --linked --schema supabase_migrations -f respaldo/04-historial-esquema.sql
supabase db dump --linked --schema supabase_migrations --data-only --use-copy \
  -f respaldo/05-historial-datos.sql

# Lo PERSONALIZADO de auth y storage, no el esquema estándar que gestiona
# Supabase: `db dump` devolvería este último, que ni se restaura ni interesa.
supabase db diff --linked --schema auth,storage > respaldo/06-auth-storage-personalizado.sql

# Estado del despliegue.
supabase migration list
supabase db push --dry-run
```

`--dry-run` imprime el `pg_dump` que se ejecutaría sin ejecutarlo; conviene
pasar por ahí los volcados de `supabase_migrations` antes de confiar en ellos
como copia restaurable.

### Configuración del bucket

Método principal, la API oficial de Storage. La clave viaja en la cabecera y no
se imprime:

```sh
curl -s -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$SUPABASE_URL/storage/v1/bucket/descuentos-educativos" \
  > respaldo/07-bucket-config.json
```

No se usa `/rest/v1/buckets`: depende de que PostgREST exponga el esquema
`storage`, y este proyecto sólo publica `public` y `graphql_public`. Tampoco
vale `db dump --table`, que **no existe** en la CLI; lo que hay es `--exclude`.

### Los archivos del bucket

El volcado de PostgreSQL guarda **los metadatos de los objetos, no los
objetos**: `storage.objects` es un índice y los bytes viven en Storage.

```sh
mkdir -p respaldo/objetos
supabase storage cp --experimental --linked --recursive \
  ss:///descuentos-educativos respaldo/objetos/
```

Forma confirmada con `supabase storage cp --help`: `[flags] <src> <dst>`, origen
remoto con el esquema `ss:///<bucket>/<ruta>`, `--recursive` disponible y
`--experimental` exigido por el subcomando.

Ver
[[04-problemas-pendientes#SEC-RLS-001 — Falta validar y desplegar la migración segura]]
y
[[04-problemas-pendientes#SEG-ANON-001 — Una sesión anónima del chat valía como cuenta de cliente]].
