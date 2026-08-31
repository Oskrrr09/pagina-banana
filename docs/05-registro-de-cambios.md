---
tipo: cambios
actualizado: 2026-08-31
---
	
# Registro de cambios

Este registro resume cambios relevantes. Git sigue siendo la fuente exacta para
autores, diffs y marcas de tiempo.

## 2026-08-31 — Fase D2: el comparador se siente de app (sin fusionar)

Segunda entrega de la **Fase D**, y **sólo en la app**. Queda **pendiente de
revisión técnica y de validación física en iPhone**.

**El problema no era el tamaño de los botones.** La web compara en columnas —A
| B | C— y en un teléfono esa metáfora no cabe: a 320 px con tres productos,
`min-w-[720px]` dejaba **424 px de la tabla fuera de pantalla** tras un gesto
horizontal sin ninguna señal, con **dos desplazadores anidados**, 15 de 17
controles por debajo del mínimo táctil y 18 superficies dentro de otra.
Comparar así obligaba a sostener una cifra en la memoria mientras se arrastraba
para ver la otra.

**En la app la comparación es vertical y por atributo.** Cada característica es
un bloque y dentro van los valores, uno por línea, con la identificación del
producto a la izquierda y el dato a la derecha. El «Destaca por…» se pega al
valor que lo gana en vez de vivir suelto en la cabecera de la columna. Arriba,
un resumen de una fila por producto —imagen, nombre, precio y sus acciones—, no
tres tarjetas de catálogo.

Medido a 320, 390 y 430 en los cuatro estados: **0 desbordamiento, 0
desplazadores horizontales, 0 desplazadores verticales propios, 0 superficies
anidadas y 0 controles por debajo de 44 px**. Con «Solo diferencias» son 6
bloques con dos productos y 7 con tres.

**El motor no se toca.** `ESSENTIAL_FIELDS`, `EXTENDED_FIELDS`,
`FIELD_SECTIONS`, `buildDecisionSections` y `buildDecisionSummary` son los
mismos, «Solo diferencias» sigue activo por defecto, y `MAX_COMPARE = 3`, la
familia única y la persistencia no cambian. El dominio entero vive en
`useComparador` y lo comparten las dos composiciones.

**La identificación corta** dentro de los atributos sale de una regla genérica
—el prefijo común de palabras de la familia: `iPhone`, `iPad`, `Apple Watch`,
`AirPods`— con reserva al nombre completo si no lo hay (los Mac), si quedaría
vacía o si dos productos colisionarían. Sin listas de excepciones.

**Sin cabecera pegajosa**, a propósito: es la primera versión y esa pieza se
decidirá con el teléfono delante.

**La web no cambia** (D-086): su HTML renderizado es **carácter por carácter
idéntico** al de `main`, a 390 y 1280, en los cuatro estados y con «Mostrar
todas».

Suite nueva `tests/e2e/fase-d2-comparador-app.spec.ts` con 56 casos. **La Fase
D sigue abierta: D2 no está cerrada.**

## 2026-08-31 — Fase D1: Favoritos se siente de app

Primera entrega de la **Fase D — «Favoritos y comparador se sienten de app»**, y
**sólo en la app**. Revisión técnica aprobada y **validación física en iPhone
aprobada**.

**Por qué esta superficie.** La auditoría posterior a la Fase C la midió como la
más lejos del estándar nativo: con tres favoritos, 21 superficies con marco —16
dentro de otra— y 24 de 28 controles por debajo de 44 px, con «Ver producto» y
«Quitar» a 30 px y las tiendas a 28. Y es el destino del corazón que aparece en
todas las tarjetas del catálogo, que la Fase B ya dejó nativas.

**La lista es una superficie, no una rejilla de tarjetas.** Cada favorito es una
fila separada por divisores: la fila entera —imagen, nombre, precio y estado en
tienda— es el enlace a la ficha, y debajo van sus dos acciones. Medido a 320,
390 y 430: **2 superficies con marco, 0 anidadas, 0 controles por debajo de
44 px**, acciones de 48 px, fila de 100 px y cero desbordamiento.

**La elección de tienda se despliega en la propia fila**, con una opción por
tienda a 48 px, en lugar del `<select>` del sistema. **Mis avisos** y
**Notificaciones** siguen el mismo patrón: una superficie por grupo y filas
dentro.

**El dominio no se duplica.** `useFavoritos` centraliza lo que ya hacía la
página —quitar un favorito desactiva su seguimiento para no dejar avisos
huérfanos, y elegir tienda la guarda como favorita si no había ninguna— y lo
consumen las dos composiciones. Ningún comportamiento se reimplementa:
`setAlert`, `changeAlertStore`, `disableAlert`, `simulateArrival`, `markRead` y
`markAllRead` son los mismos.

**La web no cambia** (D-086): su HTML renderizado es **carácter por carácter
idéntico** al de `main`, a 390 y a 1280, con y sin aviso activo.

### El bug que encontró la validación física

Con la entrega ya en el teléfono apareció un fallo real: **guardando sólo el
iPhone 17 Pro, Favoritos enseñaba también el iPhone 17.**

El almacenamiento era correcto —`banana:fav` contenía un único identificador,
comprobado por la interfaz—. El fallo estaba en cómo se reconstruía la lista:

```ts
favorites.some((f) => f.startsWith(`${m.family}/${m.slug}`))
```

Eso no pregunta «¿está guardado este modelo?» sino «¿empieza algún favorito por
su identificador?», y `"iphone/17-pro"` empieza por `"iphone/17"`.

**El censo del catálogo dio tres modelos afectados, no uno:**

| Guardado | Aparecían además |
| --- | --- |
| `iphone/17-pro-max` | `iphone/17-pro` **y** `iphone/17` |
| `iphone/17-pro` | `iphone/17` |
| `airpods/airpods-4-anc` | `airpods/airpods-4` |

El defecto era **anterior a D1** —estaba igual en `FavoritesPage`— y, al vivir
en el dominio que comparten las dos plataformas, **la web pintaba el mismo
modelo fantasma**. Se corrigió aquí porque la validación física lo encontró en
la superficie que se estaba cambiando.

**La corrección es igualdad exacta del identificador.** El contrato de
`banana:fav` es exactamente `familia/modelo`: lo componen así los seis sitios
que escriben favoritos y `toggleFavorite` lo guarda tal cual. Sin listas de
excepciones, así que cualquier modelo futuro cuyo identificador sea prefijo de
otro queda cubierto por construcción. No se tocó `useStore`, `toggleFavorite` ni
el formato persistido.

### Cobertura

`tests/e2e/fase-d1-favoritos-app.spec.ts` con **34 casos** —composición,
geometría a 320/390/430, comportamiento, identidad en app y en web, y
congelación de la web— y `tests/unit/favoritos-identidad.test.ts` con **8
unitarios de dominio**, incluido un censo que recorre el catálogo entero.
Rojos antes del arreglo: 3 unitarios y 4 E2E, uno de ellos de la web.

### Validación física

Aprobada por el usuario en iPhone: guardar sólo el iPhone 17 Pro enseña
únicamente el iPhone 17 Pro; añadir después el iPhone 17 enseña exactamente los
dos; quitar uno mantiene el otro. El bug apareció durante la validación, se
corrigió, se reinstaló la build nueva, se repitió la prueba y quedó aprobada.

**D1 queda cerrada. D2 —el comparador— no ha empezado y la Fase D sigue
abierta.**

## 2026-08-30 — Fase C cerrada: «Comprar se siente de app»

Con la PR #91 fusionada, la Fase C queda **completa**. La formaron dos entregas,
las dos sólo en la app:

- **C1 — el carrito** (PR #90, merge `8ad3f130`): CTA anclado sobre la
  navegación y «Entrega o recogida» sin su caja exterior.
- **C2 — el checkout** (PR #91, merge
  `7fbcfd0665e9ca358b438d80bfa65e1765090e23`): sin la tarjeta que envolvía el
  paso, CTA anclado en los pasos 1 y 2, y modelo de scroll propio para poder
  anclarlo sin el defecto de WKWebView.

Lo que se consiguió:

- el CTA de compra del carrito llega al pulgar;
- el CTA del checkout está anclado en los pasos 1 y 2, y el paso 3 **no** monta
  una barra artificial;
- el checkout tiene su propio modelo de scroll nativo y **sigue fuera del
  armazón general** de la app: sin `AppTopBar`, sin `AppTabBar` y con cabecera
  propia;
- la **web conserva su composición histórica** (D-086);
- el **comportamiento comercial compartido está intacto**: carrito, precios,
  seguros, entrega, validación, pago, creación del pedido, compra invitada, auth
  y Supabase.

**Validación automatizada aprobada sobre `main`.** La referencia del cierre es
el **CI posterior al merge**: run `33337410945`, **CI #194**, evento `push`
sobre `main`, SHA `7fbcfd0665e9ca358b438d80bfa65e1765090e23`, **`success`**. E2E
**600 aprobadas · 1 omitida** (`pwa.spec.ts:109`, la histórica), unitarias 379,
panel 24, preferencias 37, Supabase **36 / 103 / 5**, ESLint **0 errores / 24
avisos**. CI #193 fue el gate previo de la PR #91, sobre su head; el que valida
lo que quedó en `main` es el #194.

**Validación física en iPhone aprobada por el usuario.** Las decisiones de la
fase son **D-089** (carrito) y **D-090** (checkout).

La **siguiente fase todavía no está decidida**.

## 2026-08-30 — Fase C2: el checkout se lleva al pulgar

Segunda entrega de la Fase C, y **sólo en la app**. Fusionada en `main` con la
PR #91 tras validación física en iPhone (merge
`7fbcfd0665e9ca358b438d80bfa65e1765090e23`).

**El checkout cambia de modelo de scroll.** Su raíz pasa a ocupar el viewport
dinámico y lo único que se desplaza es `#contenido-checkout`; el documento se
queda quieto. Es lo que permite anclar el CTA sin reproducir el defecto que
`index.css` ya documenta: en WKWebView un `position: fixed` sobre scroll de
documento se recoloca al terminar el gesto y parece despegarse. **Pero el
checkout no se muda al armazón general**: sigue fuera de `Layout`, sin
`AppTopBar`, sin `AppTabBar` y con su cabecera, y se marca con
`data-checkout-shell`, no con `data-app-shell` (**D-090**).

**Se retira la tarjeta que envolvía el paso entero** —el formulario dentro de
una card sobre fondo gris—, y sólo ésa: modo de entrega, financiación, seguros,
datos del pedido, avisos y resumen conservan su superficie.

**El CTA se ancla al borde inferior** a ancho útil. Medido a 320, 390 y 430 en
los pasos 1 y 2: botón de 288/358/398 px y 52 px de alto, barra al ancho del
viewport, 0 px hasta el borde de la pantalla, sin solape ni desbordamiento. La
compensación de desplazamiento se deriva de lo que ocupa la barra y deja 12 px
libres sobre el último bloque, también con la financiación abierta. Aquí **no**
se usa `ALTURA_TAB_BAR`: no hay tab bar debajo, y el área segura la reserva la
propia barra una sola vez. El paso 3 no monta barra.

**`CheckoutPage` sigue siendo una sola página compartida.** Comportamiento
intacto: `useCheckoutState`, `useStore`, precios, seguros, entrega, validación,
pago, cupón, creación del pedido, compra invitada, auth y Supabase. La web no
cambia (D-086).

Suite nueva `tests/e2e/fase-c2-checkout-app.spec.ts` con 20 casos, cinco de
ellos verificados en rojo al deshacer cada parte.

## 2026-08-30 — Fase C1: la compra del carrito se va al pulgar

Primera entrega de la Fase C, y **sólo en la app**.

**El CTA se ancla.** «Finalizar compra» vivía al final del resumen: para pulsarlo
había que recorrer toda la columna. Pasa a una barra fija sobre la navegación,
apoyada en `ALTURA_TAB_BAR` —que ya incluye el área segura, así que no se añade
otra—. Medido a 320, 390 y 430: la barra termina **exactamente** donde empieza la
tab bar, 0 px de separación y sin solape, con el botón a ancho útil y 52 px de
alto. Se añade una compensación de desplazamiento para que el cross-sell, que es
lo último de la página, siga pudiendo leerse por encima.

**«Entrega o recogida» pierde la caja exterior**, que envolvía dos opciones que ya
son tarjetas con su propio borde y estado. Las opciones no se tocan. El resumen
pierde su marco y conserva la jerarquía.

**`CartPage` sigue siendo una sola página compartida**: divergen cuatro puntos
locales más una barra de veinte líneas (**D-089**). Comportamiento intacto —
carrito, cantidades, seguro, entrega compartida con el checkout, cupón, total y
cross-sell—, sin duplicar `useStore` ni `useCheckoutState`.

**La web no cambia**: sin barra anclada, CTA en el resumen y entrega con su
marco. **El checkout es C2 y no ha empezado.**

## 2026-08-29 — Dos defectos vistos en el teléfono, corregidos en la app

**Una franja blanca sobre «Seguías mirando».** El Home nativo pinta su fondo gris
en un contenedor sin borde ni relleno, y su primer bloque lleva `mt-4`: sin un
contexto de formato propio, ese margen **se colapsaba a través** del contenedor.
Medido: el gris empezaba **16 px** por debajo de la barra y en medio asomaba el
blanco del `main`. Se resuelve con `flow-root` en ese contenedor — no con
`overflow-hidden`, que recortaría los carriles horizontales, ni con relleno, que
cambiaría el ritmo vertical. Franja: **16 → 0 px**.

**El historial se filtraba entre cuentas.** Una persona miraba productos, cerraba
sesión, entraba otra y seguía viendo los de la primera. La app pasa a guardar el
historial en **un espacio por identidad** (**D-088**), y el Home lo recalcula al
cambiar la sesión, en el mismo render, para que no haya un fotograma con los
productos de la anterior. **La web no cambia**: conserva D-064 y su clave única.

Comprobado con el HTML renderizado de `/`, `/iphone` y la ficha a 1440 y 390:
**idéntico** al de la base. Se adaptaron cuatro suites que sembraban el historial
en la clave del navegador esperando verlo en el Home nativo — el concepto que
fijaban sigue exigiéndose, sólo cambia dónde vive el dato.

## 2026-08-29 — Fase B2: la ficha de producto respira en la app

Tres cambios, sólo en la app (D-086), y sólo los que el diseño aprobado
contiene:

**La galería pierde el marco.** Era `1px solid #e3e3e6` alrededor de un fondo
casi blanco —un contorno que no separaba la foto de nada— y su radio de 20 px no
pertenecía a ningún sistema. En la app: sin borde y con **16**, el mismo de la
tarjeta nativa. Proporción, relleno, tinte por color y `object-contain`, intactos.

**El favorito deja de partir el nombre y el precio.** La fila es `flex-wrap`: al
no caber, el botón bajaba y aterrizaba entre ambos. Medido: el hueco pasaba de
18 a **66 px** a 320 y 390. Ahora se compacta a icono —mismo control, misma
lógica, mismo nombre accesible— y el hueco vuelve a **20 px**, con la zona
táctil pasando de 170×38 a **44×44**.

**Los accesorios sugeridos son los del catálogo.** La ficha construía a mano otra
tarjeta para enseñar lo mismo que `/accesorios`. Ahora la app **reutiliza
`AccessoryCard`**, la fuente real de ese tratamiento, en vez de copiar sus
clases.

**`VariantPage` sigue siendo una sola página compartida**: divergen tres nodos,
no la página (**D-087**). **La web no cambia**, comprobado comparando el HTML
renderizado de la ficha, idéntico carácter a carácter a 1440 y a 390.

Sin tocar: selectores, stock, entrega, financiación, compra, reservas, seguro,
pestañas, barra fija, distintivo de precio y `ModelPage`.

## 2026-08-29 — Fase B1: la tarjeta del catálogo nativo respira

**Primera entrega visual de Fase B, y sólo para la app** (D-086).

**Antes**: borde de tarjeta, dentro una caja gris para la imagen y dentro el
producto con su relleno —tres marcos—; debajo, nombre y descripción con dos
líneas reservadas cada uno, precio discreto, un distintivo de «precio
demostrativo» por producto y un botón de comparar del ancho completo. A 320×568
la tarjeta ocupaba **510 px** y el precio **no se veía**.

**Ahora**: la imagen es la única superficie; el nombre y el precio van juntos
debajo; favorito y comparar son iconos sobre la foto, con sus 44 px, su nombre
accesible y su `aria-pressed`.

**Medido a 320**: imagen 246 → **224**, nombre 15 → **21**, precio **0 → 20
visibles**, tarjeta 510 → **281**. A 390, el segundo producto pasa de no verse a
asomar 213 px.

**La proporción es 5:4, no el 4:3 del diseño**: a 320 la imagen ocupa el ancho
completo y su proporción decide el alto de todo. Con 4:3 la foto bajaba a 216 px;
con 5:4 el precio entra igual y el producto conserva más presencia. El `ratio`
por defecto de `ProductImage` no se toca —movería la web—: se pasa por prop.

**El aviso de precios demostrativos no desaparece**: deja de repetirse por
tarjeta y se da una vez por listado, al pie. Puesto en la cabecera empujaba el
primer producto 44 px hacia abajo, medido.

**La web queda idéntica**, comprobado con `cmp` sobre `/iphone`, `/buscar` y la
portada a 1440. `ProductCardCompact`, `VariantPage` y `ModelPage`, sin tocar.
**B2 no ha empezado.**

## 2026-08-29 — La tarjeta de producto tiene frontera de plataforma

**Causa.** `ProductCard` seguía siendo una sola composición montada por la web
—`WebFamilyPage`, `Home`— y por la app —`AppFamilyPage`—, además de por
`/buscar`, que es la misma pantalla en ambas. Cualquier retoque pensado para el
catálogo nativo habría cambiado la web, que es el acoplamiento que D-085
prohíbe y que la entrega anterior corrigió para `FamilyPage`.

**Frontera creada.** `ProductCardWeb` y `ProductCardApp`, con el comportamiento
compartido en `useTarjetaDeProducto`: variante enseñada, oferta, destino,
favorito y comparación se definen una sola vez y siguen saliendo de
`lib/offers`. Cada superficie importa explícitamente la suya, así que la
frontera se lee en los imports; no hay un componente genérico que vuelva a
montar las dos plataformas. `/buscar` decide una vez en su cabecera.

