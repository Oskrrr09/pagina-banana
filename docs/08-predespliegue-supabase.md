---
tipo: predespliegue
actualizado: 2026-08-06
---

# Predespliegue de Supabase

Lo que hay que dejar resuelto **antes** de aplicar las migraciones y publicar el
frontend. Nada de esto se ha ejecutado todavía: el repositorio no está enlazado
a ningún proyecto remoto y no se ha tocado el Dashboard.

> [!warning] Ninguna de las opciones de esta página se ha comprobado en el
> Dashboard ni por la Management API, salvo donde se indique la evidencia. No
> se declara ninguna activa.

## Configuración remota — bloqueante

Seis ajustes que deciden si el despliegue funciona o abre un agujero. Hay que
verificarlos uno a uno en el Dashboard del proyecto, o por la Management API,
y dejar constancia de lo que devuelvan.

### 1. Allow anonymous sign-ins

- **Dónde**: Authentication → Sign In / Providers → Anonymous Sign-Ins.
- **Estado observado el 2026-08-05**: `external.anonymous_users: false`, leído
  del endpoint público de sólo lectura `GET /auth/v1/settings`. Es la única
  evidencia que tenemos y dice que está **desactivado**.
- **Orden que importa**: activarlo **después o a la vez** que se aplique
  `20260806000400_separa_sesiones_anonimas.sql`. Al revés se abre exactamente
  el agujero que esa migración cierra — una sesión anónima valdría como cuenta
  de cliente.
- Si se deja desactivado, el chat no se rompe: `asegurarSesion()` cae a modo
  demostración con un aviso en consola.

### 2. Allow manual linking

- **Dónde**: Authentication → Sign In / Providers → (ajustes generales).
- **Estado**: sin verificar.
- Lo exige la documentación de Supabase para asociar una identidad a una cuenta
  existente. La conversión que usa la aplicación —`updateUser({ email })`—
  funciona en el Supabase local sin él, pero eso no autoriza a suponer nada del
  proyecto remoto: hay que mirarlo.

### 3. Confirm Email

- **Dónde**: Authentication → Sign In / Providers → Email.
- **Estado observado el 2026-08-05**: `mailer_autoconfirm: true`, del mismo
  endpoint, lo que significa que la confirmación está **desactivada**.
- La aplicación ya no depende de ello: el registro sigue el orden documentado
  —primero el email, la contraseña sólo cuando el email está verificado— y
  decide si hace falta confirmar por lo que **responde el servidor**, no por una
  suposición. Las dos configuraciones están cubiertas por pruebas.

### 4. CAPTCHA / Cloudflare Turnstile

- **Dónde**: Authentication → Attack Protection.
- **Estado**: sin verificar.
- Con los inicios anónimos activados, cualquiera puede crear usuarios sin
  límite desde el navegador. Es la protección que Supabase recomienda
  precisamente para ese caso. Si se activa, el frontend tendrá que enviar el
  token del captcha en `signInAnonymously()`, que **hoy no hace**: es trabajo
  adicional, no un interruptor.

### 5. Límite de creación de usuarios anónimos

- **Dónde**: Authentication → Rate Limits → «Anonymous users».
- **Estado**: sin verificar.
- Cada visitante que abre el chat crea un usuario en `auth.users`. Sin límite,
  una tarde de tráfico normal —o un guion— llena la tabla.

### 6. Limpieza de cuentas anónimas antiguas

- **Estado**: no existe procedimiento. **Pendiente de decidir.**
- Supabase no borra las cuentas anónimas solo. Hace falta una tarea periódica
  que elimine las que no se hayan convertido y no tengan actividad reciente.
- Cuidado con el orden al borrarlas: `visitantes.auth_id` es
  `ON DELETE SET NULL`, así que borrar el usuario de Auth **no** se lleva su
  ficha de visitante, la deja huérfana. Hay que borrar primero por `auth_id` y
  después el usuario, que es justo lo que hace el `afterAll` de
  `tests/rls/politicas.spec.ts`.

## Copia de seguridad — comandos preparados, NO ejecutados

Cinco piezas, cada una en su fichero. Se hacen **antes** de aplicar nada.

