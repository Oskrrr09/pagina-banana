-- Permisos de tabla explícitos para anon, authenticated y service_role.
--
-- QUÉ ESTABA ROTO
--
-- Las migraciones anteriores crean las tablas y escriben las políticas RLS,
-- pero no conceden ni un solo GRANT. Se apoyaban, sin decirlo, en las
-- *default privileges* que Supabase deja preparadas en el esquema `public`.
-- Esas defaults las fijó otro rol en otro momento, así que **no alcanzan a
-- las tablas que crea esta migración**: nacen sin permisos para nadie.
--
-- RLS filtra filas *después* de que el permiso de tabla exista. Sin GRANT no
-- se llega a evaluar ninguna política: PostgreSQL corta antes con
-- «permission denied for table …». Y `service_role`, que salta RLS por
-- BYPASSRLS, **no** salta los GRANT: por eso el alta administrativa de un
-- agente fallaba con «permission denied for table agentes».
--
-- El síntoma engañaba: las pruebas negativas —las que comprueban que un
-- visitante no puede leer lo ajeno— seguían pasando, porque un permiso
-- denegado también es un error. Sólo fallaban los recorridos legítimos.
--
-- POR QUÉ NO SE CONCEDE `ALL` Y SE ACABA ANTES
--
-- Cada línea de aquí abajo es el reflejo exacto de una política escrita en
-- 20260802000100_estado_seguro.sql. Donde aquel fichero dice «NO hay INSERT
-- directo» o «NO hay UPDATE para nadie», aquí no hay GRANT: si el permiso no
-- existe, la operación se corta en la base y no depende de que alguien
-- recuerde no escribir la política. Las dos capas dicen lo mismo, y la más
-- barata de auditar —esta— es la que se lee de un vistazo.
--
-- Todo lo que no aparece aquí sigue pasando por los RPC `security definer`,
-- que se ejecutan con los permisos de su propietario y por eso no necesitan
-- que el cliente tenga permiso sobre la tabla.
--
-- `tests/schema/permisos.test.ts` vigila este cuadro tabla por tabla.

-- El acceso al esquema es requisito previo de cualquier GRANT de tabla.
grant usage on schema public to anon, authenticated, service_role;

-- ---- Chat ------------------------------------------------------------------
-- Lectura de la propia ficha, la propia conversación y los propios mensajes.
-- La escritura entra entera por `abrir_conversacion()` y
-- `enviar_mensaje_visitante()`, así que no hay INSERT para nadie.
--
-- El UPDATE de `visitantes` sí se concede: la política «visitante edita su
-- ficha» y el disparador `visitantes_protege_columnas` son la defensa real
-- —el disparador es el que rechaza tocar `cliente_id`—, y sin el permiso
-- nunca llegarían a ejecutarse.
grant select, update on public.visitantes     to anon, authenticated;
grant select          on public.conversaciones to anon, authenticated;
grant select          on public.mensajes       to anon, authenticated;

-- ---- Cuentas ---------------------------------------------------------------
-- Agentes: sólo lectura, y la política la restringe a los propios agentes.
-- Las altas y bajas se hacen con `service_role`, fuera de la aplicación.
grant select on public.agentes to authenticated;

-- Clientes: alta de la propia ficha (la política exige que los campos del
-- descuento educativo vengan nulos) y lectura. Sin UPDATE: el cliente edita
-- por `actualizar_mi_ficha()` y el agente resuelve por
-- `revisar_descuento_educativo()`, cada uno tocando sólo sus columnas.
grant select, insert on public.clientes to authenticated;

-- Pedidos: el cliente crea y lee los suyos.
grant select, insert on public.pedidos to authenticated;

-- Reservas: sólo lectura. Se crean por `crear_mis_reservas()` —que fija
-- `pagado_at` y con él el puesto en la cola— y cambian por
-- `cancelar_mi_reserva()` y `cambiar_estado_reserva()`.
grant select on public.reservas to authenticated;

-- ---- service_role ----------------------------------------------------------
-- La clave de servicio no viaja en el bundle ni se lee desde `import.meta.env`:
-- es la de administración y la que usan las pruebas para montar y limpiar el
-- escenario. Necesita las tablas completas; RLS ya no la limita.
grant all on public.visitantes     to service_role;
grant all on public.conversaciones to service_role;
grant all on public.mensajes       to service_role;
grant all on public.agentes        to service_role;
grant all on public.clientes       to service_role;
grant all on public.pedidos        to service_role;
grant all on public.reservas       to service_role;

-- Y que lo que se cree a partir de ahora en `public` no vuelva a nacer sin
-- permisos por el mismo motivo. No sustituye a los GRANT explícitos de
-- arriba: `alter default privileges` sólo alcanza a lo que se cree después.
alter default privileges in schema public
  grant all on tables to service_role;