**Cero cambio visual.** Las dos tarjetas nacen idénticas a lo que su plataforma
enseñaba. Comprobado con `cmp` sobre seis capturas —web `/iphone`, `/buscar` y
portada a 1440; app `/iphone` a 320 y 390 y `/buscar` a 390—: **todas idénticas
bit a bit**. Esta entrega construye la puerta, no la cruza.

**Tests de plataforma.** `tarjeta-por-plataforma.spec.ts` comprueba, mediante
`data-product-card-surface` —semántica de arquitectura, no estilo—, que la web
sólo monta tarjetas web y la app sólo de app, incluida la búsqueda en los dos
modos; y que separar la presentación no ha separado el comportamiento.

**Sigue pendiente**: `VariantPage` y `ModelPage`. `ProductCardCompact` no
formaba parte de esta migración.

## 2026-08-28 — Las páginas de familia se separan en web y app

**La regresión.** En el navegador, las páginas de familia habían perdido su
escaparate: donde había un carrusel de modelos, una sección de «Oportunidades»
con degradado y un encabezado de catálogo completo quedaba una rejilla con dos
botones táctiles. Medido en `/iphone` a 1440 px: **0 secciones con degradado, 0
`<select>` de orden, ningún encabezado de contenido** y una página de 1.785 px.

**La causa.** `f3143d85` —«feat(app): Tienda deja el catálogo a un toque»— era
una mejora real para la app: en `/iphone` los filtros aparecían en y=2.238. Pero
`FamilyPage` la montaban **las dos plataformas**, así que la simplificación se
llevó por delante también la web. La PR #85 no causó la pérdida, aunque siguió
tocando la misma composición compartida.

**La separación.** `FamilyPage` resuelve el 404 y decide la plataforma una sola
vez, delegando en `WebFamilyPage` o `AppFamilyPage` —el patrón que `Home` ya
usaba—. Los controles se parten en `CatalogFiltersWeb` y `CatalogFiltersApp`; el
dominio se comparte en `useCatalogoFamilia` y en `lib/catalogFilters`, donde
viven las listas de órdenes y disponibilidades para que separar la presentación
no separe también lo que se ofrece. Queda como decisión: **D-085**.

**La web restaurada.** `/iphone` a 1440 pasa de **1.785 a 3.057 px** y recupera
carrusel → Oportunidades → catálogo completo. `/mac` igual. No es una copia del
fichero antiguo: se conservan el estado en la URL, el estado sin resultados, la
llamada única al comparador y el i18n, con **cinco claves nuevas en los cinco
idiomas** para los literales que el escaparate histórico traía en castellano.

**Sin ofertas no hay escaparate.** La primera versión, si la familia no tenía
rebajas, enseñaba los cuatro primeros modelos bajo el título «Oportunidades»,
con distintivo de oferta y precio en rojo. iPad y Apple Watch no tienen ningún
precio anterior, así que la web les fabricaba descuentos inexistentes. Ahora las
ofertas se derivan de `getOfferVariant` —la definición canónica, que además
garantiza que imagen, color, capacidad, precio, precio anterior y enlace son de
la **misma** variante— y la sección **sólo se monta si hay alguna**. `/ipad` y
`/apple-watch` van de modelos a catálogo directamente.

**La app no cambia.** `/iphone` a 320 y 390 y `/tienda` a 390 son **idénticas
bit a bit** antes y después, comprobado con `cmp`. El contrato de Fase A se
mantiene: imagen 246 px, nombre 15 px, primer producto en y=210, sin
desbordamiento. AirPods en la app conserva sus controles táctiles.

**Y una corrección en el contrato.** `producto-en-pantalla.spec.ts` pasaba al
navegador `MINIMO_IMAGEN` a secas mientras dentro leía `minimos.imagen` y
`minimos.nombre`: sobre un número, ambas son `undefined`. TypeScript no lo veía
—el parámetro de `page.evaluate` se infiere como `any`— y el CI tampoco, porque
las aserciones que deciden se evalúan contra las constantes reales. No relajaba
ningún umbral; desactivaba el descarte de tarjetas por debajo del mínimo. Los
mínimos siguen en **120 y 12**.

## 2026-08-23 — Tienda deja de ser un Inicio recortado y pasa a ser el catálogo

Tienda enseñaba **6 ofertas de 23 modelos** —cuatro Mac—, así que iPad, Watch,
AirPods y Accesorios no aparecían en toda la pantalla; con historial real la
**intersección de producto con Inicio era 6 de 6**; y Servicios ocupaba **286
px, el 31 %**.

