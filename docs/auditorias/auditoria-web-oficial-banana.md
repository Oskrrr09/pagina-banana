---
tipo: auditoria
fecha: 2026-07-28
url_auditada: https://tienda.bananacomputer.com/
version_prototipo: main @ 147df9e (PR #11)
---

# Auditoría de la web oficial de Banana Computer

Este informe recoge una revisión de experiencia de usuario de la web oficial
de Banana Computer usando dos entornos automatizados (Chromium 1440×900 y
Chromium móvil "Pixel 5") complementados con navegación manual. La
auditoría se ha ejecutado con las restricciones de seguridad indicadas en
el brief: sin confirmar pedidos, sin datos bancarios, sin modificar la
cuenta y sin subir a Git ni la sesión ni las capturas privadas.

Las capturas y el `report.json` generado quedan sólo en local, dentro de
`audit-private/banana/`, carpeta añadida al `.gitignore`. Los datos
personales, IDs y pedidos observados no forman parte de este informe.

## 1. Alcance

- **Fecha:** 2026-07-28.
- **URL auditada:** <https://tienda.bananacomputer.com/>.
- **Navegadores/proyectos:**
  - `desktop` — Chromium 1440×900 con `@playwright/test` en modo
    headless controlado por `scripts/banana-audit/run-audit.ts`.
  - `mobile` — Chromium con emulación `Pixel 5` (aprox. 393×851).
- **Cuenta de prueba:** utilizada sólo para pruebas privadas ejecutadas
  manualmente por el usuario con `npm run audit:banana -- --auth`.
- **Secciones revisadas (23 páginas públicas × 2 dispositivos = 46
  visitas automatizadas + navegación manual complementaria):**
  Portada, catálogos de iPhone / Mac / iPad / Apple Watch / AirPods,
  Accesorios, ficha de iPhone 17 Pro, ficha MacBook Air 13" M5,
  comparador de iPhone, Rincón del Chollo, Seguros a todo riesgo, Plan
  Renove, Servicio Técnico Autorizado, Tiendas, ficha de Banana Plaza
  de España, Soporte Banana, Empresas, Educación, Descuento
  educativo, Financiación, Envíos a domicilio, Política de
  privacidad.
- **Limitaciones:**
  - La auditoría no realiza scraping masivo. Sólo se han visitado las
    23 páginas listadas.
  - Los recorridos privados de cuenta, pedidos y direcciones se
    ejecutan a criterio del usuario con `--auth`; este informe recoge
    únicamente observaciones estructurales anonimizadas de esas
    secciones.
  - En `/educacion/` se observó `requestStorageAccess: Permission
    denied.` — es normal en Chromium por bloqueo de cookies de
    terceros.
  - No se pulsa ningún botón de pago ni se genera pedido en ningún
    dispositivo.
- **Punto donde termina el checkout:** en la revisión manual del flujo
  de compra, el recorrido termina en la pantalla inmediatamente
  anterior al botón que dispararía el pedido. **No se pulsa el CTA
  final.** El botón final de checkout se identifica textualmente en
  §5.
- **Acciones no realizadas:** confirmar pedido, autorizar Bizum,
  introducir tarjeta / CVV / IBAN, iniciar solicitud de financiación,
  aceptar contratos, guardar direcciones, guardar métodos de pago,
  cambiar datos personales.

## 2. Resumen ejecutivo

### Principales fortalezas

- **Catálogo real y actualizado con precios, financiación y stock por
  tienda.** Cada modelo tiene ficha, comparador y disponibilidad
  geográfica, algo que un prototipo demostrativo no puede replicar.
- **Cinco tiendas físicas con contenido de marca fuerte** — arraigo en
  Canarias, servicio técnico autorizado y presencia visible en el
  footer.
- **Extensa cobertura de servicios "no-catálogo"**: Plan Renove,
  seguros a todo riesgo, financiación, descuento educativo, empresas,
  servicio técnico, envíos.
- **Home con "Rincón del Chollo" y ofertas visibles** — pone valor
  comercial delante y respeta la estacionalidad.
- **Envío 24-72 h en Canarias con condiciones explícitas** — una
  ventaja competitiva local que el prototipo debe replicar.

### Principales debilidades

- **Estructura semántica pobre:** 15 de 23 páginas públicas revisadas
  no tienen un `<h1>` visible (portada, `/tiendas/`, `/accesorios/`,
  ficha de tienda, fichas de producto, `/comparar-iphone/`,
  `/financiacion/`, `/envios-a-domicilio/`, `/educacion/`,
  `/politica-de-privacidad/`…). Los catálogos sí tienen H1
  ("Elige un modelo de iPhone", etc.).
- **Accesibilidad muy baja en imágenes**: el comparador `/comparar-iphone/`
  serviría **324 imágenes sin `alt` sobre 417 totales**; las páginas
  de catálogo (iPhone/Mac/iPad) tienen 9-17 imágenes sin `alt` cada
  una; incluso la ficha de producto y la home dejan 10-15 imágenes
  sin descripción.
- **Formularios sin `label`**: `/empresas/` y `/educacion/` sirven
  formularios con **7 inputs no etiquetados** cada uno; `/financiacion/`
  con 4.
- **Error de JS en producción** en `/financiacion/`
  (`TypeError: Cannot read properties of null (reading 'classList')`
  en el módulo `serviciosfinanciacompra_ettef`). La UI del simulador
  se degrada silenciosamente.
- **Slugs muy largos y verbosos** (`/comprar-un-iphone/`,
  `/comprar-un-mac/`, `/servicios/rincon-del-chollo/`) — perjudican
  memorabilidad, compartir por chat y SEO.
- **Página `/accesorios/` sobrecargada:** 782 enlaces y 180 imágenes
  en una sola vista, sin arquitectura clara.
- **Cabecera con muchas capas** (barra utilitaria, barra principal,
  categorías, subcategorías): a 1440 px ya ocupa una fracción notable
  del viewport.
- **Consistencia entre "Tiendas"/"Tienda" fragmentada:** `/tiendas/`
  y `/tienda/<slug>/` conviven; el detalle de tienda no tiene H1.

### Fricciones

- Selección de tienda / cambio de código postal poco visible desde la
  cabecera.
- La financiación aparece en la ficha pero el simulador está en otra
  página con un JS que falla.
- El comparador carga cientos de imágenes lo que degrada tiempo de
  render.

### Funciones poco visibles

- Rincón del Chollo (sólo enlace desde `/servicios/`).
- Descuento educativo (sección con URL propia pero poco visible en
  home).
- Seguros a todo riesgo (existe como servicio pero no aparece en la
  ficha de producto de forma prominente).
- Cursos y "Summer Camp" (existe pero sin ubicación clara en la nav
  principal).

### Contenido confuso

- La convivencia de `/plan-renove/` con enlaces a Foxway sin explicar
  claramente que "la tasación se hace por Foxway" y cómo vuelve la
  persona a Banana.
- La financiación se explica en tres sitios diferentes (ficha,
  `/financiacion/`, checkout) con simulaciones no siempre
  coincidentes.

### Oportunidades para nuestro rediseño

1. **H1 y arquitectura semántica clara** en cada sección: nuestra
   demo puede diferenciarse siendo accesible desde el primer día.
2. **Fichas de producto con selectores compactos, `alt` en toda
   imagen y financiación resumida en el mismo scroll**.
3. **Cabecera respirada + acceso rápido a "Isla / Tienda"** para
   Canarias.
4. **Página "Ofertas" con tarjetas comparables** frente al listado
   plano del Rincón del Chollo.
5. **Explicar el Plan Renove con pasos claros y esperar la
   integración con Foxway** en vez de inventar un tasador propio.
6. **Servicio técnico** con proceso y guía por dispositivo,
   dejando claro que no hace falta cita — coincide con la línea que
   Banana ya ofrece pero podemos explicarlo mejor.
7. **Seguros a todo riesgo** más visibles en carrito y ficha.
8. **Comparador accesible**: menos imágenes, cabeceras semánticas,
   labels en cada fila.

### Riesgos que no debemos replicar

- Duplicar contenido de financiación en tres páginas.
- Formularios sin `label`.
- Comparador con cientos de imágenes sin `alt`.
- Slugs largos tipo `/comprar-un-…`.
- Tasar por nuestra cuenta el Plan Renove.
- Copiar precios reales o textos legales sin autorización.

## 3. Web pública

### Portada (`/`)

- **HTTP 200**, sin errores JS, 149 enlaces, 25 imágenes (10 sin
  `alt`).
- Sin `<h1>` visible. La comunicación de marca se apoya en imágenes y
  banners.
- Hero rotativo con campañas (Watch Ultra 3, MacBook Neo,
  campañas educativas y Plan Renove).
- Presencia de campañas comerciales, Rincón del Chollo, novedades y
  destacados de servicios.
- Fortaleza: mucho contenido comercial visible.
- Debilidad: falta jerarquía; a 393 px móvil el scroll es muy largo.

### Cabecera / Navegación

- Barra superior utilitaria + barra principal + submenús. Cinco
  familias principales visibles a 1440 px; el menú móvil se abre en
  panel deslizante.
- El acceso a Cuenta / Buscador / Carrito es reconocible pero denso.
- Selección de isla o tienda no aparece en cabecera de forma
  prominente.

### Buscador

- Input global en la cabecera; los tipeos abren un panel de
  sugerencias (probado manualmente).
- No se comprobó de forma automatizada por respeto al servidor.
- Debilidad: la lista de resultados vive en `/productos/…` y no se
  sincroniza claramente con la URL cuando se filtra.

### Catálogo

- Tres catálogos con H1 uniforme (`Elige un modelo de X`).
- Rejilla horizontal + tarjetas.
- iPad, iPhone y Mac tienen su listado; Watch (`/comprar-un-apple-watch/`)
  también existe pero sin H1 visible.
- AirPods viven bajo `/accesorios-apple/airpods/` — decisión
  taxonómica cuestionable (AirPods es una familia por sí sola en la
  narrativa Apple).

### Fichas de producto

- **Sin H1** en la ficha automáticamente detectable. El título del
  producto se muestra pero con etiqueta semántica menor.
- 30 imágenes, muchas sin `alt`.
- Selectores de color / capacidad presentes; disponibilidad por
  tienda visible en un botón.
- Precio, financiación y añadir al carrito claros.

### Comparador

- `/comparar-iphone/` renderiza **417 imágenes** de las cuales 324
  sin `alt`. La página es visualmente pesada y a nivel de
  accesibilidad muy débil.
- El comparador está separado por familia (`/comparar-iphone/`,
  `/comparar-mac/`, `/comparar-ipad/`).

### Ofertas / Rincón del Chollo

- H1: "Rincón del Chollo. Consigue tu dispositivo al mejor precio".
- 23 imágenes, todas con `alt`. Buena práctica local.
- Se echa en falta filtro por familia y por porcentaje de descuento.

### Tiendas

- Listado de 5 tiendas (`/tiendas/`) sin H1 y detalle de tienda
  (`/tienda/plaza-de-espana-las-palmas-gc/`) sin H1.
- La ficha de tienda muestra dirección, horarios y servicios.
- No se ha detectado un badge dinámico "Abierto ahora / Cerrado"
  con hora en tiempo real en la ficha o en el listado.

### Servicios

- **Plan Renove** (`/plan-renove/`, H1 correcto): explica la
  colaboración con Foxway y deriva al tasador externo. Falta
  explicación paso a paso desde el punto de vista del usuario.
- **Seguros a todo riesgo** (`/servicios/seguros-a-todo-riesgo/`, sin
  H1): existe la información pero no se conecta con la ficha de
  producto.
- **Descuento educativo** con H1 propio y sección coherente.
- **Financiación** (`/financiacion/`, sin H1 y con `TypeError` de
  JS): página con simulador que falla silenciosamente.
- **Servicio técnico** (`/servicio-tecnico/`, H1 correcto):
  presencia clara, sin cita previa, dispositivos aceptados y
  documentación necesaria.
- **Empresas / Educación / Descuento educativo**: contenido
  específico bien separado.

### Soporte

- `/soporte-banana/` (H1: "Soporte de Banana."): página con enlaces a
  atención al cliente, servicio técnico y FAQ.

### Responsive

- El diseño se reajusta a 393 px pero con la cabecera aún densa.
- La rejilla de familias funciona bien.
- La ficha de producto encaja bien; el simulador de financiación se
  degrada por el fallo JS.

### Accesibilidad

- Muchas imágenes sin `alt` (agregado ~470 imágenes sin descripción
  entre todas las páginas visitadas en desktop).
- Formularios sin `label` en tres páginas de captación (Empresas,
  Educación, Financiación).
- Falta de H1 en 15/23 páginas.
- Foco visible variable según componente.

## 4. Cuenta y perfil

> Revisión hecha manualmente por el usuario con sesión iniciada. Este
> informe no incluye ningún dato personal.

- **Login**: formulario clásico email + contraseña, sin toggle para
  mostrar/ocultar contraseña destacado; recuperación por email.
- **Registro**: alta con datos personales y aceptación de
  condiciones; requiere confirmación.
- **Perfil**: menú lateral con Datos personales, Direcciones,
  Pedidos, Facturas, Favoritos, Cerrar sesión. Estilo funcional pero
  poco moderno.
- **Estados vacíos**: la sección de pedidos muestra un mensaje si no
  hay historial; podría añadir un CTA claro al catálogo.
- **Responsive**: la sección de cuenta se reduce a un menú
  desplegable en móvil.
- **Accesibilidad**: falta contraste en algunos enlaces secundarios.

## 5. Carrito y checkout

> El recorrido termina antes de pulsar el botón que confirma el
> pedido. **No se ha creado ningún pedido, ni cargo, ni contrato.**

- **Carrito**: imagen, nombre, variante, cantidad, precio unitario y
  subtotal. Se puede cambiar cantidad y eliminar.
- **Cupones**: existe campo de código promocional.
- **Envío / Recogida**: se elige método antes del pago; hay opción de
  recogida en cualquiera de las cinco tiendas.
- **Extras / seguros**: se ofrecen sólo en algunas fichas, no en el
  carrito de forma sistemática.
- **Pagos**: tarjeta, Bizum, financiación (Cetelem/Sequra según
  producto). No se abre el flujo real.
- **Punto final observado (texto exacto del último botón):**
  **"Realizar pedido"**. La auditoría se detiene inmediatamente
  antes.
- **Validaciones**: los formularios de dirección validan campos
  obligatorios; los errores aparecen tras enviar, no en tiempo real.
- **Persistencia**: al recargar, el carrito se conserva; al cerrar
  navegador y volver, la sesión mantiene el carrito.
- **Responsive**: el checkout se apila correctamente en móvil, pero
  el resumen queda al final del scroll y obliga a mucho scroll para
  ver el total en pantallas pequeñas.

## 6. Plan Renove

- Existe la página `/plan-renove/` con H1 y explicación general.
- Al iniciar la valoración se deriva al partner **Foxway**.
- La valoración final se determina por Foxway tras la recepción del
  dispositivo.
- Falta un flujo visual paso a paso en la página de Banana ("qué
  necesitas", "qué recibes", "qué haces si Foxway ajusta el precio").
- **Motivo para no crear un tasador propio en nuestro prototipo:**
  los importes reales pertenecen a Foxway y a las tablas comerciales
  de Banana. Inventar precios induce a error legal y comercial;
  cualquier integración debe partir de acceso oficial.

## 7. Servicio técnico

- Servicio Técnico Autorizado sin cita previa. Se puede acudir a
  tiendas específicas y a un servicio con recogida.
- La página explica dispositivos aceptados y garantía.
- Se detecta que no se comunica de forma clara "no hace falta cita" —
  podría destacarse en un banner.
- Falta una guía de preparación (copia de seguridad, desactivar
  Buscar, restablecer contraseñas de coche cuando aplique).
- **Motivo para no proponer citas en nuestro prototipo:** la política
  actual de Banana es servicio libre; añadir un sistema de citas
  cambiaría el modelo operativo real.

## 8. Hallazgos

Para cada hallazgo se indica ID, pantalla, dispositivo, pasos y
recomendación. Las evidencias privadas viven en
`audit-private/banana/` y no se anexan a este documento.

### BC-UX-001 · H1 ausente en 15 de 23 páginas revisadas

- **Pantalla:** portada, `/comprar-un-apple-watch/`,
  `/accesorios/`, `/accesorios-apple/airpods/`, fichas de producto,
  `/comparar-iphone/`, `/servicios/seguros-a-todo-riesgo/`,
  `/tiendas/`, `/tienda/<slug>/`, `/educacion/`, `/financiacion/`,
  `/envios-a-domicilio/`, `/politica-de-privacidad/`.
- **Dispositivo:** desktop y mobile.
- **Comportamiento:** ausencia de `<h1>` visible; el título de la
  página se apoya en imágenes o `<h2>`.
- **Gravedad:** alta (SEO y accesibilidad).
- **Impacto:** menor comprensión por lectores de pantalla, peor
  ranking, ambigüedad en el propósito de la página.
- **Recomendación:** un único `<h1>` claro por página con la
  intención comercial (p. ej. "iPhone en Canarias — envío 24-72 h").
- **Aplicación en el prototipo:** el prototipo ya usa `<h1>` en las
  familias y fichas; conservarlo y añadir `<h1>` en `/`.
- **Dependencias:** ninguna.
- **Prioridad:** alta.

### BC-UX-002 · 324/417 imágenes sin `alt` en `/comparar-iphone/`

- **Pantalla:** comparador iPhone.
- **Dispositivo:** desktop.
- **Gravedad:** alta.
- **Recomendación:** obligar `alt` en toda imagen o marcar
  decorativas con `alt=""` y `role="presentation"`.
- **Aplicación en el prototipo:** ya se usa `alt` en `ProductCard` y
  `ProductImage`; mantener y ampliar en la sección de comparador.
- **Prioridad:** alta.

### BC-UX-003 · Formularios sin `label` en `/empresas/`, `/educacion/`, `/financiacion/`

- **Gravedad:** alta.
- **Recomendación:** asociar `label`+`for`, `aria-label` o
  `aria-labelledby` a cada campo; añadir `autocomplete` donde aplique.
- **Aplicación en el prototipo:** los formularios del checkout ya
  usan `<label>` asociada y `autocomplete`. Buena base.
- **Prioridad:** alta.

### BC-UX-004 · `TypeError` en `/financiacion/`

- **Detalle:** `Cannot read properties of null (reading 'classList')`
  en el bundle `serviciosfinanciacompra_ettef` (simulador de compra
  con financiación).
- **Gravedad:** media.
- **Recomendación:** guardas defensivas + revisar orden de montaje
  del componente.
- **Aplicación en el prototipo:** ya se hizo un ejercicio de "hooks
  siempre en el mismo orden" en el checkout; mantener esa disciplina.
- **Prioridad:** media.

### BC-UX-005 · Slugs largos y verbosos

- **Detalle:** `/comprar-un-iphone/`, `/comprar-un-mac/`,
  `/comprar-un-ipad/`, `/comprar-un-apple-watch/`,
  `/servicios/rincon-del-chollo/`.
- **Gravedad:** baja.
- **Recomendación:** `/iphone`, `/mac`, `/ipad`, `/apple-watch`,
  `/rincon-del-chollo`. Nuestro prototipo ya lo hace.
- **Prioridad:** baja (decisión de negocio si migran).

### BC-UX-006 · `/accesorios/` con 782 enlaces y 180 imágenes

- **Gravedad:** media.
- **Recomendación:** partir en subcategorías con navegación
  jerárquica en la ruta, no en la propia página.
- **Aplicación en el prototipo:** en el prototipo no hay catálogo de
  accesorios; los tiles enlazan al buscador con un `q=`. Es la
  decisión correcta y evita replicar el problema.
- **Prioridad:** baja para nosotros.

### BC-UX-007 · Falta indicación "Abierto ahora / Cerrado" en tiendas

- **Detalle:** el listado y la ficha de tienda no anuncian estado
  actual con hora de Canarias.
- **Gravedad:** media (UX de valor real).
- **Recomendación:** badge dinámico con hora local + horario del día.
- **Aplicación en el prototipo:** el prototipo ya lo implementa
  con `isOpenNow` y `Atlantic/Canary`.
- **Prioridad:** oportunidad clara para diferenciarnos.

### BC-UX-008 · Financiación fragmentada en tres puntos

- **Pantallas:** ficha, `/financiacion/` y checkout.
- **Gravedad:** media.
- **Recomendación:** una única fuente en `/financiacion/` que se
  reutilice en ficha y checkout con `iframe` o componente compartido.
- **Prioridad:** media.

### BC-UX-009 · Contraste bajo en algunos enlaces secundarios

- **Gravedad:** baja.
- **Recomendación:** revisión con axe / Lighthouse.
- **Prioridad:** baja.

### BC-UX-010 · Cabecera con muchas capas

- **Gravedad:** baja.
- **Recomendación:** dos barras máximo en desktop, colapsar en móvil.
- **Aplicación en el prototipo:** nuestro Header usa 2 barras
  (utilitaria cian + amarilla principal) — decisión correcta.

### BC-UX-011 · Plan Renove sin pasos explicados

- **Gravedad:** media.
- **Recomendación:** timeline "1. Estimación online (Foxway) →
  2. Envío del equipo → 3. Valoración final → 4. Bonificación en tu
  próxima compra Banana".
- **Aplicación en el prototipo:** dejar el Plan Renove como está y
  añadir una explicación textual del proceso, sin inventar precios.
- **Prioridad:** media.

### BC-UX-012 · Servicio técnico sin banner "sin cita previa"

- **Gravedad:** baja.
- **Recomendación:** banner o chip visible en la parte alta de la
  página.
- **Prioridad:** baja pero de alto valor percibido.

### BC-UX-013 · Seguros a todo riesgo no aparecen en la ficha de producto

- **Gravedad:** media.
- **Recomendación:** hacerlos visibles en la ficha con un enlace y
  luego formalizarlos como línea del carrito.
- **Aplicación en el prototipo:** **no se toca la lógica del seguro
  del prototipo** — ya está presente por línea con precio mensual.
  Este hallazgo se registra como oportunidad para Banana.
- **Prioridad:** media.

### BC-UX-014 · Persistencia del carrito sin login clara pero implícita

- **Gravedad:** oportunidad.
- **Recomendación:** enseñar al usuario que su carrito se guarda
  localmente.
- **Aplicación en el prototipo:** ya lo hacemos con `banana:cart` en
  `localStorage`.

### BC-UX-015 · Checkout con botón final "Realizar pedido" pero sin resumen sticky en móvil

- **Gravedad:** media.
- **Recomendación:** resumen fijo en la parte baja del viewport en
  móvil.
- **Aplicación en el prototipo:** el checkout actual tiene resumen
  lateral en desktop y apilado abajo en móvil. Podría añadirse una
  franja fija con total.
- **Prioridad:** media.

## 9. Comparación con nuestro prototipo

| Área | Web oficial | Prototipo | Oportunidad | Recomendación | Valor | Dificultad | Dependencias | Puede hacerse ahora | Prioridad |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portada | Muy densa, sin H1 | Hero + secciones jerárquicas | Añadir `<h1>` explícito y CTA claro | Insertar `<h1>` semántico | Alto | Baja | Ninguna | Sí | Alta |
| Nav | 3-4 capas | 2 barras (cian + amarilla) | Mantener nuestra decisión | Documentarla como ventaja | Alto | Baja | Ninguna | Sí | Alta |
| Buscador | Panel con sugerencias | `SearchPage` con URL sincronizada y sugerencias del catálogo | Añadir "búsquedas recientes" *demo* | Sólo etiquetado como demo | Medio | Baja | Ninguna | Sí | Media |
| Familias | Slugs largos `/comprar-un-…/` | `/iphone`, `/mac`, `/ipad`, `/apple-watch`, `/airpods` | Mantener | — | Alto | Baja | Ninguna | Ya está | Cerrado |
| Catálogo | Rejilla horizontal | `FamilyPage`+`ShowcaseFamilyPage` | Añadir orden por precio y disponibilidad | Filtros ya presentes | Medio | Baja | Ninguna | Sí | Media |
| Ficha | Sin H1, muchas imágenes | `VariantPage` con H1 y selectores | Añadir "en stock por tienda" *demo* | Ya existe StorePicker | Alto | Media | Contenido | Sí | Media |
| Comparador | 400+ imágenes, sin `alt` | Hasta 3 productos, mismo familia, `remove` accesible | Mantener y añadir columna "Diferencias" | Mejora incremental | Medio | Media | Ninguna | Sí | Media |
| Favoritos | Estándar | ProductCard con corazón y `aria-pressed` | Mantener | — | Alto | Baja | Ninguna | Ya está | Cerrado |
| Carrito | Cupones + envío/recogida | `CartPage` compartiendo estado con checkout | Mantener; **no tocar seguro** | Reforzar copy | Alto | Baja | Ninguna | Sí | Media |
| Checkout | 3-4 pasos, valida al enviar | 3 pasos blindados con guardas y foco correcto | Mantener validación en tiempo real | Añadir hint sticky de total en móvil | Alto | Media | Ninguna | Sí | Media |
| Perfil | Estilo antiguo | *No existe todavía* | Perfil demostrativo sin backend | Reservar UI, sin funcionalidad real | Medio | Media | Base de datos (real) | Sólo maqueta | Baja |
| Tiendas | Sin badge "Abierto ahora" | Badge verde/rojo con hora Canarias | Mantener y explicar diferenciador | — | Alto | Baja | Ninguna | Ya está | Cerrado |
| Servicios | Financiación fragmentada, JS roto | Servicios agrupados sin promesas comerciales reales | Mantener y añadir explicación Plan Renove | — | Medio | Baja | — | Sí | Media |
| Soporte | Página con enlaces | Página propia | Añadir guía "cómo preparar tu Mac" | — | Medio | Baja | Contenido | Sí | Media |
| Plan Renove | Deriva a Foxway sin pasos | Página informativa | Explicar 4 pasos sin tasador propio | — | Alto | Baja | Autorización de Banana/Foxway | Sí (demo) | Media |
| Servicio técnico | Sin banner "sin cita" | Página propia | Banner "sin cita previa" | — | Alto | Baja | Ninguna | Sí | Media |
| Móvil | Cabecera densa, checkout sin sticky total | Cabecera ligera; sin sticky total | Añadir barra inferior con total en checkout | — | Alto | Baja | Ninguna | Sí | Media |
| Accesibilidad | Muchas imgs sin `alt`, formularios sin label | `alt` correcto, `label` en checkout, focus trap en chat | Mantener y añadir axe en CI *(pendiente)* | — | Alto | Media | Ninguna | Sí | Media |
| Confianza | Marca Canarias fuerte | Textos etiquetados como demostrativos | Reforzar identidad Canarias sin inventar reseñas | — | Alto | Baja | Autorización | Sí | Media |

## 10. Mejoras recomendadas

### Mejoras inmediatas para la demostración

1. Añadir `<h1>` explícito en la portada del prototipo con texto
   "Banana Computer — Apple en Canarias".
2. Añadir banner "Sin cita previa" en la página `/soporte` (o en la
   sección de servicio técnico) del prototipo.
3. En `/plan-renove/` del prototipo, añadir una timeline con los
   cuatro pasos del flujo con Foxway sin inventar precios.
4. En el checkout móvil, añadir un `sticky` inferior con "Total —
   Continuar" (respetando la lógica actual, sin tocar el seguro).
5. Documentar como ventaja: "nuestro badge Abierto ahora/Cerrado en
   tiendas está en hora de Canarias" en README y en el propio panel
   de tiendas.

### Mejoras que necesitan base de datos

6. Historial de pedidos real, direcciones guardadas y facturas.
7. Búsqueda con sugerencias basadas en frecuencia.
8. Wishlist sincronizada entre dispositivos.

### Mejoras que necesitan acceso de Banana

9. Precios, stock por tienda y disponibilidad en tiempo real.
10. Textos comerciales validados que sustituyan los demostrativos.
11. Contenido oficial de servicio técnico, financiación y garantías.

### Mejoras que necesitan proveedores externos

12. Integración con Foxway para tasación Plan Renove.
13. Integración con Cetelem / Sequra para financiación.
14. Integración con Redsys / Bizum para pagos.

### Mejoras que no conviene implementar

15. Tasador propio del Plan Renove con precios inventados.
16. Sistema de citas para servicio técnico (Banana opera sin cita).
17. Chat con IA real sin autorización.
18. Comparador con cientos de imágenes: preferimos menos y mejor.
19. Formularios de captación B2B con datos que no vamos a procesar.

## 11. Priorización

- **Valor alto / esfuerzo bajo:** 1, 2, 3, 4, 5, 12 (documentación).
- **Valor alto / esfuerzo medio:** integración de axe en CI, resumen
  sticky en checkout móvil, mejora de comparador.
- **Valor alto / esfuerzo alto:** perfil / pedidos reales
  (necesita base de datos), integración Foxway.
- **Posponer:** buscador con sugerencias basadas en frecuencia,
  wishlist sincronizada.
- **Descartar:** tasador propio, citas para SAT, IA real.

## 12. Siguiente fase propuesta

Se recomiendan **cinco** mejoras que caben dentro del alcance actual
del prototipo (sin backend, sin datos personales, sin seguro alterado):

1. **`<h1>` en la portada del prototipo**
   - Objetivo: mejorar accesibilidad y SEO.
   - Beneficio: encabezado semántico único, entendible por lectores
     de pantalla.
   - Pantallas: `/`.
   - Alcance: cambio mínimo en `Home.tsx`.
   - Datos necesarios: ninguno.
   - Riesgos: ninguno.
   - Dificultad: baja.
2. **Banner "Sin cita previa" en el servicio técnico del prototipo**
   - Objetivo: comunicar la política real que Banana ya practica.
   - Beneficio: alto valor percibido.
   - Pantallas: `/soporte`.
   - Datos: texto anonimizado, marcado como demostrativo.
   - Riesgos: ninguno.
   - Dificultad: baja.
3. **Timeline del Plan Renove sin tasador**
   - Objetivo: explicar el proceso Foxway sin precios.
   - Beneficio: reduce confusión.
   - Pantallas: `/plan-renove`.
   - Datos: cuatro pasos, sin importes.
   - Riesgos: ninguno.
   - Dificultad: baja.
4. **Sticky total en checkout móvil**
   - Objetivo: reducir scroll en móvil.
   - Beneficio: menos fricción en el paso 2.
   - Pantallas: `/checkout/2`.
   - Alcance: sólo maquetación, sin tocar cálculo ni seguro.
   - Riesgos: no romper la trampa de foco existente ni la lógica
     de guardas.
   - Dificultad: media.
5. **Integrar `axe-core` en la suite Playwright**
   - Objetivo: cerrar QA-001.
   - Beneficio: prevenir regresiones de accesibilidad.
   - Pantallas: portada, ficha, checkout, tiendas.
   - Alcance: nuevo test, sin cambio en la app.
   - Riesgos: ninguno.
   - Dificultad: media.

**No se propone implementación aún — pendiente de tu autorización.**

## 13. Conclusión

- **Tres fortalezas de la web oficial:** catálogo real y actualizado
  con precios/stock/financiación; anclaje comercial fuerte en
  Canarias con cinco tiendas físicas visibles; cobertura amplia de
  servicios no-catálogo (Renove, seguros, financiación, SAT,
  educativo, empresas).
- **Tres debilidades principales:** semántica pobre (H1 ausente en
  15/23 páginas revisadas), accesibilidad muy baja (cientos de
  imágenes sin `alt` y formularios sin `label`) y un `TypeError` en
  la página de financiación.
- **Tres oportunidades para nuestro prototipo:** semántica y
  accesibilidad como ventaja competitiva, badge "Abierto
  ahora/Cerrado" con hora de Canarias en tiendas (ya lo tenemos), y
  explicar mejor Plan Renove / SAT sin inventar procesos.
- **Tres funciones que no debemos implementar:** tasador propio del
  Plan Renove, sistema de citas para servicio técnico y chat con IA
  real.
- **Qué podemos presentar ya a Banana:** el propio prototipo con
  las cinco mejoras de §12 aplicadas y este informe como base para
  discutir prioridades y accesos a datos reales.
- **Qué debe esperar a disponer de acceso real:** cuenta, pedidos,
  facturas, tasación Foxway, pagos reales, stock por tienda,
  reseñas oficiales y precios contrastados.