```sh
mkdir -p respaldo

# 1. Roles.
supabase db dump --linked --role-only -f respaldo/01-roles.sql

# 2. Esquema público.
supabase db dump --linked -f respaldo/02-esquema-publico.sql

# 3. Datos públicos. `--use-copy` es mucho más rápido de restaurar que un
#    fichero lleno de INSERT, y no se atraganta con el jsonb de direcciones.
supabase db dump --linked --data-only --use-copy -f respaldo/03-datos-publicos.sql

# 4. Historial de migraciones, esquema y datos por separado. Es lo que decide
#    qué considera aplicado la CLI, y sin él una restauración deja la base
#    desincronizada con `supabase/migrations/`.
supabase db dump --linked --schema supabase_migrations -f respaldo/04-historial-esquema.sql
supabase db dump --linked --schema supabase_migrations --data-only --use-copy \
  -f respaldo/05-historial-datos.sql

# 5. Lo PERSONALIZADO de auth y storage, no su contenido estándar.
#    `db dump` de esos esquemas devolvería el esquema entero que gestiona
#    Supabase, que ni se restaura ni interesa. `db diff` devuelve sólo lo que
#    este proyecto ha cambiado encima, que es lo que hay que conservar.
supabase db diff --linked --schema auth,storage > respaldo/06-auth-storage-personalizado.sql
```

### Configuración del bucket

Se lee de `storage.buckets`, que es donde vive de verdad. **No** de
`/rest/v1/buckets`: ese camino depende de que PostgREST exponga el esquema
`storage`, que en este proyecto no lo hace —`config.toml` sólo publica `public`
y `graphql_public`—, así que devolvería un 404 que se confundiría con «no hay
bucket».

```sh
# Por SQL, que es la fuente:
supabase db dump --linked --data-only --schema storage --table buckets \
  -f respaldo/07-bucket-config.sql

# O por la API oficial de Storage, con la clave de servicio y sin imprimirla:
curl -s -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$SUPABASE_URL/storage/v1/bucket/descuentos-educativos" \
  > respaldo/07-bucket-config.json
```

### Los archivos del bucket

El volcado de PostgreSQL guarda **los metadatos de los objetos, no los
objetos**. `storage.objects` es un índice: los bytes de cada justificante viven
en el almacenamiento de Storage. Restaurar sólo la base dejaría filas
apuntando a archivos que ya no existen.

```sh
# Copia aparte de los ficheros físicos del bucket privado.
mkdir -p respaldo/objetos
supabase storage cp --linked -r ss:///descuentos-educativos respaldo/objetos/
```

Si esa subcomando no estuviera disponible en la versión de CLI fijada, la
alternativa es descargar cada objeto con la API de Storage a partir de la lista
de `storage.objects`. Lo que no vale es dar por copiado el bucket porque el
volcado SQL mencione sus filas.

### Estado de Anonymous Sign-ins

```sh
curl -s -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/auth/v1/settings" \
  > respaldo/08-auth-settings.json
```

Es de sólo lectura y no crea nada. Guarda el estado de partida de los
proveedores, incluido `external.anonymous_users`, para poder comparar después.

## Orden de despliegue

1. Verificar los seis ajustes de arriba y anotar lo que devuelva el Dashboard.
2. Hacer la copia completa y **comprobarla**, archivos del bucket incluidos.
3. `supabase login` y `supabase link --project-ref <ref>`.
4. `supabase migration list` — comparar con las cuatro migraciones versionadas.
5. `supabase db push --dry-run`; si pide `migration repair`, resolverlo antes.
6. Ventana de mantenimiento corta, avisando de que el chat quedará parado.
7. `supabase db push` — las cuatro, en orden.
8. Activar Anonymous Sign-ins (y CAPTCHA y límite, si se decide activarlos).
9. Publicar el frontend inmediatamente después.
10. Verificar contra la URL pública: chat, `/cuenta`, reserva, justificante y
    panel `/agente`.
11. Comprobar que el rol anónimo ya **no** lee `visitantes`.

Ver [[04-problemas-pendientes#SEC-RLS-001 — Falta validar y desplegar la migración segura]]
y [[04-problemas-pendientes#SEG-ANON-001 — Una sesión anónima del chat valía como cuenta de cliente]].