Ahora el orden es **Tienda · Explorar · Oportunidades · Ayuda para elegir ·
Servicios**. **Explorar** lleva a las seis familias desde el propio contenido:
los chips del armazón ocupan 474 px, a 320 px sólo se ven cuatro de seis y se
recortan al bajar, así que no eran una entrada suficiente —y no se tocan—.
Oportunidades pasa a enseñar **todas** las ofertas reales, sin «Ver todas»: en
Inicio son un teaser de cuatro, aquí el conjunto. Los servicios quedan en tres y
comerciales —Plan Renove, «Comprar en tienda» y Servicio técnico—; `/servicios`
y `/soporte` dejan de repetirse aquí. La ayuda para elegir corrige su icono
—pedía `sparkles`, que no existe, y `Icon` caía a `info`— y su jerarquía
invertida. Ver
[[02-decisiones#D-077 — Tienda es la puerta al catálogo, no una selección]].

Medido a 320: seis familias alcanzables sin desplazamiento lateral y con 56 px
de alto, servicios de **286 → 188 px**, total de **954 → 1080 px**. La pantalla
crece 126 px y a cambio deja de ser un subconjunto de Inicio.

**No cambian** `HomeWeb`, `AppCustomerHome`, `ProductCardCompact`, `AppTopBar`,
`AppTabBar` ni los catálogos de familia; `/tienda` sigue redirigiendo a `/` en
la web.

Verificación local: **487 E2E aprobadas y 1 omitida esperada** en Chromium y
móvil contra el artefacto, **37/37** en preferencias, **24/24** en el panel,
**358 unitarias**, `typecheck`, `build:test`, Prettier y ESLint con 0 errores, y
`app:sync` correcto para iOS y Android sin tocar ningún fichero nativo
versionado.

## 2026-08-23 — Inicio deja de abrir con un saludo y abre con lo que importa

El saludo `Hola, <nombre>` iba a 28 px de display y ocupaba **68 px con sesión y
182 sin ella**; el Finder no empezaba hasta **y=258**; y a **320 px no se veía ni
un producto completo** en el primer viewport. La pantalla sumaba **1559 px** con
**5 títulos, 13 superficies y 2 carriles idénticos** —y el mismo producto podía
salir en los dos—.

Inicio pasa a contar una historia: **lo que requiere atención → lo que Banana
puede ayudar a elegir → lo que estabas viendo**. Orden nuevo: identidad
compacta, aviso si existe, Finder, «Seguías mirando», Oportunidades, tienda y
ayuda. **El aviso va antes del Finder**: una reserva disponible es temporal y
accionable. «Seguías mirando» usa una **variante `recent`** de la tarjeta que
sólo retira la presentación de oferta —mismo producto, misma variante, mismo
destino y mismo favorito—, Oportunidades baja a **cuatro exactas** y **descarta
lo que ya se enseña arriba**. Tu tienda queda en una sola fila y la ayuda pierde
su encabezado. Ver
[[02-decisiones#D-076 — Inicio cuenta lo que requiere atención, no el catálogo]].

Medido después: identidad **68 → 64 px**, Finder **258 → 178** con aviso y
**141** sin él, total **1559 → 1448 px** (**3,54 → 3,29 pantallas**) a 320,
títulos **5 → 4**, superficies **13 → 11**, **0 duplicados** entre carriles y 0
desbordamiento. **La web no cambia**: `HomeWeb` y `AppHome` quedan intactas.

Verificación local: **481 E2E aprobadas y 1 omitida esperada** en Chromium y
móvil contra el artefacto, **71 de integración**, **37/37** en preferencias,
**358 unitarias**, `typecheck`, `build:test`, Prettier y ESLint con 0 errores, y
`app:sync` correcto para iOS y Android sin tocar ningún fichero nativo
versionado. La prueba de deduplicación tiene contraprueba: sin el filtro se pone
roja con `iphone/17-pro`.

## 2026-08-22 — Cuenta se navega como una app, no como una web estrecha

`/cuenta` deja de ser una pantalla con un carril horizontal de siete apartados.
Medido con la aplicación real: el carril ocupaba **1104 px** en una caja de
**280 px a 320** y **350 a 390**, así que en cinco de las siete pantallas a 320
px sólo se veía **el apartado en el que ya estabas**.

Los siete apartados pasan a tener **ruta propia** —`/cuenta/datos`,
`/cuenta/pedidos`…— y **web y aplicación comparten la gramática**. En la
aplicación `/cuenta` es ahora una lista vertical con grupos —Actividad, Mis
datos, Preferencias— y cada fila abre su pantalla con el «Volver» del sistema;
`AppTabBar` sigue visible y la pestaña Cuenta marcada. «Cerrar sesión» baja al
final, y Favoritos y Tienda habitual van directas a `/favoritos` y `/tiendas`.

**La web no se rediseña**: a 1440 px conserva columna, contenido, identidad,
«Cerrar sesión» arriba a la derecha y la tarjeta de «Mis productos». Lo único
que cambia es la dirección de cada enlace.

`?apartado=` sigue entrando y se traduce con `replace` conservando el resto de
la consulta; ningún enlace de la aplicación la genera ya. El «Volver» de
`/cuenta/*` es `/cuenta`, con una sola entrada en `appBack`. Un enlace profundo
sin sesión conserva su destino tras identificarse. Ver
[[02-decisiones#D-075 — Cada apartado de la cuenta es una ruta, y la app la recorre como una lista]].

Las siete secciones salen de `ProfilePage` a `src/components/account/` **sin
tocar su cuerpo**: misma lógica, mismos estados, mismas peticiones. Sólo cambia
quién las compone.

Verificación local: **468 E2E aprobadas y 1 omitida esperada** en Chromium y
móvil contra el artefacto, **71 de integración contra Supabase local** (+11
casos nuevos), **35/35** en preferencias, **358 unitarias en 23 ficheros**
(+5), `typecheck`, `build:test`, Prettier y ESLint con 0 errores, y `app:sync`
correcto para iOS y Android sin tocar ningún fichero nativo versionado.

## 2026-08-22 — La prueba de la cabecera del checkout deja de correr una carrera

**Sólo pruebas; cero cambios en producción.** `barra-banana.spec.ts` abría
`./checkout/3` sin pedido demostrativo y medía el `header` acto seguido. Pero el
paso 3 está guardado: sin pedido, `CheckoutPage` hace `<Navigate replace />`, y
medir el color mientras el nodo se desmonta devuelve **cadena vacía**. Eso fue
el intermitente del CI pre-merge de la PR #70 (run `32591398519`):
`Expected "rgb(255, 206, 31)" · Received ""`.

Los cuatro casos de checkout entran ahora por el flujo real —carrito sembrado,
paso 1 relleno, pedido confirmado— con el nuevo `tests/e2e/checkout-helpers.ts`,
y confirman URL, `#contenido-checkout` y **una sola** cabecera antes de medir.
`sembrarCarrito` no es código nuevo: estaba duplicado literalmente en
`checkout.spec.ts` y `checkout-flow.spec.ts` y se ha extraído allí.

El redirect es correcto y no se toca; lo sigue comprobando `checkout.spec.ts`.
Verificación: 20 repeticiones del caso sin un solo reintento, contraprueba que
pone rojas cinco pruebas al romper el color, suite completa en Chromium y móvil
con 468 aprobadas y 1 omitida esperada, 353 unitarias y `build:test`.

## 2026-08-22 — La barra de compra de la ficha cabe en un móvil estrecho

**UI-002.** A 320 px la barra fija inferior de `VariantPage` medía **339 px de
contenido en 320 de ancho** y «Comprar» quedaba cortado. Deuda preexistente,
observada revisando la PR #68 y reproducida contra `main` en `2a69349f`.

**La causa no era la que parecía.** El mecanismo para ceder ancho existía pero
estaba muerto: las tres llamadas de la barra pedían `px-3`/`px-4` en `className`
y recibían igualmente los 32 px por lado del tamaño `lg`, porque entre dos
utilidades de la misma propiedad decide el orden de la hoja de estilos. A 320 px
el padding de los dos botones ocupaba **128 px** frente a **140,58** de texto.

**Y tampoco era un defecto sólo nativo.** La barra es `lg:hidden`, no
`isNativeApp`: la web móvil monta la misma y desbordaba igual, 339/320. La ficha
del problema decía lo contrario y queda corregida.

`Button` separa el padding horizontal del tamaño y admite `paddingX`, que lo
sustituye en vez de competir con él —ver
[[02-decisiones#D-074 — El padding horizontal de un botón se sustituye, no se pisa]]—;
los tres botones de la barra comparten `px-3 min-[360px]:px-5 sm:px-8`. Nada se
recorta, se esconde, se abrevia ni se escala: a 320 px «Comprar» termina 16 px
dentro de la barra, «Al carrito» pasa de dos líneas a una, el precio anterior
deja de envolverse y los controles siguen midiendo 52 px de alto. Desde `sm` los
botones vuelven a su tamaño original.

Vigilado por diez casos nuevos en `tests/e2e/app-shopping.spec.ts` —dos anchos ×
cinco estados, contratos relativos con 2 px de tolerancia—, con contraprueba:
tres se ponen rojos contra `2a69349f` y los otros siete siguen verdes porque esos
estados sí cabían. `anchos.spec.ts` no lo veía ni lo verá: mide el documento y
`#contenido`, y esta barra es `position: fixed`.

Verificación local: 468 E2E aprobadas y 1 omitida esperada en Chromium y móvil
contra el artefacto de `build:test`, 353 unitarias, `typecheck`, Prettier y
ESLint con 0 errores. Los 25 avisos de ESLint y el aviso de fragmentos por
encima de 500 kB son preexistentes y ajenos a este cambio.

## 2026-08-21 — «Volver» en las pantallas secundarias de la app nativa

**PR #68** — «Añade navegación Atrás a las pantallas secundarias nativas».
Rama `feat/native-back-navigation`, head `23716f10`, fusionada con *merge
commit* en `d6e6e9ee` sobre `e2a92e19`. Cinco archivos funcionales, `+617/−0`:
`src/lib/appBack.ts`, `src/lib/useAppBack.ts`,
`src/components/layout/AppTopBar.tsx`, `tests/unit/app-back.test.ts` y
`tests/e2e/app-atras.spec.ts`.

En iPhone no hay retroceso del sistema, así que las secundarias del armazón
nativo llevan ahora un control «Volver». **Con historial propio manda el
historial** —el catálogo vuelve con sus filtros, la búsqueda con su término—;
**sin él se va a un destino semántico con `replace`**. Las cuatro raíces de
`AppTabBar` y `/login` no lo llevan. La regla semántica vive en `appBack.ts`
como función pura, `useAppBack.ts` es lo único que lee `window.history.state` y
`AppTopBar` sólo pinta el botón —44×44, `aria-label="Volver"`, galón existente
girado—. La revisión visual a **320×568 y 390×844** quedó aprobada; la web no
cambia. Ver
[[02-decisiones#D-073 — «Volver» usa el historial cuando existe y un destino semántico cuando no]].

Verificación. CI de la PR (`32530133221`) y CI posterior sobre `main`
(`32533459831`), ambas en el intento 1 y en verde. Cifras del run post-fusión:
**464 pruebas E2E — 463 aprobadas, 1 omitida esperada, 0 fallos, 0 reintentos,
0 inestables**; 353 unitarias; `app-atras` 12/12; `app-back` 31/31; 24/24 en el
panel de agentes; 35/35 en preferencias; 36 + 60 + 5 contra Supabase; y
**GitHub Pages ejecutado de verdad y desplegado** sobre `d6e6e9ee`. Los ceros de
reintentos e inestables salen de buscarlos en el registro del trabajo, no del
distintivo verde.

Avisos no bloqueantes del mismo run, **ninguno introducido por esta PR**:
deprecación de Node 20 en las acciones, avisos de ESLint en `ChatBubble.tsx`,
`npm audit` con una vulnerabilidad alta, `allow-scripts`, fragmentos de Vite por
encima de 500 kB, deprecaciones de `punycode`/`url.parse` y de `[inbucket]` en
la CLI de Supabase, y límites de descarga de Docker que se recuperaron solos.

Fuera de alcance a propósito: `/checkout/:step`, `/agente` y `/agente/login`,
que no montan `AppTopBar`; añadir `@capacitor/app` o interceptar el botón físico
de Android, que sigue delegando en el historial del WebView. Durante la revisión
se anotó además una deuda preexistente y ajena,
[[04-problemas-pendientes#UI-002 — La barra de compra de la ficha se sale por la derecha a 320 px]].

## 2026-08-19 a 2026-08-20 — La app nativa deja de parecer una web comprimida

Cinco PR seguidas del tramo de trabajo centrado en la aplicación nativa; la #62
alcanza también a la web. Ninguna toca datos, catálogo, Supabase, dependencias
ni flujos de compra. Todas se integraron con *merge commit*, con los cuatro
checks en verde, sin `--admin` y sin borrar la rama.

- **PR #62** (`144294d8`, 2026-08-19) — «El aviso de tienda favorita deja de
  comerse los toques de Inicio». El aviso deja de flotar y ocupa banda propia en
  la app y en la web, con tope de `55dvh` y desplazamiento interno de la lista.
  El foco inicial sólo se toma si el botón de cerrar está a la vista. Las dos
  pruebas de la PR #53 se reorientaron a comportamiento. Ver
  [[02-decisiones#D-070 — El aviso de tienda favorita ocupa banda, no flota]].
- **PR #63** (`763b9a71`, 2026-08-19) — «El test del aviso mide el
  desplazamiento contra su propia banda». Corrige un intermitente aparecido tras
  fusionar la #62: la cota pasa de un número fijo a derivarse de la altura real
  de `[data-favorite-store-prompt]`, medida sobre `main`.
- **PR #64** (`3bb99a91`, 2026-08-20) — «La tarjeta de producto da protagonismo
  al dispositivo». `ProductCardCompact` pierde borde y caja gris; la foto ocupa
  el ancho completo. Cambio presentacional: normalizado el archivo, la única
  diferencia funcional es `pad={!color.imageBg}` → `pad={false}`.
- **PR #65** (`096a3bf8`, 2026-08-20) — «Inicio gana jerarquía e identidad
  Banana». Saludo con tipografía de display, secciones en banda amarilla y
  tarjeta con Bananito. Antes, el área de contenido era 90,1 % blanco y gris y
  el azul de marca bajaba al 0,1 %. CI posterior (`32417548643`): 450 pruebas,
  449 aprobadas, 1 omitida esperada, 0 fallos, 0 inestables.
- **PR #66** (`5bdee61f`, 2026-08-20) — «Las tarjetas compactas mantienen la
  misma altura». Cada zona de texto reserva su caso más alto: de 244,75 / 220,75
  / 239,5 px a 264 en los tres casos. Las dos pruebas nuevas comprueban igualdad
  relativa, nunca una altura absoluta. CI posterior (`32425136106`): 452
  pruebas, 451 aprobadas, 1 omitida, 0 fallos, 0 reintentos, 0 inestables;
  24/24 en el panel de agentes, 35/35 en preferencias, 36 + 60 + 5 contra
  Supabase y Pages desplegado. Ver
  [[02-decisiones#D-072 — La geometría de la tarjeta no depende del producto]].

La dirección visual de las #64 y #65 queda recogida en
[[02-decisiones#D-071 — En la app manda el producto, no el contenedor]].

## 2026-08-07 a 2026-08-17 — El tramo #39 a #61, reconstruido

Estas veintitrés entradas se escribieron el **2026-08-23**, no en su momento: el
registro saltaba del 2026-08-07 al 2026-08-19 y el hueco estaba anotado como
DOC-002. Se reconstruyeron desde los merge commits y se contrastaron con el
código de `main`. Cada una dice, cuando procede, **en qué acabó**.

### La app deja de ser la web dentro de un binario (#39 · #41)

- **PR #39** (`1d803416`, 2026-08-07) — *La app nativa se comporta como una
  tienda*. La portada del binario deja de ser la corporativa —carrusel de marca,
  novedades, servicios, Plan Renove, FAQ— y pasa a ordenarse **producto →
  descubrimiento → disponibilidad → compra**. Añade historial de vistos. Trajo
  **D-064**, **D-065** y **D-066**. *Después*: su composición fue reemplazada por
  D-076 (#73) en Inicio y D-077 (#74) en Tienda; D-064 y D-066 siguen vigentes.
- **PR #41** (`0144b339`, 2026-08-08) — *Inicio · Tienda · Mis compras · Cuenta*.
  Cuatro pestañas en lugar de cinco, y el cupón del carrito deja de desbordar en
  móvil. Trajo **D-068** y **D-069**. *Después*: la estructura sigue vigente; el
  rótulo «Mis compras» pasó a «Compras» en la #57. La ruta `/mis-productos` no se
  movió, a propósito.

### Pedidos y «Mis productos» (#40 · #57)

- **PR #40** (`7bf8628e`, 2026-08-08) — *El pedido recuerda qué producto era, y
  «Mis productos» v1*. `mirrorOrderToSupabase` perdía cinco campos de cada línea
  —entre ellos `family` y `modelSlug`—, así que de un pedido guardado no se podía
  saber qué producto era. Sin migración: `pedidos.lines` ya era `jsonb`. Trajo
  **D-067**.
- **PR #57** (`56cadc82`, 2026-08-16) — *Mis productos convierte tus compras en
  una superficie útil de cuenta*. La pantalla sólo muestra líneas con
  `kind === 'device'`, de modo que quien compraba sólo accesorios veía «Mis
  compras» vacío. La pestaña pasa a **«Compras»** y la pantalla deja de ser una
  rejilla de catálogo. Reconstruida como **D-084**.

### Encaje, barras y armazón (#42 · #43 · #49 · #58)

- **PR #42** (`510e24f5`, 2026-08-08) — *Que quepa en la ventana, y las tiendas
  avisen antes de abrir y de cerrar*. A 320 px Cuenta desbordaba **789 px**: no
  eran los campos, era el menú de siete chips, cuyo `overflow-x-auto` **nunca
  llegaba a actuar** porque nadie le ponía límite —su scroll interno medía 0—.
  Queda en 0 px de desbordamiento y 809 px de scroll interno. Añade aviso de
  próxima apertura y cierre en tiendas. *Después*: Cuenta se rediseñó en la #72
  (D-075), pero el criterio de encaje sigue.
- **PR #43** (`7a8f3b9b`, 2026-08-09) — *Nav que no se pisa, panel de agentes
  redimensionable y barras de la app*. Tres cosas: la barra azul de servicios de
  la web pasa a `xl` —solapaba de 640 a ~1000 px—, el panel de agentes gana un
  divisor arrastrable, y las barras de la app reciben color. Reconstruida como
  **D-078**.
- **PR #49** (`8887ef10`, 2026-08-11) — *Inicio también usa la barra superior
  amarilla*. No había un fallo de safe area: en Tienda el patrón ya era correcto.
  Inicio estaba claro por una decisión de diseño explícita, y es esa decisión la
  que cambia. *Después*: **sustituida por la #58**, que quitó la condición.
- **PR #58** (`e39802a7`, 2026-08-16) — *La barra de Banana es amarilla en toda
  la aplicación*. `contextoDe` devuelve tres valores y **todo lo `neutro` caía en
  blanco sin que nadie lo hubiera decidido**: soporte, tiendas, servicio técnico,
  Plan Renove, login, registro y el 404. Cierra **D-078**.

### Integridad de las pruebas (#44 · #45 · #46 · #51)

- **PR #44** (`8d4b36ab`, 2026-08-09) — *La foto de producto no se sale de su
  marco*. No era el hero: era `ProductImage` en toda caja no cuadrada. El padre
  era un `grid` cuya fila se dimensionaba por contenido (316 px) mientras la caja
  medía 197,5. Una línea de diff, más su regresión.
- **PR #45** (`ac3729e9`, 2026-08-09) — *Integridad de pruebas: que puedan
  ponerse rojas*. Una auditoría concluyó `TESTS NO FIABLES`; se demostraron
  **seis mecanismos de falso verde** en `nav-solapes`, `anchos` y `secretos`.
  Ningún cambio funcional del producto. Reconstruida como **D-081**.
- **PR #46** (`117acdc7`, 2026-08-09) — *El flaky del comparador era la URL, no
  el comparador*. Dos ejecuciones de CI con el mismo fallo en 1,2–1,3 s, sin
  agotar timeout: no era una espera corta, era el parámetro de la URL.
- **PR #51** (`cb481247`, 2026-08-12) — *El selector de tienda en Favoritos deja
  de ser ambiguo*. Inestable observado en el CI posterior a la #50. El error real
  era un `strict mode violation`: el rótulo resolvía a **dos** botones, y sólo se
  manifestaba si aparecía el diálogo de bienvenida. **No arreglaba el arranque de
  la #50**; era higiene de CI, y fue aparte.

### Chat y panel de agentes (#47 · #48)

- **PR #47** (`7b7307ab`, 2026-08-10) — *La identidad del chat sin cuenta deja de
  ser duradera*. Reproducido contra Supabase local: mismo `auth.uid` anónimo y
  misma conversación tras reiniciar; borrar `localStorage` no bastaba.
  Reconstruida como **D-082**.
- **PR #48** (`7ee79759`, 2026-08-11) — *Cerrar una conversación ya se refleja en
  el panel*. **El backend siempre funcionó**: `cerrar_conversacion` devolvía 204.
  Eran dos defectos de interfaz —la selección apuntaba a una fila que salía de la
  bandeja, y el panel esperaba su propio eco de *realtime*—.

### Arranque nativo (#50 · #54)

- **PR #50** (`01581a30`, 2026-08-12) — *El arranque nativo deja de parpadear en
  blanco*. Sin `ios.backgroundColor` el `WKWebView` nace blanco: **~700 ms**
  medidos. Dos causas independientes, las dos demostradas. Parte de **D-079**.
- **PR #54** (`8e8b901f`, 2026-08-14) — *El arranque enseña el logotipo hasta que
  la Home está pintada*. Un defecto **distinto** del anterior: pantalla negra
  antes del amarillo y logotipo ausente. Descartadas la ventana y el
  `LaunchScreen` pintándolos de magenta y cian. Cierra **D-079**.

### Tipografías (#52)

- **PR #52** (`c33d0389`, 2026-08-13) — *Las tipografías dejan de depender de
  Google Fonts*. Pasan a `@fontsource`, con los mismos pesos exactos. Se descartó
  ampliar `IGNORED_ERROR`, que habría creado falsos verdes. Reconstruida como
  **D-080**.

### Aviso de tienda favorita (#53)

- **PR #53** (`90f03b5c`, 2026-08-14) — *El aviso de tienda deja de bloquear la
  página por fuera del panel*. Nació y se documentó como hoja no bloqueante
  —`aria-modal="false"`, sin backdrop—, pero su capa exterior ocupaba **todo el
  ancho** conservando `pointer-events: auto`. *Después*: la #62 descubrió que
  seguía comiéndose los toques de Inicio y lo movió a banda propia (**D-070**);
  la #63 estabilizó su prueba.

### Inicio y Tienda, primera versión (#55 · #56)

- **PR #55** (`494a31dd`, 2026-08-14) — *Inicio deja de ser una lista de
  enlaces*. Era un saludo, cuatro filas de enlaces —tres de ellas ya en la barra
  inferior—, la tienda favorita y un botón a Tienda: ni un producto, ni un
  precio, ni una imagen. *Después*: **sustituida por D-076** (#73).
- **PR #56** (`14c15d68`, 2026-08-15) — *Tienda deja de repetir Inicio y el
  catálogo se vuelve directo*. Tienda era Inicio otra vez con un escaparate
  delante: el `h1` de la sección era el nombre de un iPhone, y había 1.951 px
  —2,3 pantallas— sin un solo control de catálogo. Quita además los **dos
  escaparates** que precedían al filtro dentro de una familia. *Después*:
  **sustituida por D-077** (#74).

### Cuenta, compra invitada y Atrás (#59 · #60 · #61)

- **PR #59** (`dc9fe5ba`, 2026-08-17) — *La compra invitada se guarda en tu
  cuenta al identificarte*. Vivía en `sessionStorage` y se perdía al cerrar la
  pestaña. Reconstruida como **D-083**.
- **PR #60** (`704a1fd7`, 2026-08-17) — *Cuenta mantiene la URL, el historial y
  el apartado activo*. El apartado salía de un `useState` sembrado una sola vez,
  así que la URL mentía y Atrás no volvía al apartado anterior. *Después*:
  **sustituida por D-075** (#72), que lo movió de `?apartado=` a subrutas
  `/cuenta/:apartado` porque las raíces de «Atrás» se comparan por *pathname*.
- **PR #61** (`c0cce5cb`, 2026-08-17) — *Atrás desde una ficha vuelve al catálogo
  sin carreras de historial*. Salió del CI posterior a la #60, que terminó en
  `success` pero **no limpio**: `431 passed · 1 skipped · 1 flaky`. La guarda
  sigue en `VariantPage.tsx`. *Después*: **generalizada por D-073** (#68), que
  dio a la app un «Volver» propio.

## 2026-08-07 — Transferencia del repositorio y protección de `main`

- El repositorio pasa a `Oskrrr09/pagina-banana`. Con la transferencia cambia la
  **URL pública**: GitHub Pages no redirige entre cuentas, así que la anterior
  devuelve 404 y la buena es <https://oskrrr09.github.io/pagina-banana/>.
- PR #37: 33 referencias al propietario anterior actualizadas en README y
  documentación. Diez estaban rotas —las de Pages—; las otras funcionaban por la
  redirección de GitHub, que se rompe en cuanto alguien cree un repositorio con
  el mismo nombre bajo la cuenta antigua.
- Nuevo ruleset «Protección de main» (`20547777`): pull request obligatorio con
  0 aprobaciones, los cuatro checks de CI en verde, rama al día, force push y
  borrado bloqueados, sin bypass ni para el propietario. Ver
  [[02-decisiones#D-063]].
- Verificado en la propia PR #37: con checks pendientes GitHub **rechazó** la
  fusión y el estado era `BLOCKED`; con los cuatro en verde pasó a `CLEAN` y se
  fusionó con normalidad.
- `Publicar en GitHub Pages` no figura entre los obligatorios, a propósito: es un
  job de despliegue condicionado al `push` sobre `main`, no valida el PR, y
  exigirlo añadiría una dependencia innecesaria entre validación y despliegue.
  (No es que un check omitido bloquee la fusión: GitHub acepta `success`,
  `skipped` o `neutral`. Lo que bloquea indefinidamente es un workflow exigido
  que no llegue a reportar ningún estado.)
- `AGENTS.md` recoge que `main` ya no acepta escrituras directas.

## 2026-08-06 — Las preferencias de cuenta no sobreviven al cierre de sesión

- Tienda favorita, seguimientos de disponibilidad y notificaciones se guardaban
  en claves generales de `localStorage` y `signOut()` no las tocaba: en un
  navegador compartido, quien entrara después seguía viendo la tienda habitual,
  los seguimientos y los avisos de quien acababa de salir, contador incluido.
- Nuevo aviso interno tipado `src/lib/accountSession.ts`. `signOut()` lo emite
  y cada proveedor se reinicia solo, sin que nadie escriba en el estado de otro
  y sin recargar la página.
- Borrar las claves no bastaba —los proveedores guardan estado en memoria— y
  reiniciar el estado tampoco —el efecto de persistencia reescribía `"[]"`—.
  Ahora una lista vacía borra su clave.
- Intactos el carrito, el idioma y la conversación anónima del chat.
- `signOut()` ignoraba el `{ error }` de Supabase: podía borrar las preferencias
  con la sesión todavía abierta. Ahora devuelve el error, la limpieza sólo corre
  si el cierre se confirmó, y `/cuenta` espera esa confirmación antes de navegar
  en vez de aparentar que se cerró.
- Regresión: 11 casos unitarios y 6 con los proveedores reales en navegador.
- Riesgo residual anotado: los cierres nacidos en otra pestaña o por
  invalidación de la sesión no reinician las preferencias todavía.
- CI verde en el run `31128555965`: 193 unitarias y de esquema, 36 RLS más 2 de
  integración y 5 de confirmación, 296 E2E aprobadas y 1 omitida en cinco
  motores, 6 del panel aislado y 10 del banco de pruebas de preferencias y
  `/cuenta`.
- Ver [[02-decisiones#D-062]] y
  [[04-problemas-pendientes#SEG-PREF-001 — Las preferencias de cuenta sobrevivían al cierre de sesión]].

## 2026-08-06 — Sesiones anónimas separadas y migración aplicada en producción

- Una sesión anónima del chat deja de valer como cuenta de cliente. Supabase le
  da el mismo rol PostgreSQL que a una cuenta real, `authenticated`, así que
  abrir el widget bastaba para quedar dado de alta en `clientes` y poder crear
  pedidos, reservas y justificantes. Nueva migración
  `20260806000400_separa_sesiones_anonimas.sql` con `es_usuario_permanente()`,
  políticas restrictivas y la comprobación dentro de cada RPC de cliente.
- El DELETE del bucket educativo también la exige. Era el más delicado: la
  carpeta se llama como el `auth.uid()` y la conversión conserva ese uid, de
  modo que un token anónimo anterior seguía apuntando a la carpeta de la cuenta
  ya registrada.
- El registro sigue el orden documentado de dos pasos —email primero, contraseña
  sólo tras verificarlo— y decide si hace falta confirmar por lo que responde el
  servidor, no por una suposición sobre la configuración del proyecto.
- Segunda pasada de integración con la confirmación de email **activada**, que
  antes no se ejercitaba nunca.
- **Despliegue de base de datos.** Respaldo completo fuera del repositorio,
  CLI enlazada y las cuatro migraciones aplicadas en el proyecto real.
  `migration list` muestra los cuatro identificadores iguales en Local y Remote;
  `db push --dry-run` responde `Remote database is up to date`; las cinco
  comprobaciones SQL de seguridad devuelven `true`.
- Efecto medido por API pública de sólo lectura: el rol anónimo pasó de leer
  **36 filas de `visitantes`** a no leer ninguna.
- Authentication: alta de usuarios activada, enlazado manual activado,
  confirmación de registro desactivada —y debe seguir así—, inicios anónimos
  **todavía desactivados**, límite de 30 por hora e IP, CAPTCHA no localizado ni
  configurado.
- Pendiente: fusionar la PR #35, publicar, activar los inicios anónimos y hacer
  pruebas de humo. Hasta entonces el chat de la web pública no funciona, porque
  el frontend publicado sigue siendo el anterior. Ver [[08-predespliegue-supabase]].

## 2026-08-05 — Permisos de tabla, cierre del chat y aviso de Router

- Nueva migración `20260805000300_permisos_de_tabla.sql`: las tablas ya no
  nacen sin permisos. Concede el mínimo que refleja cada política a `anon`,
  `authenticated` y `service_role`; lo que no aparece pasa por un RPC
  `security definer`. Sin ella, RLS no llegaba a evaluarse y `service_role`
  —que salta RLS pero no los GRANT— no podía dar de alta un agente.
- `tests/schema/andamio.ts` deja de concederse permisos sobre `public` antes de
  aplicar las migraciones. Se concedía lo que iba a medir, así que respondía en
  verde mientras Supabase local estaba en rojo. Gana el rol `service_role` y
  `tests/schema/politicas.test.ts` pasa a usarlo en vez de su propia copia.
- `tests/schema/permisos.test.ts` (nuevo) comprueba el cuadro de permisos tabla
  por tabla, incluido lo que **no** debe poder hacerse y que `PUBLIC` no recibe
  nada. Las pruebas de esquema pasan de 125 a 159 unitarias en total.
- `clienteRegistrado()` de las pruebas RLS comprueba el error del alta. Antes
  lo ignoraba, así que un fallo del alta reaparecía disfrazado a diecisiete
  pruebas de distancia.
- El diálogo del chat se desmonta al cerrar aunque el navegador no entregue
  `requestAnimationFrame`. Colgaba sólo de `transitionend`; cuando no llegaba,
  quedaba invisible pero presente como `role="dialog" aria-modal="true"`.
  Salió como fallo de WebKit y Safari móvil y se reprodujo en Chromium.
- El pedido de prueba de `tests/rls/politicas.spec.ts` trae `delivery` y
  `payment_method`, que son NOT NULL sin valor por defecto. El insert nunca
  podía funcionar; estaba tapado porque el alta de clientes fallaba antes.
- Cerrar sesión en `/cuenta` lleva a la portada. `signOut()` dejaba la sesión a
  null con la página aún montada, el guardia disparaba
  `<Navigate to="/login?redirect=%2Fcuenta">` y ganaba la carrera, así que
  quien salía aterrizaba en un formulario pidiéndole volver a entrar. Lo
  destapó la prueba de cierre de sesión PWA, que hasta ahora nunca llegaba a
  ejecutarse porque el paso de RLS fallaba antes en el mismo trabajo.
- Comprobado en CI (run 31053972151, todo en verde): Prettier, ESLint,
  TypeScript, 159 unitarias, build, **27/27 pruebas RLS contra GoTrue,
  PostgREST y Storage reales** más el cierre de sesión PWA, 296 E2E aprobadas
  y 1 omitida esperada en Chromium, Firefox, WebKit, móvil y Safari móvil, y 6
  del panel aislado.
- `npm audit`: se mantiene React Router 7.18.2 y no se toca ninguna dependencia
  en esta PR. Los dos avisos `high` son el mismo, contado en `react-router` y
  en `react-router-dom`, y alcanzan sólo a las APIs RSC inestables, que esta
  SPA declarativa no usa. Bajar a 7.11.0 no limpia el árbol: cambia el aviso
  por una redirección abierta. Ver [[02-decisiones#D-058]].

### Corrección del 2026-08-06 — la 8.3.0 sí estaba publicada

- Lo registrado el 2026-08-04 y el 2026-08-05 decía que la versión corregida
  `8.3.0` «todavía no está publicada». **Era falso.** `react-router@8.3.0`
  salió el 2026-07-22 y corrige `GHSA-qwww-vcr4-c8h2`. El error vino de
  consultar `react-router-dom`, que se queda en 7.18.2 porque React Router 8
  retira ese paquete: el que sigue publicándose es `react-router`.
- Lo que no cambia: el aviso sólo afecta a las APIs RSC inestables y esta SPA
  declarativa con `BrowserRouter` no tiene servidor de React Router, acciones
  RSC ni React Server Components. El camino vulnerable no es aplicable.
- Lo que sí cambia: el motivo de no actualizar. No es que falte el arreglo, es
  que React Router 8 exige Node ≥ 22.22.0, React/React DOM ≥ 19.2.7 y retirar
  `react-router-dom`, y el proyecto usa React 18, Vite 6 y `react-router-dom`.
  Queda como tarea propia en [[03-roadmap#Migración a React Router 8]].
- Alcance: sólo documentación. No se modificó `package.json`, `package-lock.json`
  ni ningún fichero de `src/`.

## 2026-08-04 — React Router 7, secretos y compilación nativa

- Migrado React Router DOM de 6.30.4 a 7.18.2. La navegación declarativa,
  `basename` y cinco flujos críticos pasan en Chromium, Firefox, WebKit y
  Safari móvil (20/20).
- El retorno posterior al login rechaza barras invertidas de forma explícita;
  siete pruebas cubren destinos válidos, externos y ambiguos.
- La auditoría actual y del historial no encuentra secretos versionados. Se
  amplían los ignores para almacenes de firma, perfiles y configuración
  privada de Google/Android/iOS.
- `npm audit` deja de reportar los dos avisos moderados de Router 6. Conserva
  un aviso upstream `high` de las APIs RSC inestables, no utilizadas por esta
  SPA. (Corregido el 2026-08-06: aquí se afirmaba que la 8.3.0 no estaba
  publicada; sí lo estaba, desde el 2026-07-22. Ver la corrección fechada más
  arriba.)
- Capacitor sincroniza los proyectos actuales e iOS compila para simulador
  con Xcode 26.6. Android queda sin recompilar en esta máquina por ausencia de
  Java Runtime; no se sustituye por una afirmación sin comprobar.
- README alinea scripts, Router 7 y el catálogo consolidado actual de 18
  accesorios demostrativos.
- La primera ejecución de CI sobre PostgreSQL 17 detectó que el borrado de
  políticas heredadas asumía que `mensajes` ya existía. La migración base
  comprueba ahora la relación antes de retirar esas políticas, por lo que
  conserva la actualización de una base existente y admite una base vacía.

## 2026-08-04 — Matriz multi-navegador y PWA offline real

- Playwright suma Firefox, WebKit de escritorio y Safari móvil. Cinco flujos
  críticos cubren inicio/idioma/ruta profunda, carrito/checkout, comparador,
  chat y login: 20/20 aprobados en los cuatro proyectos locales.
- `test:pwa` compila y sirve el build sin Supabase remoto. Nueve casos validan
  manifest, iconos, control, precache, ruta profunda offline y que ni Supabase
  ni rutas privadas entren en Cache Storage.
- La prueba offline descubrió que JS/CSS no encontraban el precache desde una
  ruta profunda; el service worker busca ahora por pathname en su caché
  versionada.
- La integración local añade una cuenta ficticia y un cierre de sesión real
  antes de cortar red. Está descubierta, pero su ejecución local sigue
  bloqueada por la ausencia de Docker; CI la ejecutará junto a las 27 RLS.

## 2026-08-04 — Contrato reproducible de calidad

- Prettier 3.9.6 establece formato para código, pruebas y configuración; deja
  fuera de forma explícita generados, documentación, catálogos y diccionarios
  grandes para evitar un diff ajeno al hardening.
- ESLint 10 suma reglas compatibles de imports y promesas. Los plugins React y
  JSX a11y no se fuerzan porque sus versiones actuales solo declaran soporte
  hasta ESLint 9; axe conserva la cobertura accesible ejecutable.
- Añadidos `format`, `format:check`, `lint:fix`, `test`, `test:watch`, `check`
  rápido y `check:full`; CI ejecuta Prettier antes de tipos y lint.
- Cinco pruebas puras nuevas cubren moneda, cuotas y detección de idioma. La
  pasada `npm run check` aprueba formato, 0 errores ESLint, tipos, 129/129
  Vitest y build sin credenciales. La regresión completa aprueba 273 E2E
  generales, omite el único caso exclusivo de desarrollo al correr contra el
  build y aprueba 6/6 del panel aislado.

## 2026-08-04 — Landmarks únicos y aislamiento modal común

- `/soporte` elimina el `<main>` anidado; 19 rutas públicas quedan protegidas
  por una regresión explícita de landmarks.
- El modal genérico, el menú móvil, la guía y el chat aíslan todo el fondo
  hasta `#root`, sin retirar atributos `inert` que no les pertenecen, y
  restauran el foco al control de apertura.
- El selector ya no reduce el contraste del texto durante su animación y el
  chat tiene nombre y controles accesibles en los cinco idiomas.
- Verificación: 19/19 pruebas de accesibilidad sobre build en Chromium, axe
  sin excepciones, TypeScript, build y 124/124 Vitest correctos.

## 2026-08-04 — Supabase local reproducible en CI

- Fijada la CLI 2.111.0 y añadidos `config.toml`, seed sin credenciales y
  scripts de start/reset/status/stop.
- El escenario se crea por GoTrue/PostgREST/Storage en cada ejecución, en vez
  de insertar usuarios Auth a mano.
- Nuevo workflow reutilizable de integración local; `ci.yml` lo necesita antes
  de Pages y deja de depender de secretos `RLS_TEST_*`.
- Verificación local: JSON/YAML correctos y preflight de integración correcto;
  la ejecución se detiene con diagnóstico porque Docker no está instalado.

## 2026-08-04 — Estados interactivos i18n y lenguaje del panel

- Soporte y selector de modelos dejan de mezclar español; el filtro y los
  nombres accesibles usan el nombre de catálogo traducido y los precios el
  locale activo.
- El panel interno se mantiene en castellano y fuerza `lang="es"` en sus dos
  rutas, restaurando el idioma de tienda al salir.
- Verificación: 11/11 casos de `idiomas.spec.ts` sobre build en Chromium,
  TypeScript y 124/124 Vitest correctos; ESLint sin errores.
- La afirmación documental de traducción completa se retira hasta cerrar el
  resto del barrido registrado en I18N-001.

## 2026-08-04 — Minimización del chat y límites de Storage

- Nueva migración incremental que deja de recopilar `user_agent`, limpia ese
  único dato histórico y mantiene la firma RPC por compatibilidad.
- El bucket educativo queda privado, limitado a 5 MB y a PDF/JPEG/PNG; la
  escritura se restringe al nombre canónico de la carpeta propia.
- Las URLs firmadas para agentes caducan en 60 segundos.
- `test:rls` ya no intenta levantar Vite: 27 casos se descubren correctamente
  y se omiten con motivo explícito cuando faltan credenciales.
- Verificación del bloque: 124/124 Vitest, incluidas 102 pruebas de esquema;
  TypeScript, ESLint sin errores y build demostrativo correctos. La integración
  GoTrue/PostgREST/Storage no se declara aprobada.

## 2026-08-04 — Estado educativo nulo e informe RLS estrictamente JSON

- `revisar_descuento_educativo()` comprueba `p_estado is null` antes del
  `UPDATE`. Dos regresiones PGlite rechazan `NULL` y `aprobada` y comparan las
  cuatro columnas de revisión antes y después para demostrar que no hay efectos
  secundarios. El caso real de Supabase se fortalece sin elevar la suite de 27.
- El workflow sustituye `npm run test:rls -- --reporter=json` por la invocación
  directa de Playwright, captura su código real y valida que `rls.json` exista,
  no esté vacío y sea JSON puro antes del recuento estricto.
- El verificador suma regresiones para JSON válido, vacío, truncado, inexistente
  y precedido por el encabezado de npm. La simulación de seis escenarios solo
  acepta 27 aprobadas con código Playwright 0.
- Verificación: 122/122 Vitest (100 de esquema), 264 E2E generales sobre build,
  6/6 E2E del panel, TypeScript y build correctos; ESLint conserva 0 errores y
  23 avisos anteriores. Las 27 RLS se descubren pero siguen omitidas por falta
  del Supabase dedicado. `npm audit` mantiene las 2 vulnerabilidades moderadas
  ya documentadas en SEG-001.

## 2026-08-04 — Cierre de los hallazgos pendientes de la PR #34

- Retirada completa la falsa eliminación de conversaciones: el archivo solo
  cierra y reabre, y conserva el historial. La UI diferencia agente normal y
  supervisor, usa «Liberar asignación» para asignaciones ajenas y muestra los
  errores del servidor como alertas accesibles sin dejar botones bloqueados.
- `revisar_descuento_educativo()` devuelve `P0002` si el cliente no existe;
  PGlite comprueba éxito, inexistencia, ausencia de efectos laterales y rechazo
  de cuentas no agente.
- La clasificación de funciones y la auditoría compartida usan firmas exactas,
  roles `EXECUTE` exactos y un `LEFT JOIN` que conserva `PUBLIC`. La misma
  auditoría pasa en instalación limpia, actualización desde PR #33 y segunda
  aplicación idempotente sin perder datos ni cambiar el catálogo.
- El verificador RLS exige exactamente 27 descubiertas y aprobadas, ninguna
  omitida, fallida o inestable, y código de Playwright cero. Siete pruebas
  unitarias cubren 27/26/28, omitida, inestable, vacío y salida no cero.
- La suite RLS mantiene 27 casos, usa marcas únicas por ejecución y refuerza
  revisión educativa, gestión agente/supervisor y estados de reserva. Se
  descubrió localmente, pero las 27 siguen omitidas por falta del Supabase
  dedicado; no se presentan como aprobadas.
- Verificación desde `npm ci`: 114 Vitest aprobadas (98 de esquema), 264 E2E
  generales aprobadas con 1 omisión propia del modo desarrollo, y 6 E2E del
  panel aprobadas. ESLint: 0 errores y 23 avisos conocidos. `npm audit` mantiene
  las 2 vulnerabilidades moderadas ya registradas en SEG-001.

## 2026-08-04 — La suite RLS se alinea con el esquema final

- Detectado que los 21 casos contra Supabase real seguían usando operaciones
  legítimas de la API anterior: INSERT directo de mensajes y reservas, y
  registro de justificantes sin subir antes el objeto. Con el esquema final
  habrían fallado por probar un flujo obsoleto.
- Las operaciones legítimas pasan a los RPC finales. La suite crece a 27 casos
  e incorpora login real de agentes, firma de respuestas, prohibición de
  autoascenso, cierre/valoración, cola, aislamiento y upsert de Storage.
- La limpieza borra los visitantes antes que los usuarios de Auth. Como
  `visitantes.auth_id` usa `ON DELETE SET NULL`, el orden anterior dejaba chats
  huérfanos en el proyecto de pruebas.
- Se corrigen las instrucciones que aún mandaban ejecutar `schema.sql` y la
  carpeta antigua `supabase/migraciones/`; la fuente única es
  `supabase/migrations/20260802000100_estado_seguro.sql`.
- Documentación viva actualizada con la arquitectura, CI, aplicaciones y el
  bloqueo real: no hay proyecto Supabase dedicado ni secretos RLS.
- Verificación local final: TypeScript limpio; ESLint con 0 errores y 23
  avisos conocidos; 94 pruebas de esquema + 9 unitarias; build correcto; 264
  E2E aprobadas y una omitida deliberadamente. Los 27 casos RLS se descubren,
  pero siguen omitidos explícitamente por falta de infraestructura; por eso no
  se integran ni despliegan todavía las PR de seguridad.

## 2026-08-02 — Cierre de seguridad de Supabase y CI encadenado

- Sesión anónima verificable para el visitante; se retira la lectura abierta
  de chats y la autorización basada en UUID de `localStorage`.
- Conversaciones, mensajes, agentes, clientes, descuentos y reservas escriben
  mediante RPC acotados. Autor, propietario, fechas y transiciones sensibles
  los fija el servidor.
- Una sola migración ejecutable, probada desde cero y sobre el estado anterior
  mediante PostgreSQL/PGlite.
- CI unificado: calidad → build → E2E → RLS → Pages. Un push a `main`
  sin el Supabase de pruebas debe fallar antes del despliegue.

## 2026-08-01 — La web habla cinco idiomas

Primera entrega de idiomas: **castellano, inglés, alemán, francés e
italiano**. Canarias vende a mucho visitante extranjero y ese visitante
entra por la web, así que el selector va en la web y **la app se queda en
castellano** (D-047).

- **Maquinaria con claves tipadas**: el castellano es la fuente de verdad y
  además el tipo, así que si a un idioma le falta una clave **el build
  falla**. No hay que acordarse de revisarlo.
- **Selector con banderas** a la derecha del todo de la barra amarilla.
  Dibujadas en SVG y no con emoji: Windows no trae la fuente de banderas y
  allí un emoji de bandera se ve como las letras del país.
- **Detección del navegador** la primera vez, recordada después. Un idioma
  que no ofrecemos cae al castellano.
- **Aviso de traducción demostrativa** fuera del castellano, con enlace para
  volver (D-048). Importa porque se traducen también condiciones de
  garantía, financiación y seguro.
- **Los precios cambian de formato, no de divisa**: "1.229 €" en castellano,
  "€1,229" en inglés. El euro sigue siendo el euro.
- Traducidos por ahora: barra superior, cabecera, pie, menú, vocabulario
  común, **la portada entera**, la disponibilidad en todo el catálogo, y de
  la ficha de producto: favoritos, entrega, financiación, seguro, las
  pestañas, el selector de color y los botones de carrito y reserva. También
  el carrito.

  La **ficha de producto completa** y el **checkout entero** —pasos,
  entrega, pago, resumen, confirmación y sus formularios—, comprobados con
  capturas en alemán y francés.

  Los **39 nombres de color** del catálogo y la página de **tiendas**.

  El **contenido de servicios, Plan Renove y centro de soporte**
  (`src/data/content.ts` entero).

  Las **afirmaciones comerciales** (`commercialClaims.ts`), las páginas de
  **acceso y registro**, y los titulares de **soporte** y **servicio
  técnico**.

  **Método**: a partir de cierto punto, buscar cadenas en el código dejó de
  encontrarlas —muchas están partidas en varias líneas o interpoladas—. Se
  pasó a un barrido que carga las rutas en inglés y extrae el texto que
  sigue en castellano. Mide lo que se ve, no lo que hay escrito.

  Los **reclamos, características y especificaciones de los 29 modelos**
  del catálogo, con una prueba que comprueba la cobertura
  (`tests/e2e/catalogo-i18n.spec.ts`): recorre el catálogo real y falla si
  algún texto no tiene sus cuatro traducciones, o si sobra alguna que ya no
  usa nadie. Los nombres propios —«USB-C», «IP68», «Face ID», «Apple M5»—
  están en una lista de excepciones explícita.

  Y con esto la web queda traducida entera. Un barrido que carga cada ruta
  en inglés y extrae el texto visible pasó de 244 restos a 7, y esos 7 son
  las direcciones de las tiendas y sus nombres —«Calle Triana, 105», «Banana
  La Laguna»—, que no se traducen porque son datos reales.

  Lo que ha entrado en esta tanda: los 18 accesorios completos (incluidas
  sus notas de compatibilidad), la portada, el carrusel, el asistente
  «Encuentra tu Apple» entero, servicio técnico, Plan Renove, servicios,
  soporte, comparador, favoritos, tiendas, buscador, perfil y el 404.

  Tres pruebas nuevas vigilan que no se descuelgue nada
  (`tests/e2e/catalogo-i18n.spec.ts`) (asistente, banner del Plan Renove,
  ventajas, preguntas frecuentes, reseñas y newsletter). Servicios, Plan
  Renove, soporte, servicio técnico, tiendas y el checkout siguen pendientes.
- Suite en 255, con nueve pruebas nuevas de idioma. Hubo que fijar `locale: 'es-ES'` en la configuración de
  Playwright: con la detección activa, la suite entera pasó a ejecutarse
  contra la versión inglesa.

## 2026-08-01 — Las barras de la app dejan de moverse al desplazar

- **Arreglado de raíz**: en la app, el documento ya no se desplaza. La
  pantalla es una columna —barra de búsqueda, contenido, barra de
  navegación— y solo se desplaza el contenido. Ninguna barra usa
  `position: fixed`.
- La causa era de WKWebView: en iOS los elementos fijos se recolocan **al
  terminar** el gesto, no durante, y por eso las barras parecían
  despegarse, el contenido asomaba por encima del buscador y el menú de
  "Explorar" se movía con la página. Pasar de `sticky` a `fixed` no lo
  arregló; se reprodujo en el WebKit de escritorio de Playwright, donde
  **sí funciona**, lo que descartó el CSS y señaló al WebView (D-046).
- La web no cambia: el interruptor es un atributo que solo se pone dentro
  del binario.
- **Y el hueco de la barra de estado deja de reservarse dos veces.** Con el
  documento quieto, el `contentInset` de iOS pasó a desplazar el contenido
  de forma permanente, y el CSS volvía a desplazarlo: quedaba una franja
  blanca del fondo nativo y otra amarilla de más sobre el buscador. Ahora
  el WebView va a sangre y el hueco lo reserva solo el CSS.
- **Solo el buscador queda fijo.** Los filtros por familia pasan a ser el
  primer elemento del contenido, así que se esconden bajo él al bajar y el
  amarillo se encoge. Verificado arrastrando en el emulador.
- **Sin rebote en el contenido** (`overscroll-behavior: none`): con rebote,
  al tirar hacia abajo estando arriba del todo el contenido se separaba de
  la barra de búsqueda y asomaba una franja del fondo entre el amarillo de
  la barra y el de los filtros.
- **Las capas a pantalla completa respetan la zona segura**: con el
  WebView a sangre, el menú de "Explorar" y el buscador quedaban bajo el
  reloj y la batería. Nueva clase `.app-safe-area`, activa solo en la app.
- Suite en 245, verificado arrastrando en el emulador de Android y con
  capturas del simulador de iPhone.

## 2026-08-01 — Icono oficial, y correcciones sobre el dispositivo

- **El icono de la app pasa a ser el oficial de Banana** (plátano abierto
  en blanco sobre degradado naranja), tomado de su web en vez del trazo
  simplificado que usaba el prototipo. Solo lo publican en mapa de bits y
  el mayor mide 180x180: exacto para la pantalla de inicio de un iPhone,
  justo para Android, y **blando en el de 1024 que pide App Store**. Hay
  que pedirles el original antes de publicar (D-045).
- **La barra superior deja de "buguearse" al desplazar.** Era una barra
  `sticky` dentro de un documento con `overflow-x: clip`: en WebKit esa
  combinación repinta mal y dejaba una línea blanca parpadeante encima.
  Ahora va `fixed` y publica su altura real —medida, porque depende del
  `safe-area` de cada móvil— para que el contenido empiece justo debajo.
- **Menos duplicados en el menú de la app**: fuera "Tiendas y horarios" de
  "Contacta con nosotros" (ya está en Servicios y ayuda) y fuera
  "Favoritos" del pie, que ahora es una pestaña fija. El pie queda con
  cuenta e idioma. En la web no cambia nada: allí ese menú sigue siendo la
  vía para llegar a favoritos desde el móvil.
- Suite en 246.

## 2026-08-01 — Encuadre en móvil, buscador arriba y barra inferior definitiva

- **Arreglado el desplazamiento lateral** que Oscar veía "a ratos" en la web
  móvil y en la app. No era un desbordamiento: iOS **amplía la página** al
  enfocar un campo con texto de menos de 16px, y ampliada se puede arrastrar
  de lado. El buscador estaba a 15px y el del chat a 14px. Ahora hay un suelo
  de 16px para todos los campos en pantallas táctiles, más
  `overscroll-behavior-x: none` para el rebote del WebView. No se usa
  `user-scalable=no`: eso le quitaría el zoom a quien lo necesita.
- **La cabecera desaparece dentro de la app** y la sustituye un buscador a
  todo lo ancho con filtros rápidos por familia debajo (`AppTopBar`). El
  buscador abre el mismo motor a pantalla completa que ya usaba la web.
- **Barra inferior definitiva**: Inicio · Favoritos · Explorar · Carrito ·
  Cuenta. "Explorar" hereda el menú de categorías que antes abría la
  hamburguesa de la cabecera.
- **Pantalla de carga con el logotipo real** de Banana: el plátano encima y
  el rótulo debajo, tomado del mismo SVG que usa la web. El icono se queda
  solo con el plátano, porque a 48px el rótulo no se lee.
- **Pruebas nuevas** en `tests/e2e/mobile-layout.spec.ts`: ninguna ruta
  desborda a 320 ni a 390px, ni en web ni en app, ni empujando los
  carruseles hasta el final; y ningún campo visible baja de 16px. Suite en
  244.

## 2026-08-01 — La app tiene interfaz de app, y compila en iOS y Android

- **Interfaz propia dentro del binario**: barra de navegación inferior con
  Inicio, Buscar, Favoritos, Carrito y Cuenta —con contadores— y sin pie de
  página. El carrito deja de estar duplicado en la cabecera. La web no
  cambia: todo va condicionado a `window.Capacitor`, que Capacitor inyecta
  antes de cargar el bundle, así que sigue habiendo un solo código.
- **El chat sale de la burbuja flotante y entra en "Contacta con
  nosotros"**, dentro del menú, junto al centro de ayuda y las tiendas.
- **iOS compilado y ejecutado por primera vez** (Xcode 26.6, SDK 26.5) en un
  simulador de iPhone 17 Pro. Hizo falta versionar el esquema compartido de
  Xcode, que se genera en `xcuserdata/` y queda fuera de git.
- **Tres fallos que solo aparecieron ejecutando los binarios**, no en el
  navegador ni en las pruebas:
  - la cabecera quedaba bajo la Dynamic Island (`env(safe-area-inset-top)`);
  - el aviso de tienda favorita tapaba la barra de navegación inferior;
  - ese mismo aviso se colaba encima del chat al pasar del menú al chat,
    porque la comprobación de A11Y-003 se hacía una sola vez y no de forma
    continua. Ahora se vigila con un `MutationObserver`.
- Suite en 230, con `tests/e2e/app-shell.spec.ts` (10 casos nuevos).

## 2026-08-01 — La app de Android compila y arranca; arreglada la trampa de foco

- **APK de Android generado y verificado** (`APP-001` cerrado para
  Android): `app-debug.apk`, 12 MB, `com.bananacomputer.tienda`,
  `targetSdk` 36. Instalado en un emulador Pixel arm64 con Android 36:
  arranca, la tienda renderiza dentro del WebView y la navegación
  profunda funciona, que era el riesgo real de meter un `BrowserRouter`
  en un WebView. Sin errores en `logcat`. Se hizo sin Android Studio,
  solo con JDK 21 y las herramientas de línea de comandos; la receta
  exacta está en [[06-app-nativa]]. **iOS sigue sin compilar**: necesita
  Xcode completo.
- **`A11Y-003` y `QA-003` cerrados, y el diagnóstico corregido.** El fallo
  intermitente de CI no era la trampa de foco de la guía, como se pensó
  primero: era el **aviso de tienda favorita**, que aparecía 800 ms
  después de cargar y tomaba el foco aunque hubiera un diálogo modal
  abierto. En el runner de Linux ese temporizador caía dentro del
  recorrido de tabulación del test. Se vio en cuanto el test empezó a
  informar de **qué elemento** recibía el foco en vez de un
  `true`/`false`.
  - El aviso ya no se muestra mientras haya un diálogo modal abierto; no
    se descarta, se reintenta y aparece al cerrarlo.
  - La trampa de foco de la guía se reescribió igualmente para gobernar el
    recorrido completo sobre una lista filtrada a los controles realmente
    alcanzables: no era la causa, pero era frágil.
  - Regresión cubierta en `favorite-store.spec.ts`. Suite en 220.

## 2026-07-31 — Aplicaciones: panel como PWA y tienda como app nativa

- **Panel de agentes instalable como aplicación**: `manifest-agente.webmanifest`
  con nombre e iconos propios (negro con el plátano amarillo, para
  distinguirlo de la tienda en el Dock). El manifest y las etiquetas de
  iOS **solo existen mientras se está en `/agente`**; las inyecta y las
  retira `AgentAppScope`, que envuelve el panel y su pantalla de acceso,
  para que ninguna página pública ofrezca instalar el panel interno.
- **Service worker generado en el build** (`scripts/generate-sw.mjs`): la
  lista de precache sale del `index.html` ya construido, con los hashes
  reales, y la versión de la caché se deriva del contenido. Navegación a
  red primero, assets con hash a caché primero, imágenes y fuentes
  stale-while-revalidate, y Supabase siempre a la red. Solo se registra
  en producción, nunca en el dev server.
- **Conversaciones sin leer**: contador en la pestaña del panel y sobre el
  icono del Dock (Badging API), negrita y punto en la bandeja, y
  notificación del sistema al llegar un mensaje con la ventana de fondo.
  El permiso se pide con un clic, nunca al cargar. Se calcula en el
  navegador del agente (`src/lib/agentUnread.ts`).
- **Barra de estado de la app** bajo la cabecera del panel: sin conexión,
  versión nueva disponible, invitación a instalar y permiso de avisos.
  Un aviso como mucho a la vez, y ninguno roba el foco.
- **Iconos generados desde el vector** (`npm run icons`) con el Chromium
  de Playwright, en vez de escalar el PNG de 144 px. Incluye variante
  `maskable` con zona segura y las pantallas de carga nativas.
- **App nativa de la tienda con Capacitor**: `capacitor.config.ts`,
  `npm run build:app` (mismo código, `--base=/`), proyectos `ios/` y
  `android/` versionados. **Sin compilar** — ver
  [[04-problemas-pendientes#APP-001 — La app nativa: Android verificada, iOS sin compilar]]
  y la guía [[06-app-nativa]].
- **Corregido**: el `<link rel="preload">` del hero llevaba
  `/pagina-banana/` escrito a mano en `index.html` y habría dado 404
  dentro de la app nativa. Ahora la base la antepone Vite en cada build.
- **Pruebas**: `tests/e2e/pwa.spec.ts`, 7 casos nuevos. Suite completa en
  219, en verde.

## 2026-07-30 — Chat de Bananito en tiempo real + panel /agente (Fase 1)

Commits: `7a73335`, `ad2c8c4`, `66c487f`, `5718b13` en `main`.

- **Mascota Bananito**: burbuja flotante circular en azul del nav
  utilitario (`#0768A9`) con la mascota Bananito encima. Fondo del panel
  de chat con patrón de plátanos sobre crema. Animación de entrada/salida
  con `transform + opacity`.
- **Panel visual del chat** con cabecera amarilla (color del nav),
  historial con burbujas asimétricas (agente/bot a la izquierda, visitante
  a la derecha), indicador de estado "En línea", auto-scroll y trampa de
  foco. Cursor pointer en todos los controles.
- **Backend Supabase** (Fase 1). Esquema versionado en
  `supabase/schema.sql`: `visitantes`, `conversaciones`, `mensajes` con
  trigger para ordenación, RLS activa con políticas abiertas al rol `anon`
  (temporal — ver [[02-decisiones#D-025 — Fase 1 sin autenticación de agentes]])
  y publicación en `supabase_realtime`.
- **Cliente Supabase** en `src/lib/supabase.ts` con fallback: si no hay
  credenciales, el chat cae al modo canned reply original y `/agente`
  muestra un aviso de configuración.
- **Hooks compartidos** en `src/lib/chatSession.ts`:
  `useVisitorChatSession(active)`, `useAgentInbox()`,
  `useAgentConversation(id)`. Todos incluyen suscripción realtime,
  deduplicación por id y manejo de estados de carga/error.
- **`ChatBubble.tsx`** reescrito para consumir la sesión real de
  Supabase manteniendo el modo demo. Se oculta también en `/agente/*`
  (antes solo en `/checkout/*`).
- **Panel `/agente`** (`src/pages/AgentPage.tsx`): layout full-screen con
  bandeja de las 50 conversaciones más recientes a la izquierda y
  ventana de chat activa a la derecha. Auto-selección de la conversación
  más reciente al cargar. Sin `Layout` público.
- **Deploy**: `.github/workflows/deploy.yml` inyecta
  `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` al build desde los
  secretos `SUPABASE_URL` y `SUPABASE_ANON_KEY` del repo.
- **`.gitignore`** extendido con bloque `.env` / `.env.*` (excepción
  `.env.example`). Tipos de `import.meta.env` documentados en
  `src/vite-env.d.ts`.
- **Dependencia nueva**: `@supabase/supabase-js ^2.111.0`.

## 2026-07-30 — Segunda ronda de corrección visual (PR pendiente, sin merge)

Rama `fix/accessory-images-round-2`. **NO fusionar sin revisión visual
manual.**

- **Auditoría visual manual** de las 22 imágenes de
  `public/img/accessories/`: se abrió cada archivo con `Read` para no
  fiarse del nombre. Detectadas **7 imágenes incorrectas** y 3
  productos retirados.
- **Imágenes corregidas** (SKU real verificado): AirTag individual
  (`MX532`), AirTag pack de 4 (`MX542`), puntas Apple Pencil (`MLUN2`),
  MagSafe 2 m (`MGDM4`).
- **Productos retirados** (imagen del CDN público no coincide con el
  producto declarado): Cable Thunderbolt 4 Pro 1,8 m, Magic Keyboard
  (USB-C) básico, Funda MagSafe iPhone Air. Sus rutas ya no aparecen
  en `/accesorios` ni en el buscador; visitar `/accesorios/<slug
  retirado>` redirige a `/accesorios`.
- **Magic Keyboard Touch ID + numérico** amplía a 2 variantes:
  **blanco** (`MXK73Y`, 199 €) y **negro** (`MXK83Y`, 229 €). Antes
  el archivo del basic (que en realidad era Touch ID + numérico
  blanco) se reasigna a esta variante.
- **`AccessoryCard` rediseñado** para compartir la jerarquía visual
  con `ProductCard`: mismo `min-h-[400px]`, `rounded-[12px] border
  border-line bg-surface p-4`, `hover:-translate-y-1.5
  hover:border-banana hover:shadow-[var(--shadow-raised)]`. Usa el
  helper `ProductImage` (bg neutral, `object-contain`, hover scale).
  Sin favoritos, carrito, comparador ni seguro.
- **`/buscar` usa la misma `AccessoryCard`** en la sección
  "Accesorios Apple". Se retira `AccessorySearchCard`. El
  autocompletado del Header conserva su miniatura compacta.
- **`ExactMatchCard`** también usa `AccessoryCard` cuando el match
  exacto es un accesorio Apple real.
- **Tests reforzados** (5 nuevos en `accessories.spec.ts`, total
  **194/194**): no aparecen productos retirados en `/accesorios`;
  las rutas retiradas redirigen a `/accesorios` (no ficha huérfana);
  Magic Keyboard Touch ID + numérico tiene 2 variantes con `src`
  distinto; `/buscar?q=iPhone` muestra la sección Accesorios Apple
  con la tarjeta completa `min-h-[400px]` (mismo diseño que
  `ProductCard`); guardia de altura mínima en ambas páginas.
- **Capturas** en `docs/capturas/`: `accesorios-desktop-1440.png`
  (1440 px, 19 productos), `accesorios-mobile-375.png` (móvil, sin
  scroll horizontal), `buscar-iphone-desktop.png` (accesorios con
  fotografía y misma jerarquía que dispositivos).
- **Documentación**: `docs/auditoria-visual-accesorios-round-2.md`
  con la tabla de hallazgos por archivo. `PR #28` pasa de "PR
  pendiente" a fusionada en la entrada anterior del registro.
- Sin cambios en carrito, checkout, seguro, favoritos, comparador,
  Plan Renove, Servicio Técnico, tienda favorita, alertas, inventario,
  ranking del buscador, sinónimos, fuzzy, comportamiento de Enter,
  dispositivos, precios de dispositivos, imágenes de dispositivos ni
  workflows.

## 2026-07-30 — Corrección visual del catálogo de accesorios (PR #28)

Rama `fix/accessory-images-and-search-cards`. Commit funcional
`db85349`. Merge `001d0b1`.

Rama `fix/accessory-images-and-search-cards`. **Requiere revisión
visual manual antes del merge.**

- **8 SVG bespoke retirados** y sustituidos por fotografía oficial:
  adaptador USB-C 30 W (`MY1W2_GEO_EMEA`), cable USB-C 240 W 2 m
  (`MU2G3`), cable Thunderbolt 4 Pro 1,8 m (`MWP73`), funda MagSafe
  iPhone Air (`MGH34`), Magic Keyboard iPad Pro 11" M4 (`MWR03`),
  correa deportiva Watch 46 mm (`MHYH4ref`), AirTag individual
  (`MX542`) y AirTag pack de 4 (`MX4M2`). Todas descargadas desde
  `store.storeimages.cdn-apple.com` a `public/img/accessories/`.
- **Magic Mouse y Magic Trackpad con variantes distintas**. Antes:
  el catálogo mostraba la misma foto para blanco y negro y además la
  variante "blanca" del Trackpad usaba en realidad la foto del
  Magic Mouse blanco. Ahora se sirven 4 archivos distintos
  (`magic-mouse-white/black.jpg`, `magic-trackpad-white/black.jpg`)
  correspondientes a los SKU `MXK53`, `MXK63`, `MXK93` y `MXKA3`.
- **Nuevo tipo `AccessoryImagePresentation`** con `fit`, `scale`,
  `position`, `padding` y `background` tipados. Se aplica a los
  adaptadores 20 W y 30 W (scale 1.1, padding compact) para que no
  se vean diminutos.
- **Nuevo componente `AccessoryImage`** que centraliza padding,
  fondo, `object-fit`, escala y posición. Se usa desde
  `AccessoryCard`, `AccessoryDetailPage` y la sección "Accesorios
  compatibles" de `ModelPage`. Se retiran `object-contain p-6/p-8/p-4`
  dispersos y `imageBg: '#f5f5f7'` redundante.
- **Tarjeta visual en /buscar**: nuevo componente
  `AccessorySearchCard` con fotografía + nombre + marca + categoría +
  compatibilidad + precio demostrativo. `SearchPage` pinta accesorios
  reales con `AccessoryVisualGrid` y mantiene `CompactSearchCard` como
  fallback para los ítems demostrativos de terceros.
  `ExactMatchCard` también renderiza `AccessorySearchCard` cuando el
  match exacto es un accesorio Apple real.
- **Miniatura en Header**: `SuggestionRow` muestra un thumbnail de
  44×44 px con la imagen del accesorio real. Los ítems demostrativos
  siguen con el icono de lupa. Ranking, Enter directo, ArrowUp/Down,
  Escape y aria-activedescendant intactos.
- **Tests reforzados**: 10 nuevos escenarios en `accessories.spec.ts`
  (sin SVG en `<img>`, todas las imágenes cargan y pertenecen a
  `/img/accessories/`, variantes de Mouse y Trackpad tienen `src`
  distinto, tarjetas visuales en `/buscar?q=iPhone`, `/buscar?q=cargador`
  sin badge demostrativo, Apple Pencil Pro vs USB-C con `src`
  distinto, miniatura en Header, Enter directo intacto, tamaño
  mínimo de imagen 140×140, guardia "0 SVG" en el catálogo). Total:
  **189/189** (179 → 189).
- **Documentación**: nueva `docs/auditoria-visual-accesorios.md`,
  `docs/fuentes-imagenes-accesorios.md` totalmente reescrita,
  `docs/catalogo-accesorios-apple.md` con banner de actualización,
  nueva nota de sesión
  `docs/sesiones/2026-07-30--correccion-visual-accesorios.md`.
  PR #27 pasa de "PR pendiente" a "PR #27" en la entrada anterior
  del registro.
- Sin cambios en ranking del buscador, sinónimos, fuzzy, intención,
  comportamiento de Enter, carrito, checkout, seguro, comparador,
  recomendador, Plan Renove, Servicio Técnico, tienda favorita,
  favoritos+avisos, inventario, dispositivos, precios de dispositivos,
  imágenes de dispositivos, workflows ni Node.

## 2026-07-30 — Catálogo inicial de accesorios Apple (PR #27)

Rama `feat/apple-accessories-catalog`. Commit funcional `5c5b4a2`.
Merge `cf40bd6`.

Rama `feat/apple-accessories-catalog`.

- **Nuevo tipo `Accessory`** en `src/data/accessories.ts` con
  compatibilidad estructurada (`families`, `models`, `notes`),
  variantes, especificaciones y precios de referencia. NO reutiliza
  el tipo `Model` de dispositivos.
- **20 fichas de accesorios oficiales Apple**: adaptadores USB-C
  (20 W, 30 W), MagSafe, cables (USB-C 240 W 2 m, Thunderbolt 4 Pro),
  fundas iPhone (17, 17 Pro trenzado técnico, Air), Correa Crossbody,
  Apple Pencil Pro y USB-C, puntas Pencil, Magic Keyboard iPad Pro
  11" (M4), Magic Keyboard (USB-C), Magic Keyboard Touch ID +
  numérico, Magic Mouse, Magic Trackpad, cable Watch USB-C 1 m,
  correa deportiva 46 mm, AirTag y AirTag pack de 4.
- **Página `/accesorios`** (nueva `AccessoriesPage`) con filtros por
  categoría y compatibilidad, radiogroups accesibles, botón "Limpiar
  filtros" y CTA a tiendas/soporte.
- **Ficha `/accesorios/:slug`** (nueva `AccessoryDetailPage`) con
  breadcrumb, galería con variantes accesibles, especificaciones,
  compatibilidad estructurada, aviso demostrativo, CTA
  "Consultar disponibilidad en tiendas" y sección de accesorios
  relacionados.
- **Tarjeta `AccessoryCard`** (nueva) coherente con `ProductCard`
  pero sin botón Comprar, sin stock, sin financiación ni seguro.
- **Sección "Accesorios compatibles"** en `ModelPage` (hasta 4
  accesorios por dispositivo, primero compatibilidad exacta, después
  familia).
- **Rutas** `/accesorios` y `/accesorios/:slug` registradas antes de
  la ruta dinámica `/:family` para evitar colisión con FamilyPage.
- **Integración con el buscador**: se retiran del
  `SEARCH_DEMO_ITEMS` las 5 entradas Apple sustituidas
  (`demo:apple-usb-c-cable`, `demo:apple-usb-c-adapter`,
  `demo:apple-airpods-tips`, `demo:apple-magsafe`,
  `demo:apple-watch-band`). El índice ahora genera automáticamente
  entradas `kind: 'apple-accessory'` desde `appleAccessories` con
  `source: 'catalog'` y `demo: false`. `demo:apple-airpods-tips`
  desaparece por completo (Banana no lo publica). Las terceras marcas
  (Beats, Sony, Bose, fundas y kits genéricos) siguen etiquetadas
  como "Contenido demostrativo".
- **Navegación**: Home, mega menú y accesos rápidos del Header
  ahora dirigen a `/accesorios` en lugar de `/iphone` o `/buscar`. La
  columna "Accesorios" del mega menú tiene enlaces reales, no
  fallback.
- **Imágenes**: 14 fotografías oficiales JPEG 1200×1200 descargadas
  desde `store.storeimages.cdn-apple.com` y 8 ilustraciones SVG
  bespoke del prototipo etiquetadas visualmente para los productos
  sin asset accesible desde el CDN público. Todas en
  `public/img/accessories/`. Ver
  `docs/fuentes-imagenes-accesorios.md`.
- **Documentación**:
  `docs/catalogo-accesorios-apple.md` (investigación previa,
  fuentes, decisiones, precios observados vs mostrados),
  `docs/fuentes-imagenes-accesorios.md` (origen y formato de cada
  imagen) y `docs/sesiones/2026-07-30--catalogo-accesorios-apple.md`
  (sesión).
- **Tests**: `tests/e2e/accessories.spec.ts` con 22 escenarios
  (catálogo, filtros, 5 fichas, imágenes, variantes, compatibilidad
  exacta iPhone/iPad, buscador AirPods/cargador/funda/Pencil/Watch,
  navegación Home + Header, axe /accesorios y ficha, sin scroll
  horizontal 375 px). El test histórico de home
  ("enlaces de accesorios") se adapta al nuevo destino `/accesorios`.
  Total: **179/179** (156 → 179).
- Sin cambios en `src/lib/store.tsx`, `INSURANCE_PRICE`,
  `insurancePrice`, `cartInsuranceTotal`, `setLineInsurance`, Plan
  Renove, Servicio Técnico, tienda favorita, favoritos+avisos,
  inventario demostrativo, comparador, recomendador, catálogo de
  dispositivos, precios de dispositivos, imágenes de dispositivos ni
  workflows.

## 2026-07-30 — Enter abre la página completa de resultados (PR #26)

Rama `fix/search-enter-results-page`. Commit funcional `dbf4b7f`.
Merge `a6e11dd`.

Rama `fix/search-enter-results-page`.

- **Bug corregido**: al escribir en el buscador del Header y pulsar
  Enter directamente, el autocompletado abría el primer resultado
  sugerido porque `activeIndex` se inicializaba en 0 (auto-selección).
  El comportamiento contradecía el patrón habitual: Enter sin
  selección explícita debe abrir la página completa de resultados.
- **Nuevo estado inicial**: `activeIndex = -1`. Sin selección visible,
  sin `aria-activedescendant`, sin resaltado de opción.
- **Enter sin selección** (`activeIndex === -1`): navega a
  `/buscar?q=${encodeURIComponent(query.trim())}`. Se aplica igual en
  escritorio y en el overlay móvil.
- **Enter con selección** (`activeIndex >= 0`, tras pulsar ArrowUp/
  ArrowDown): abre el destino de la sugerencia activa, como antes.
- **ArrowDown**: desde `-1` → `0` (primera sugerencia). Después
  avanza sin salir de rango.
- **ArrowUp**: desde `-1` → última sugerencia (wrap). Desde `0` →
  `-1` (vuelta al estado sin selección; Enter vuelve a abrir la
  página completa).
- **Cambiar la consulta** reinicia `activeIndex` a `-1` mediante un
  `useEffect` que observa `q`, elimina `aria-activedescendant` y la
  clase visual activa.
- **Cerrado**: `closeAndRestore()` limpia `activeIndex = -1` antes de
  ejecutar `onClose()` y de restaurar el foco a la lupa.
- **Se retiran `onMouseEnter` y `onFocus` de `SuggestionRow`**: la
  selección activa la controla exclusivamente el teclado (o el clic,
  que abre la opción directamente). Con esto el hover no cambia el
  significado de Enter.
- **Tests nuevos** (12): Enter directo abre `/buscar` en escritorio y
  móvil; Flecha abajo actualiza `aria-activedescendant`; cambiar la
  consulta lo limpia; botón lupa móvil abre `/buscar`; "Ver todos
  los resultados"; Escape con selección cierra y restaura foco sin
  navegar; regresión de orden de secciones para AirPods; intención
  accesorio para "funda AirPods"; corrección para "airpds". El test
  existente "flecha abajo + Enter" se endurece: la nueva assertion
  exige que la URL NO contenga `/buscar` cuando la selección es
  explícita. Total: **156/156** (141 → 156).
- Sin cambios en ranking, sinónimos, fuzzy, taxonomía, contenido
  demostrativo, catálogo, precios, imágenes, stock, `ProductCard`,
  comparador, recomendador, carrito, checkout, seguro, Plan Renove,
  Servicio Técnico, tienda favorita, favoritos, alertas, inventario,
  workflows ni Node. Sin dependencias nuevas.

## 2026-07-30 — Buscador inteligente por secciones (PR #25)

Rama `feat/grouped-semantic-search`. Commit funcional `420f002`.
Merge `21a93c3`.

Rama `feat/grouped-semantic-search`.

- **Nuevo motor determinista** `src/lib/catalogSearch.ts`. Puro,
  reutilizable, sin dependencias externas, sin backend, sin IA. Exporta
  `normalizeSearchText`, `tokenizeSearchQuery`, `inferSearchIntent`,
  `buildSearchIndex`, `scoreSearchItem`, `searchCatalog`,
  `limitSearchResults` y `suggestCorrection`.
- **Nuevo índice** `src/data/searchIndex.ts`. Estructura tipada
  (`SearchItem` con `kind`, `family`, `category`, `aliases`,
  `keywords`, `relatedTo`, `compatibleWith`, `demo`, `source`). Se
  construye automáticamente desde `families`, `allModels`, `services`
  y `supportTopics`; los productos relacionados y accesorios
  compatibles viven en `SEARCH_DEMO_ITEMS`, marcados como
  demostrativos.
- **Sinónimos** compactos: "air pods"→"airpods", "cascos"→"headphones",
  "funda"→"case", "cargador"→"charging"… Sin transformaciones agresivas.
- **Fuzzy matching** propio (Levenshtein sin dependencias). Palabras
  <= 4 sin fuzzy; 5..7 distancia 1; >= 8 distancia 2.
- **Intención** (`device` / `accessory` / `service` / `help` /
  `generic`) determinada por vocabulario. En intención `accessory` las
  secciones se reordenan para mostrar accesorios antes que dispositivos.
- **Puntuación por prioridad** documentada: exacto en nombre > exacto
  en alias > empieza por > todos los tokens > familia/categoría exacta
  > palabras clave > relacionado > compatible > descripción > ayuda.
  Los desempates no son alfabéticos: sección → marca Apple → orden
  estable.
- **/buscar** rediseñado: coincidencia principal + secciones agrupadas
  (Dispositivos Apple, Productos relacionados, Accesorios Apple,
  Accesorios compatibles, Servicios, Ayuda) + sugerencia "Quizá
  querías decir…" + estado vacío con categorías, asistente y soporte.
- **Header** con nuevo autocompletado accesible
  (`src/components/search/HeaderSearch.tsx`) compartido por escritorio
  y móvil. Combobox con `aria-expanded`, `aria-controls`,
  `aria-activedescendant`, `role="listbox"` + `role="option"`.
  Navegación ↓/↑/Enter/Escape; foco devuelto a la lupa al cerrar. Con
  campo vacío se muestran accesos rápidos, no todo el catálogo. Al
  final del panel, "Ver todos los resultados para «…»" enlaza a
  /buscar.
- **Contenido demostrativo** siempre etiquetado con
  `ProvisionalBadge`; sin precio, stock, financiación, botón Comprar
  ni enlace roto. Cuando no existe destino, la tarjeta es informativa.
- **Tests**: `tests/e2e/search.spec.ts` reescrito con 20 escenarios
  (AirPods, funda AirPods, cargador, cascos, air pods, airpds,
  consulta vacía, URL, back/forward, teclado del Header, Ver todos,
  overlay móvil, axe). Regresión: `apple-finder` (31) y
  `accessibility` (9) siguen verdes. Total: **141/141** (122 → 141).
- Sin cambios en carrito, checkout, seguro (`INSURANCE_PRICE`,
  `insurancePrice`, `cartInsuranceTotal`, `setLineInsurance`), Plan
  Renove, Servicio Técnico, tienda favorita, favoritos+avisos,
  inventario, comparador, recomendador, catálogo real, precios,
  imágenes ni workflows. Sin dependencias nuevas.

## 2026-07-30 — Últimos ajustes del recomendador (PR #24)

Rama `fix/finder-final-polish`. Commit funcional `88049b2`. Merge
`9fde8cf`.

- **Texto genérico para 0 candidatas**. `FamilyConfirmStep` distingue
  ahora dos casos: fotografía + complemento mantiene la explicación
  específica del prototipo; cualquier otra combinación sin candidatas
  usa un mensaje genérico ("Con las respuestas indicadas no hemos
  podido sugerir una categoría del catálogo" + "Puedes revisar tus
  respuestas o elegir manualmente una categoría para continuar"). Ya
  no se menciona fotografía cuando la ruta no es foto+accessory.
- **Foco al entrar en el estado sin coincidencias**. El encabezado
  principal recibe `tabIndex={-1}` y un `useEffect` mueve el foco al
  entrar en el estado (`focus({ preventScroll: true })`). Se mantiene
  `aria-live="polite"`. Se preserva el botón Atrás y el foco no se
  restaura en cada render.
- **Docs de la PR #23**. La entrada del registro deja de aparecer
  como "PR pendiente" y se enlaza al merge
  `67d26b9f5e5065a1e30d04e5c49f2e91c42996a8`. La nota de sesión
  correspondiente añade el bloque "Cierre" con PR, commit funcional y
  merge.
- **Tests**: se amplía "workType se limpia" para recorrer también el
  segundo resumen (Trabajo → Mac → resumen → cambio a Estudio → iPad
  → segundo resumen sin workType → resultados). Se añade un test que
  verifica el foco en el encabezado del estado sin coincidencias.
  Total: **122/122** (121 → 122).

Sin cambios en buscador, comparador, catálogo, precios, carrito,
seguro, checkout, Plan Renove, Servicio Técnico, tienda favorita,
favoritos+avisos, inventario ni imágenes.

## 2026-07-29 — Casos límite del recomendador (PR #23)

Rama `fix/finder-edge-cases-cleanup`. Commit funcional
`fe07b40d8bcd2b2a38430c24fb9cc68902297158`. Merge
`67d26b9f5e5065a1e30d04e5c49f2e91c42996a8`.

- **`workType` se limpia automáticamente** cuando `general.use` deja de ser
  "trabajo". `setGeneral` retira la clave del objeto (no la deja como
  `undefined`) para que ni el resumen ni el motor de ranking la vean como
  respuesta activa.
- **`SummaryStep` solo muestra preguntas aplicables**. Las filas
  generales se construyen a partir de `getGeneralQuestionFlow(general)`,
  respetando el orden real del recorrido y ocultando filas sin respuesta.
- **Fotografía + complemento** ya no recomienda nada. `isFamilyEligibleForIntent`
  devuelve `false` para las cinco familias cuando `use === 'foto'` y
  `role === 'accessory'`, porque el prototipo no tiene una categoría de
  accesorios fotográficos.
- **Sin fallback a iPhone**. Cuando `computeFamilyCandidates` devuelve
  `[]`, ya no se inyecta `[{ family: 'iphone', score: 0, reasons: [] }]`.
- **Estado sin coincidencias** en `FamilyConfirmStep` con título "No
  encontramos una categoría que encaje con todo" (mensaje específico
  para fotografía+complemento), acciones "Revisar respuestas" (vuelve a
  `general.productRole`) y "Ver todas las categorías" (selector manual).
  `aria-live="polite"`.
- **Soporte 0/1/2 candidatas**: con una sola candidata se renderiza una
  única tarjeta como "Recomendación principal", sin placeholder.
- **Código muerto retirado**: `FAMILY_ROLE_TAGS` y su `void` inalcanzable
  tras `return`.
- **Docs**: PRs #20, #21 y #22 ya no aparecen como "PR pendiente".
- **Tests**: 5 nuevos escenarios en `apple-finder.spec.ts`: limpieza de
  workType al cambiar de uso; SummaryStep no muestra workType; foto+
  accessory muestra estado sin coincidencias; "Revisar respuestas"
  conserva respuestas y permite cambiar el rol; "Ver todas las
  categorías" abre el selector manual. Regresión: trabajo + primary +
  portable sigue devolviendo Mac + iPad. Total: 121/121 (116 → 121).

Sin cambios en comparador, catálogo, precios, carrito, seguro,
checkout, Plan Renove, Servicio Técnico, tienda favorita,
favoritos+avisos, inventario ni imágenes.

## 2026-07-29 — Ranking de familias del recomendador (PR #22)

Rama `fix/finder-family-intent-ranking`.

- **Bug corregido**: en el flujo "No lo tengo claro" con respuestas
  Trabajo + Portabilidad + Sí lo llevaré siempre encima, el asistente
  proponía AirPods e iPhone en lugar de Mac e iPad. Causa: en
  `computeFamilyCandidates` los puntos se sumaban de forma independiente
  y el desempate final era alfabético (`family.localeCompare`), lo que
  colocaba `airpods` por delante de `mac`.
- **Nuevas preguntas generales**:
  - `general.productRole` ("¿Qué tipo de producto necesitas?") con
    valores `primary` / `mobile` / `accessory` / `unknown`.
  - `general.workType` ("¿Qué tipo de trabajo?") con `office` /
    `desktop-apps` / `creative` / `mobile-tasks` / `unknown`. Solo se
    pregunta si `general.use === 'trabajo'`.
- **`getGeneralQuestionFlow(general)`** filtra dinámicamente el flujo:
  `workType` solo aparece cuando el uso es trabajo.
- **Eligibility semántica** (`isFamilyEligibleForIntent`): un modelo
  incompatible por rol/uso NUNCA aparece. Trabajo + primary excluye
  AirPods/Watch; trabajo + accessory limita a AirPods; audio y salud
  fuerzan la familia natural.
- **Scoring por intención** (`scoreFamilyForIntent`): base por uso,
  modificador por productRole, modificador por workType, modificador
  por priority, modificador por portability. La portabilidad ya NO
  premia AirPods/Watch por ser pequeños ni penaliza a Mac con −1.
- **Desempate NO alfabético**: `FAMILY_PRIORITY_BY_USE` define una
  prioridad semántica por uso (`trabajo` → mac, ipad, iphone, airpods,
  apple-watch; etc.). El sort primero por score desc, y en empate por
  `priorityIndex` asc.
- **Tests nuevos** (9 escenarios): el bug reportado (trabajo + primary
  + portabilidad → Mac + iPad, no AirPods/Watch); trabajo + programación
  → Mac; trabajo + móvil + mobile-tasks → iPad + iPhone; estudio +
  primary → iPad + Mac; foto + primary → iPhone; audio + accessory →
  AirPods; salud + accessory → Watch; diario + mobile → iPhone;
  desempate NO alfabético. Suite: **116/116** (107 → 116).

Sin cambios en comparador, catálogo, precios, carrito, seguro, checkout,
Plan Renove, Servicio Técnico, tienda favorita, favoritos+avisos ni
imágenes.

## 2026-07-29 — Calidad de las recomendaciones del asistente (PR #21)

Rama `fix/apple-finder-recommendation-quality`.

- **Nueva arquitectura de respuestas** con namespaces en
  [[../src/data/productDecisionData]]: `FinderAnswers { general, family,
  specific }`. Los IDs específicos llevan prefijo por familia
  (`iphone.use`, `mac.form`, `airpods.fit`, `watch.cellular`, …). Ya no
  hay solapamiento de claves entre general y específica.
- **Flujo "No lo tengo claro"** con confirmación: preguntas generales →
  `computeFamilyCandidates` calcula 2 familias probables → pantalla
  "Por lo que nos cuentas, creemos que estas categorías pueden encajar"
  con recomendación principal, segunda posibilidad y "Ver todas las
  categorías". Volver atrás conserva respuestas generales.
- **Filtros duros** (`filterEligibleModels`) frente a preferencias
  blandas (`scoreEligibleModel`). Un modelo que incumple una
  restricción dura NUNCA se recomienda:
  - Mac portátil/sobremesa imprescindible;
  - AirPods `open` / `in-ear` / `over-ear` estricto;
  - iPad Pencil / Magic Keyboard imprescindible;
  - Apple Watch Cellular imprescindible;
  - presupuesto estricto o con margen del 15 %.
- **Taxonomía AirPods v2** — `airpodsFit: 'open' | 'in-ear' | 'over-ear'`
  reemplaza al antiguo `fitType`. Clasificación: AirPods 4 y 4 con ANC
  → `open`; AirPods Pro → `in-ear`; AirPods Max → `over-ear`.
- **Presupuesto por familia** — `getBudgetOptionsForFamily(family, models)`
  calcula tramos sensatos a partir de los precios reales del catálogo,
  con paso 25/50/100 € según familia. Nueva pregunta de
  **flexibilidad** (`strict` / `flex` / `reference`) que se combina con
  el filtro duro o con una penalización proporcional en el score.
- **Roles de resultado nuevos** — `best-fit` / `best-value` / `other`.
  Umbrales: best-value con score ≥ 70 % del mejor; other con score
  ≥ 75 % del mejor. Se retiran "Alternativa más económica" y
  "Alternativa más avanzada".
- **Relajación transparente** — si `filterEligibleModels` no deja
  ningún modelo, `FinderComputation.noMatch = true` y la UI muestra
  "No encontramos una opción que cumpla todo", con la lista de
  descartes, y ofrece "Ampliar presupuesto y probar" y "Revisar
  respuestas".
- **Razones y compromisos personalizados** — `buildRecommendationReasons`
  y `buildRecommendationCaveats` derivan las líneas "Encaja contigo
  porque" y "Ten en cuenta" a partir de las respuestas concretas
  (formato, prioridad, tamaño, Pencil/Cellular, presupuesto). Ya no
  se rellenan con `strengths` genéricos.
- **Resumen editable** ("Esto es lo que buscas") antes de calcular:
  Producto, respuestas generales, específicas, presupuesto y
  flexibilidad, con un botón "Cambiar" en cada línea.
- **Tests** — `tests/e2e/apple-finder.spec.ts` reescrito (16
  escenarios: flujo iPhone completo, confirmación de familia, filtros
  duros por familia, presupuesto estricto, resumen editable, roles
  nuevos, comparar, axe). Suite: **107/107** (99 → 107).

Sin cambios en carrito, seguro, checkout, Plan Renove, Servicio
Técnico, tienda favorita, favoritos+avisos, inventario demostrativo,
precios ni imágenes del catálogo.

## 2026-07-29 — Simplificación visual del comparador (PR #20)

Rama `fix/comparator-visual-simplification`.

- **Selección por diálogo** (`ModelPickerDialog`): tres "espacios" en la
  parte superior con "Elegir modelo" y "Cambiar modelo". Se retira la
  rejilla inferior con todos los modelos y el bloque "Diferencias entre
  las opciones". El diálogo reutiliza `<Modal />` (focus trap, Escape,
  restauración de foco, `aria-modal`).
- **Sustitución atómica** con `replaceCompareItem(currentId, next)` en
  `src/lib/store.tsx`: preserva orden de columnas, evita duplicados y
  respeta la restricción de familia única. El shape de `CompareItem` y la
  clave `banana:compare` no cambian.
- **Campos esenciales reducidos** en
  [[../src/data/productDecisionData]]: iPhone 8, Mac 8, iPad 7,
  Apple Watch 7, AirPods 6. Nueva lista `EXTENDED_FIELDS` sólo para el
  modo "Mostrar todas".
- **Agrupación semántica** con `FIELD_SECTIONS`: filas agrupadas en
  Precio, Pantalla/Diseño, Rendimiento, Cámara, Autonomía, etc. La tabla
  usa `<tr scope="colgroup">` con títulos de sección.
- **Regla del ganador único** en `buildDecisionSummary`: se declara
  ganador sólo cuando (a) todos los contextos tienen dato y (b) existe
  un extremo estricto. Un empate deja el badge sin asignar. Se retira el
  fondo amarillo global (`bg-brand-050`) de las celdas distintas.
- **Cabecera sticky real**: `<thead>` sticky, sin la copia
  `aria-hidden` que duplicaba productos.
- **Móvil 375 px**: sólo el contenedor de la tabla desplaza horizontal
  con `scroll-snap-type: x proximity` y `scroll-snap-align: start` por
  columna. Sin scroll horizontal en `<html>`/`<body>`.
- **Tests**: `tests/e2e/comparator.spec.ts` reescrito (14 escenarios,
  incluye ausencia de rejilla/resumen antiguos, sustitución en la misma
  columna, empate sin badge, sticky sin duplicados y axe del diálogo).
  Suite: 99/99 (chromium + mobile).

Sin cambios en carrito, seguro, checkout, Plan Renove, Servicio Técnico,
tienda favorita, favoritos+avisos, inventario demostrativo, precios ni
imágenes del catálogo.

## 2026-07-28 — Mejoras UX tras auditoría y cobertura axe

Rama `feature/audit-ux-improvements`.

- **Portada** con `<h1>` semántico único "Banana Computer — Apple en
  Canarias". El título rotativo del `HeroCarousel` pasa a `<h2>` para
  mantener la jerarquía.
- **`/soporte`** amplía el bloque "Servicio Técnico Autorizado" con:
  banner "Sin cita previa"; checklist de preparación (copia de
  seguridad, desactivar "Buscar", desactivar la Protección del
  dispositivo en caso de robo); opciones de entrega directa o en
  cualquier otra tienda Banana; condiciones de garantía (envío
  gratuito) y fuera de garantía (**35 €** con descuento si acepta la
  reparación o no reembolsable si la rechaza); plazos orientativos
  con mínimo de 3 días de traslado y aclaración de que ese plazo no
  incluye diagnóstico ni reparación. Sin reserva de cita, calendario,
  pago online, seguimiento real ni recogida a domicilio.
- **`/plan-renove`** incorpora una timeline oficial de cuatro pasos
  con Foxway (estimación → entrega → revisión y valoración final →
  compensación). Sin precios, sin ejemplos y sin tasador propio. El
  CTA "reservar cita previa" se sustituye por "Ver tiendas y
  horarios" para no contradecir la política sin cita.
- **`/tiendas`** deja de anidar enlaces dentro de un `div role="button"`
  (violación axe `nested-interactive`). Se sustituye por tres controles
  autónomos: "Ver detalles", "Cómo llegar" y un nuevo botón "Enfocar en
  el mapa".
- **Suite Playwright ampliada de 21 a 45 pruebas**: nuevo
  `tests/e2e/audit-ux.spec.ts` (16) verifica cada requisito literal de
  la mejora de SAT y Plan Renove, y nuevo
  `tests/e2e/accessibility.spec.ts` (7) ejecuta `@axe-core/playwright`
  con `wcag2a`, `wcag2aa` y `wcag21a` sobre portada, familia, ficha,
  tiendas, soporte, Plan Renove y checkout paso 1.
- `README.md` documenta las condiciones completas del servicio
  técnico y del Plan Renove, y `docs/03-roadmap.md` marca las cuatro
  mejoras como implementadas.
- No se modifica ni una línea del carrito, checkout, seguro ni scripts
  privados de la auditoría.

## 2026-07-28 — Auditoría UX de la web oficial de Banana Computer

Rama `chore/auditoria-web-oficial-banana`.

- Nuevos scripts locales `scripts/banana-audit/create-session.ts` y
  `scripts/banana-audit/run-audit.ts` con dos comandos npm
  (`audit:banana:login`, `audit:banana`). Ninguno se ejecuta en CI.
- `.gitignore` ampliado para bloquear sesiones, capturas privadas y
  cualquier `storageState`/`session.json` (`playwright/.auth/`,
  `.auth/`, `audit-private/`, `audit-logs-private/`, `audit-temp/`,
  `storageState*.json`, `*.session.json`).
- Nuevo informe `docs/auditorias/auditoria-web-oficial-banana.md` con
  alcance, resumen ejecutivo, análisis por sección, 15 hallazgos con
  gravedad y aplicación al prototipo, tabla comparativa con la web
  oficial y priorización.
- `docs/03-roadmap.md` amplía §6 con las cinco propuestas surgidas
  (todas pendientes de tu autorización). `docs/04-problemas-pendientes.md`
  registra UX-BANANA-001 como informativo.
- No se ha tocado la lógica del prototipo, ni el seguro, ni
  componentes ni pruebas existentes. `npm run build` y
  `npm run test:e2e` siguen en verde (21 pruebas).

## 2026-07-29 — Favoritos + avisos de disponibilidad (PR4 del bloque diferencial)

Rama `feature/favorites-availability-alerts`.

- Nuevo `src/data/demoStoreInventory.ts` con estado
  determinista por tienda × modelo (4 estados: disponible /
  pocas unidades / no disponible / bajo pedido) + overrides en
  memoria para la simulación de llegada.
- Nuevo `src/lib/favoriteAlerts.tsx` con contexto React y
  persistencia mediante `banana:favorite-alerts` y
  `banana:favorite-notifications`. Compatible con `banana:fav`
  sin migración; guardar favorito y activar aviso son acciones
  distintas.
- `src/pages/FavoritesPage.tsx` rediseñada con tres bloques:
  * **Mis productos** con estado en la tienda favorita, "Ver
    producto", "Quitar" y `<details>` "Seguir disponibilidad"
    para elegir tienda (opcionalmente también como favorita).
  * **Mis avisos** con "Simular llegada", cambio de tienda y
    "Desactivar".
  * **Notificaciones** internas con "Marcar como leído" /
    "Marcar todas como leídas".
- Nueva `NotificationsBell` en la cabecera con contador de no
  leídos, panel accesible (Escape, click-out) y enlace a
  favoritos.
- Al quitar un favorito con seguimiento activo, el alert y
  sus notificaciones se borran para no dejar huérfanos.
- Nueva `tests/e2e/favorites-alerts.spec.ts` (3): flujo
  completo con notificación + campana, huérfanos al quitar
  favorito y ausencia de PII / peticiones de red externas.
- Total suite: 90 → 93.
- Sin cambios en seguro, checkout, catálogo, Plan Renove,
  Servicio Técnico ni scripts privados.

## 2026-07-29 — Tienda favorita (PR3 del bloque diferencial)

Rama `feature/favorite-store`.

- Nuevo `src/lib/storePreference.tsx` con contexto React y
  claves `banana:favorite-store` y
  `banana:favorite-store-prompt`. Sólo se guarda el slug de
  tienda; nunca ubicación, coordenadas ni PII.
- Nuevo `src/components/layout/FavoriteStoreDialogs.tsx` con
  bottom sheet no bloqueante que se muestra en la primera
  visita (~800 ms) fuera del checkout. Confirmación discreta
  al elegir.
- Nuevo `FavoriteStoreMenu` en la barra utilitaria (Header) y
  `FavoriteStoreMobileBlock` en el menú móvil, ambos con
  radiogroup accesible para elegir/cambiar/quitar tienda.
- Personalización:
  * `/tiendas` ordena con la tienda favorita primero y muestra
    badge "Tu tienda".
  * `/tiendas/:slug` incluye CTA "Marcar como mi tienda" /
    "Esta es tu tienda" con opción "Quitar".
  * `StorePicker` prioriza la tienda favorita con badge y
    nota "Consultar en tu tienda".
- Nueva suite `tests/e2e/favorite-store.spec.ts` (7): prompt
  inicial no bloqueante, "Ahora no", elegir tienda + persistencia,
  cabecera actualizada, badge en `/tiendas`, marcar/quitar
  desde detalle, sin PII, 375 px sin scroll y prompt oculto
  en checkout. Total suite: 82 → 90.
- Sin cambios en checkout: se respeta cualquier selección
  explícita del usuario. Sin tocar seguro, catálogo, Plan
  Renove ni Servicio Técnico.

## 2026-07-29 — Asistente "Encuentra tu Apple" (PR2 del bloque diferencial)

Rama `feature/apple-finder-assistant`.

- Amplía `src/data/productDecisionData.ts`:
  * `ModelDecisionMeta` gana niveles cualitativos (1-3):
    `portabilityLevel`, `performanceLevel`, `cameraLevel`,
    `batteryLevel`, `valueLevel`, `professionalLevel` +
    banderas `supportsPencil`, `supportsKeyboard`,
    `hasNoiseCancellation`, `hasCellular`, `fitType` y
    `strengths` como orientación demostrativa.
  * `FINDER_QUESTIONS` por familia (3-4 preguntas + presupuesto),
    `GENERAL_QUESTIONS` para el flujo "No lo tengo claro" y
    `inferFamilyFromGeneral()` para mapear uso → familia.
  * `scoreModel(model, answers)` puro y determinista con
    razones positivas y posibles compromisos. Desempate
    estable: score desc → precio asc → slug asc.
  * `computeFinderResults()` produce 3 resultados etiquetados
    ("Nuestra recomendación", "Alternativa más económica",
    "Alternativa más avanzada"), sin duplicados.
- Nueva página `src/pages/AppleFinderPage.tsx` en
  `/elige-tu-apple` con estado 100 % React, radiogroups
  accesibles, "Anterior/Siguiente", "Empezar de nuevo" y
  "Cambiar respuestas".
- Accesos:
  * Nueva entrada "Encuentra tu Apple" en `utilityLinks`.
  * Franja discreta en la portada.
  * CTA activo en el estado vacío del comparador.
  * CTA secundario en el estado vacío de favoritos.
- Suite Playwright: nueva `tests/e2e/apple-finder.spec.ts` (8
  pruebas). Actualizado el test del comparador para el CTA
  activo. Total: 73 → 82 pruebas.
- Sin cambios en seguro, checkout, catálogo ni scripts privados.

## 2026-07-29 — Comparador esencial (PR1 del bloque diferencial)

Rama `feature/comparator-essential`.

- Nuevo módulo `src/data/productDecisionData.ts`: campos
  esenciales por familia (iPhone/Mac/iPad/Watch/AirPods),
  utilidades de normalización (`getEssentialValue`,
  `buildDecisionRows`, `buildDecisionSummary`,
  `parseWeightGrams`, `parseScreenInches`,
  `parseCapacityGB`). Metadata interna `usoRecomendado` por
  modelo, marcada como orientación demostrativa.
- Rediseño de `src/pages/ComparePage.tsx`:
  - Encabezado "Compara tus opciones" + descripción explicando
    el foco en diferencias.
  - Estado vacío con selector de familia y CTA "Necesito ayuda
    para elegir" (deshabilitado hasta la PR 2 del asistente).
  - Columnas con imagen, nombre, variante, capacidad, precio
    demostrativo, botones "Ver producto" / "Favorito" /
    "Comprar" / "Quitar" y `<select>` "Sustituir por" con los
    modelos restantes de la familia.
  - Cabecera sticky reducida en escritorio con las tarjetas
    activas.
  - Switch **"Solo diferencias" (por defecto)** vs "Mostrar
    todas" con `aria-live="polite"`; ambos aplican sobre la
    reducción de `buildDecisionRows`.
  - Resumen superior calculado con `buildDecisionSummary`:
    "Opción más económica", "Mayor capacidad inicial", "Mayor
    pantalla" y "Más ligero" — sólo cuando hay dos productos y
    los datos son comparables. Etiquetado como *Orientación
    demostrativa*.
- Compatibilidad total con `banana:compare` existente: no se
  cambia el shape de `CompareItem` (los datos esenciales se
  derivan al vuelo a partir del catálogo por `modelSlug`).
- Suite Playwright: nueva `tests/e2e/comparator.spec.ts` (8
  pruebas: encabezado, estado vacío, switch, resumen,
  sustitución, favoritos/carrito, persistencia, 375 px, axe) y
  actualización de `favorites-compare.spec.ts` para el nuevo
  `aria-label` "Quitar iPhone 17 Pro de la comparación" y el
  scope del `<thead>`. Total: 64 → 73 pruebas.
- Sin cambios en seguro, checkout, precios, Plan Renove,
  Servicio Técnico ni scripts privados.

## 2026-07-29 — Limpieza release candidate y mantenimiento técnico

Rama `chore/release-candidate-cleanup`.

- **Documentación alineada con la interfaz**: la fila de
  `/plan-renove` en la tabla de rutas del README ya no menciona
  al proveedor externo; la sección de axe corrige el conteo a
  "ocho rutas más la guía interactiva". `docs/03-roadmap.md`
  refleja el orden correcto de preparación (copia → antirrobo →
  Buscar), la existencia de `/servicio-tecnico` como página
  propia y la guía interactiva `DevicePreparationGuide`.
- **Node.js 24 explícito en CI y Pages**: `node-version: 20` →
  `node-version: 24` en `.github/workflows/e2e.yml` y
  `.github/workflows/deploy.yml`. Nuevo `.nvmrc` en la raíz con
  `24` para alinear el entorno local con nvm.
- **Artefactos de TypeScript fuera del repositorio**:
  `git rm tsconfig.tsbuildinfo` y nueva regla `*.tsbuildinfo` en
  `.gitignore`. El archivo sigue generándose localmente con
  `tsc -b` pero ya no se versiona. No se ha desactivado el modo
  `incremental`.
- **`npm audit` reverificado**: sigue habiendo 2 vulnerabilidades
  moderadas en `react-router@6.30.4` sin fix dentro de la línea
  6.x (`GHSA-wrjc-x8rr-h8h6` y `GHSA-337j-9hxr-rhxg`). Se
  **mantiene** `react-router-dom@6.30.4`; no se ha migrado a
  React Router 7 ni se ha ejecutado `npm audit fix`. SEG-001
  permanece abierto con la evidencia actualizada.
- **QA-001 sin contradicciones**: el pendiente residual queda
  reducido a ampliar la cobertura axe al detalle de tienda
  (`/tiendas/:slug`); ya no aparece "integrar axe" como tarea
  pendiente.
- **CI-001 cerrado en código**, pendiente de la validación del
  workflow de la propia PR.
- **ARTEFACTOS-001** documentado y cerrado.
- Sin cambios en interfaz, componentes React, `src/`, `tests/`
  ni scripts privados de auditoría. El seguro, el checkout, el
  Plan Renove y la guía interactiva permanecen intactos.

## 2026-07-29 — Portada sin H1, guía interactiva y axe sin excepciones

Rama `fix/home-sat-guide-accessibility`.

- **Portada** (`src/pages/Home.tsx`): se elimina la franja
  "Bienvenido / Banana Computer — Apple en Canarias" y el `<h1>`
  que contenía. La portada empieza directamente por `HeroCarousel`.
  Es una decisión visual consciente: no se sustituye por otro H1,
  ni visible ni `sr-only`.
- **Guía interactiva "Preparar mi dispositivo"**
  (`src/components/support/DevicePreparationGuide.tsx`): modal
  accesible con `role="dialog"`, `aria-labelledby`, `aria-describedby`,
  trampa de foco (Tab / Shift+Tab cíclicos), Escape, restauración
  del foco al activador y `inert` sobre el resto del documento
  mientras está abierto. Cuatro pasos: copia de seguridad → modo
  antirrobo → función Buscar → resumen. Cada paso de preparación
  exige una confirmación explícita antes de habilitar "Siguiente".
  **Estado local**: no toca `localStorage`, `sessionStorage`,
  cookies ni la red; al cerrar reinicia el progreso.
- El quick-link "Iniciar reparación" pasa a llamarse
  **"Preparar mi dispositivo"** (`src/data/content.ts`) y ahora
  abre la guía. Los CTAs de `/soporte` y `/servicio-tecnico` la
  activan también.
- **axe sin excepciones globales** (`tests/e2e/accessibility.spec.ts`):
  se retira `disableRules(['color-contrast','region'])`. Las
  violaciones reales se corrigen con cambios mínimos de paleta:
  `--color-muted` `#6e6e73` → `#4d4d55`; barra utilitaria
  `#3ea3c1` → `#1f6e83` (retirada la opacidad `text-white/90`);
  `--color-available` `#2e7d32` → `#2a6d2e`; y `text-ink/60`
  → `text-ink/80` en la portada y en el hero.
- **`/tiendas`** ya se había corregido previamente para `nested-interactive`.
- **Landmarks** en `SupportPage`: el contenido pasa a estar
  envuelto en `<main>`, la FAQ y las secciones de cierre en
  `<section aria-labelledby>` para que `region` pase sin trucos.
- **Suite Playwright**: 49 → **64 pruebas** (nuevos:
  `device-preparation-guide.spec.ts` con 12 pruebas y ajustes en
  `audit-ux.spec.ts`).
- **No se ha tocado** Plan Renove, ni carrito, ni checkout, ni la
  lógica del seguro.

## 2026-07-28 — Docs actualizados y E2E reales para favoritos y comparador

Rama `fix/docs-and-real-e2e`.

- README: la sección "Pruebas Playwright" indica el número real de
  suites y pruebas medido con `npm run test:e2e` (21: 20 en `chromium`
  + 1 en `mobile`), enumera cada archivo y aclara que el workflow
  instala Chromium y que el proyecto `mobile` usa `Pixel 5` para no
  requerir WebKit. Se explicita que favoritos y comparador se prueban
  ahora recorriendo la interfaz real y que no se preselecciona nada en
  `localStorage`.
- `docs/00-estado-actual.md`: retirada la PR #5 como versión desplegada
  actual y sustituida por la PR #10 y esta rama; catálogo corregido a
  21 modelos reales contados desde `src/data/products.ts`; tiendas con
  badge "Abierto ahora" / "Cerrado" (hora de Canarias) y mapa por
  `mapQuery`; modo claro fijo sin `prefers-color-scheme`; historial
  de despliegues y verificaciones marcado explícitamente como
  histórico para no confundirlo con el estado actual.
- `docs/04-problemas-pendientes.md`: QA-001 detalla la nueva
  metodología (interacción real, sin `setItem`); DOC-001, HOOKS-001 y
  A11Y-001 se mantienen cerrados; no se abren problemas sobre el
  seguro.
- Pruebas E2E: `tests/e2e/favorites-compare.spec.ts` reescrito.
  Favoritos ahora se prueba desde `/iphone` → botón corazón del
  `ProductCard` → `/favoritos` → botón "Quitar" → estado vacío.
  Comparador ahora se prueba desde `/iphone/17-pro` → dos checkboxes
  "Añadir a comparar" → `/comparar` → botones "Quitar" → vacío. Las
  pruebas del seguro (`checkout-flow.spec.ts` y `checkout.spec.ts`) se
  conservan intactas.
- Resultados: `npm run build` correcto (426 módulos); `npm run test:e2e`
  21/21 en verde; Deploy Pages y Pruebas E2E en verde tras el merge.

## 2026-07-28 — Hooks del checkout, trampa de foco del chat, docs y E2E

Rama `fix/checkout-hooks-docs-e2e`.

- `CheckoutPage`: todos los hooks se llaman antes de cualquier retorno
  condicional. Las guardas de los pasos 1, 2 y 3 se mantienen; la
  confirmación sigue sobreviviendo a recargas y el pedido demostrativo
  sigue creándose sólo al pulsar "Confirmar pedido".
- `ChatBubble`: trampa de foco completa (Tab / Shift+Tab cíclicos entre
  "Cerrar" e "Ir a soporte"), Escape cierra y devuelve el foco al botón
  flotante, y el resto del documento se marca `inert` mientras el panel
  está abierto. El botón flotante pasa a "Ocultar chat" al estar abierto
  para no colisionar con el nombre accesible del botón interno.
- README: "PNGs oficiales" → "Imágenes oficiales optimizadas en WebP",
  sección explícita de reseñas y textos comerciales demostrativos, y
  retirada la mención a `prefers-color-scheme` (la interfaz está en
  modo claro fijo).
- Suite Playwright ampliada de 9 a 21 pruebas: entrega compartida
  carrito↔checkout, seguro sin duplicar cantidad, color/capacidad con
  basename, Apple Watch tamaño y GPS/Cellular, recarga profunda,
  ausencia de errores de hooks en consola, favoritos, comparador y
  trampa de foco del chat con teclado.
- Docs actualizados: `00-estado-actual.md`,
  `04-problemas-pendientes.md` (cierra DOC-001; abre y cierra
  HOOKS-001 y A11Y-001; amplía QA-001).

## 2026-07-28 — PNGs transparentes Air+iMac, nav una sola fila, publicado

Workflow `30313993859` completado con `success`.

- MacBook Air (4 colores) e iMac 24" M4 (7 colores): sustituidas por PNGs
  transparentes 1080×1080 (RGBA) descargados directamente del CDN de Apple
  (`store.storeimages.cdn-apple.com`, `fmt=png-alpha`). Sin fondo blanco.
  iMac mantiene `imageBg` para el fondo de color característico.
- Nav strip Mac: una sola fila con `overflow-x-auto no-scrollbar`, items a
  `w-24 shrink-0`, centrados en lg+. Los 9 items son visibles sin scroll en
  escritorio y con scroll horizontal en móvil.

## 2026-07-28 — Imágenes Air/Pro corregidas y Mac mini visible, publicado

Workflows `30312650928` y `30313030912` completados con `success`.

- MacBook Air M4/M5: reemplazadas las imágenes anteriores (vista de perfil cerrado) por recortes correctos de la vista frontal abierta del compuesto oficial de Apple (y=60–400 sobre 504×876, escalado a 1080×1080 blanco). Azul cielo usa la imagen oficial de 1080×1080 de Apple Newsroom. Cuatro colores: Medianoche, Plata, Blanco estrella y Azul cielo.
- MacBook Pro M4/M5: reencuadradas las cinco imágenes de color para centrar verticalmente el portátil (recorte y=265, altura=750; relleno a 1080×1080). El portátil pasa del 28–89 % al ~20–80 % del encuadre.
- Catálogo Mac — nav strip: cambiado de desplazamiento horizontal (`overflow-x-auto`) a cuadrícula flexible (`flex-wrap justify-center`). Todos los modelos incluido Mac mini son visibles sin necesidad de scroll.
- iMac 24" M4 en nav: la miniatura aplica `imageBg` como `backgroundColor` del contenedor, igual que en las tarjetas de producto.

## 2026-07-27 — Imágenes Air abiertas, fondo iMac y Mac mini, publicado

Workflow `30283909013` completado con `success`.

- MacBook Air M4/M5: las imágenes por color (Medianoche, Plata, Blanco estrella, Azul cielo) muestran ahora el portátil abierto recortado de la imagen compuesta de Apple, rellenado a 1080×1080.
- iMac 24" M4: añadido `imageBg` por color para que el fondo del contenedor de imagen coincida con el fondo de la foto, eliminando el recuadro visible en tarjetas y ofertas.
- Página Mac: nueva sección "Catálogo completo" con `ProductCard` para todos los modelos, haciendo visible Mac mini y Mac Studio independientemente de si tienen oferta.

## 2026-07-27 — Imágenes Mac por color, publicado

Workflow `30277394128` completado con `success`.

- MacBook Neo actualizado a 4 colores reales (Plata, Cítrico, Rosa nube, Índigo) con imágenes PNG individuales de Banana Computer.
- MacBook Pro M4 y M5: imágenes por color (Negro espacial / Plata) en lugar de imagen única.
- MacBook Air M4: añadido 4.º color Azul cielo con imagen oficial.
- MacBook Air M5: añadido color Blanco estrella (4 colores totales).
- iMac 24" y Mac mini: imágenes redimensionadas de 2250×2250 a 1080×1080 para uniformidad visual.

## 2026-07-26 — Tema automático del dispositivo, pendiente de publicación

- Retirado el botón de tema de la cabecera comercial y de checkout.
- Eliminados el proveedor React, la preferencia `banana:theme` y el fundido
  asociado al cambio manual.
- El modo oscuro se activa exclusivamente mediante
  `prefers-color-scheme: dark` y responde a cambios del dispositivo.
- En modo claro se conserva la presentación blanca original.

## 2026-07-26 — Selector de tema e imágenes Mac, publicado

La PR [#5](https://github.com/Oskrrr09/pagina-banana/pull/5) se fusionó en
`main`. El workflow
[`30214178171`](https://github.com/Oskrrr09/pagina-banana/actions/runs/30214178171)
compiló y publicó la versión en
<https://oskrrr09.github.io/pagina-banana/>.

- Añadido un selector claro/oscuro en la cabecera comercial y en checkout.
- La preferencia del sistema actúa como valor inicial y la elección manual se
  conserva en `localStorage`.
- El paso entre temas usa un fundido accesible de 360 ms que respeta la
  reducción de movimiento.
- Corregidas las franjas blancas laterales de la campaña principal en modo
  oscuro.
- Sustituidas las ocho siluetas del selector Mac por fotografías oficiales
  descargadas de Apple Newsroom, documentadas y centradas en marcos uniformes.
- Compilación de producción y comprobación manual local correctas.
- En producción se verificaron la persistencia del tema, el fondo negro de la
  campaña y la carga y el centrado de las ocho imágenes.

## 2026-07-26 — Consistencia visual y tema del dispositivo, publicado

La PR [#4](https://github.com/Oskrrr09/pagina-banana/pull/4) se fusionó en
`main`. El workflow
[`30211613240`](https://github.com/Oskrrr09/pagina-banana/actions/runs/30211613240)
compiló y publicó la versión en
<https://oskrrr09.github.io/pagina-banana/>.

- Fijada la altura del carrusel de tiendas y del mega-menú de escritorio.
- El mega-menú Mac usa imagen de producto, sitúa “Nuevo” sobre la tarjeta y
  lista juntos los MacBook Air M4/M5 y los MacBook Pro M4/M5.
- Normalizadas las áreas internas de las tarjetas de producto para alinear las
  tarjetas de una misma categoría.
- La ficha muestra controles de cantidad junto al carrito una vez que la
  variante está añadida; la capacidad conserva el color seleccionado.
- La cabecera de checkout usa un amarillo pastel opaco.
- Añadido tema automático claro/oscuro según el dispositivo.

## 2026-07-26 — Catálogo y flujo de compra publicado

La PR [#3](https://github.com/Oskrrr09/pagina-banana/pull/3) se fusionó en
`main`. El workflow
[`30210351355`](https://github.com/Oskrrr09/pagina-banana/actions/runs/30210351355)
compiló y publicó la versión, verificada después en
<https://oskrrr09.github.io/pagina-banana/>.

- Nueva presentación de iPhone y Mac con franja horizontal de modelos, ofertas
  destacadas y acceso directo a variantes.
- Categoría Mac ampliada a ocho grupos actuales de producto, con imágenes
  locales y precios siempre marcados como demostrativos.
- La ficha separa “Comprar” —checkout inmediato— de “Añadir al carrito” —seguir
  comprando—.
- El seguro se vincula a cada producto y puede modificarse en su tarjeta de
  cesta y en “Pago y extras”; el resumen calcula el total por unidades
  aseguradas.
- La cabecera exclusiva del checkout adopta un amarillo suave para diferenciarse
  de la cabecera comercial.
- Añadido un globo amarillo global que reserva el acceso al futuro chat y
  comunica que todavía no está disponible.
- Verificados build, rutas principales y 375, 768, 1024 y 1440 px sin
  desbordamiento horizontal.
- Registrado el aviso no bloqueante del workflow sobre la retirada de Node 20.

## 2026-07-26 — Flujo de variantes y seguro publicado

La PR [#2](https://github.com/Oskrrr09/pagina-banana/pull/2) se fusionó en
`main` y el workflow
[`30208520075`](https://github.com/Oskrrr09/pagina-banana/actions/runs/30208520075)
publicó correctamente esta versión en GitHub Pages.

### Flujo de variantes y seguro

- “Comprar” en las tarjetas de color abre ahora la ficha de la capacidad y el
  color seleccionados.
- Las URLs de variante respetan el `basename` `/pagina-banana/`.
- El botón defectuoso de seguro se sustituyó por una casilla accesible.
- El seguro se persiste como opción única del pedido, añade 8,99 € sin duplicar
  productos y se comparte entre ficha, carrito y checkout.
- Verificados build y recorrido manual en escritorio y a 375 px.

## 2026-07-26 — Publicado en GitHub Pages

La PR [#1](https://github.com/Oskrrr09/pagina-banana/pull/1) se fusionó en
`main` y el workflow
[`30206642599`](https://github.com/Oskrrr09/pagina-banana/actions/runs/30206642599)
publicó correctamente esta versión en
<https://oskrrr09.github.io/pagina-banana/>.

### Presentación y accesibilidad

- Sustituida la reseña ficticia por un espacio neutro para futuras opiniones
  verificadas.
- Separado checkout del layout comercial: una cabecera simplificada y sin
  footer general en los tres pasos.
- Actualizadas las cinco tiendas con direcciones, horarios, fecha de consulta y
  fuentes oficiales; eliminado el estado “Abierto ahora”.
- El selector de recogida del checkout reutiliza los datos centrales de tiendas.
- Añadida trampa de foco, Escape, retorno del foco, ARIA modal y bloqueo de
  scroll al menú móvil.
- Convertido el footer móvil en acordeones cerrados inicialmente, con controles
  táctiles de al menos 44 px.
- Reforzada la newsletter móvil con campo y botón de 48 px, texto de 16 px y
  apilado sin desbordamiento a 375 px.
- Ajustado el breakpoint de la navegación comercial para evitar desbordamiento
  a 1024 px.

### Documentación

- Añadido `AGENTS.md` con reglas de contexto, alcance, mantenimiento documental
  y verificación.
- Creado el vault compartido `docs/` con estado, contexto, decisiones, roadmap,
  problemas pendientes y registro de cambios.
- Reservado `docs/sesiones/` para notas de continuidad.
- Ignorada la configuración local `docs/.obsidian/` y `.obsidian/`.
- Incorporados los skills locales de `.agents/` como guías reutilizables del
  repositorio.

### Verificación

- Compilación de producción correcta.
- Instalación reproducible con `npm ci`.
- Comprobación manual correcta a 375, 768, 1024 y 1440 px.
- Registrados dos avisos moderados de seguridad de React Router.

## Historial existente

### 2026-07-27

- `b1dcb2e` — Centrado imagen hero (recorte negro izquierda) y corrección de
  overflow horizontal de página (overflow-x: hidden en html/body).
- `2a12431` — Flechas bento, lupa a la izquierda del carrito, overlay de
  búsqueda con sugerencias por categoría y recorte de banda gris inferior del hero.
- Push directo a `main` en ambos casos.

### 2026-07-26

- `bdd7c85` — Fusiona las correcciones de presentación y accesibilidad.
- `e7de00b` — Añade despliegue automático a GitHub Pages.
- `76642b3` — Unifica el color de marca a amarillo Banana.
- `35fca54` — Ajustes de tiendas, comparador y cabecera.
- `a7e08e6` — Rediseño Banana: catálogo multi-familia, estética amarilla y
  nuevas secciones.

### 2026-07-25

- `aa0bb54` — Prototipo navegable de Banana Computer (Fase 2, §8.2).
- `711023f` — Initial commit.
