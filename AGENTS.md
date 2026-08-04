# Guía de trabajo del repositorio

Este archivo se aplica a todo el repositorio. El proyecto es un prototipo
navegable de Banana Computer; sus precios, existencias, condiciones comerciales
y procesos de compra son datos de demostración, no sistemas reales.

## Contexto obligatorio

Antes de cambiar código o contenido:

1. Revisa `git status` y conserva cualquier cambio preexistente del usuario.
2. Lee [[docs/00-estado-actual|el estado actual]] y
   [[docs/01-contexto-del-proyecto|el contexto del proyecto]].
3. Consulta [[docs/02-decisiones|las decisiones]], el
   [[docs/03-roadmap|roadmap]] y [[docs/04-problemas-pendientes|los problemas
   pendientes]] relacionados con la tarea.
4. Contrasta siempre la documentación con el código. El repositorio ejecutable
   es la fuente de verdad cuando haya una discrepancia.

## Reglas de cambio

- Mantén el alcance solicitado. Una tarea exclusivamente documental no autoriza
  cambios de funcionamiento, diseño, dependencias ni datos del catálogo.
- No presentes como reales precios, stock, financiación, horarios, direcciones,
  reseñas, garantías o condiciones todavía marcados como demostrativos.
- Centraliza los dispositivos en `src/data/products/`, los accesorios en
  `src/data/accessories/`, las tiendas en `src/data/stores.ts` y el resto del
  contenido estático en `src/data/content.ts`; evita duplicar esos datos en
  componentes.
- Respeta el `basename` de React Router y `import.meta.env.BASE_URL`: producción
  se publica bajo `/pagina-banana/`, no en la raíz del dominio.
- Conserva las medidas de accesibilidad existentes: foco visible, nombres
  accesibles, controles táctiles, texto además de color y
  `prefers-reduced-motion`.
- No edites ni versiones `docs/.obsidian/`; es configuración local del vault.
- No guardes secretos, credenciales, datos personales ni información sensible
  en `docs/` o en notas de sesión.

## Documentación viva

Actualiza la documentación en la misma tarea cuando el cambio lo requiera:

- `docs/00-estado-actual.md`: capacidades, arquitectura o verificación actual.
- `docs/01-contexto-del-proyecto.md`: propósito, alcance o mapa técnico estable.
- `docs/02-decisiones.md`: decisiones técnicas o de producto aceptadas, con
  fecha, estado y evidencia.
- `docs/03-roadmap.md`: próximos resultados previstos, sin presentar propuestas
  como compromisos.
- `docs/04-problemas-pendientes.md`: defectos, riesgos, deuda o validaciones
  abiertas; retira o cierra lo resuelto.
- `docs/05-registro-de-cambios.md`: resumen de cambios relevantes.
- `docs/sesiones/`: una nota `AAAA-MM-DD--tema.md` cuando la sesión deje
  contexto útil que no encaje en los documentos anteriores.

Una nota de sesión debe indicar objetivo, estado inicial, trabajo realizado,
comprobaciones, archivos afectados y siguiente paso. No copies conversaciones
completas ni conviertas las sesiones en una segunda fuente de verdad.

## Verificación

La comprobación completa disponible hoy es:

```bash
npm ci
npm run check
```

`npm run check` ejecuta TypeScript, ESLint, Vitest (unitarias y esquema), un
build sin credenciales y Playwright contra ese build en Chromium y móvil. Las
pruebas de `tests/rls/` no forman parte de ese comando: exigen un Supabase
dedicado y los tres secretos descritos en `tests/rls/README.md`. No presentes
esas pruebas como aprobadas cuando se hayan omitido.

Antes de terminar:

1. Ejecuta la verificación proporcional al cambio.
2. Revisa `git diff` y confirma que no se hayan incluido artefactos de `dist/`,
   `node_modules/` o configuración local de Obsidian.
3. Actualiza los documentos afectados.
4. Por instrucción persistente del usuario, todo cambio solicitado para la web
   debe terminar con commit, push, integración en `main`, despliegue en GitHub
   Pages y comprobación de la URL pública, salvo que el usuario indique
   expresamente que quiere mantenerlo solo en local o sin publicar.
