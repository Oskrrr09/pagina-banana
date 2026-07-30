---
tipo: sesion
fecha: 2026-07-30
tema: catálogo inicial de accesorios oficiales Apple
---

# Catálogo inicial de accesorios Apple

## Objetivo

Convertir los accesorios Apple del buscador (hasta ahora entradas
demostrativas sueltas) en un catálogo de prototipo real, con página
de catálogo, ficha de detalle, compatibilidad estructurada e
integración con el buscador y con las fichas de dispositivo. La
información se marca como demostrativa: los precios y disponibilidad
finales deben validarse contra el inventario de Banana Computer.

## Investigación

Fuentes usadas el 2026-07-30:

- Banana Computer — `https://tienda.bananacomputer.com/`
  (accesorios Mac, iPad, iPhone, Watch, AirPods, AirTag).
- Apple España — `https://www.apple.com/es/` (denominaciones,
  compatibilidad e imágenes oficiales por SKU).

Toda la investigación se registra en
`docs/catalogo-accesorios-apple.md` con la tabla producto/fuente/
decisión.

### Productos candidatos → implementados (20)

Carga y cables (5), iPhone (4), iPad (4), Mac (4), Watch (2),
AirTag (2). Detalle en el registro y la tabla.

### Productos descartados

- **Almohadillas para AirPods Pro** — Banana no muestra el accesorio
  oficial. `demo:apple-airpods-tips` se retira del buscador.

### Productos aplazados

- Llavero trenzado fino AirTag — "Disponible próximamente" en Banana.
- Batería MagSafe iPhone Air — sin publicación activa en Banana.
- EarPods USB-C / 3,5 mm — fuera del alcance de la primera oleada.

## Arquitectura

### Tipo `Accessory`

```ts
interface Accessory {
  slug: string
  name: string
  brand: 'Apple'
  category: 'carga' | 'iphone' | 'ipad' | 'mac' | 'apple-watch' | 'airtag'
  tagline: string
  description: string
  price: number | null
  priceLabel?: string
  image: string
  imageBg?: string
  variants: AccessoryVariant[]
  specs: AccessorySpec[]
  highlights: string[]
  compatibility: {
    families?: FamilySlug[]
    models?: string[]     // 'iphone/17-pro', 'ipad/ipad-pro', …
    notes?: string[]
  }
  aliases: string[]
  keywords: string[]
  bananaSku?: string
  bananaSource?: string
  appleSource?: string
  verifiedOn: string
  availabilityLabel:
    | 'Producto mostrado públicamente por Banana'
    | 'Disponibilidad pendiente de validación'
    | 'Consulta disponibilidad en tienda'
  provisionalTags?: string[]
}
```

No se reutilizó el tipo `Model` (que asume capacidades, financiación,
seguros, variantes de color obligatorias, etc. propias de dispositivos).

### Helpers

`getAccessory(slug)`, `getAccessoriesByCategory(cat)`,
`getAccessoriesForFamily(family)`, `getAccessoriesForModel('iphone/17-pro')`,
`accessoryPath(slug)`.

### Rutas

- `/accesorios` → `AccessoriesPage` (catálogo con filtros).
- `/accesorios/:slug` → `AccessoryDetailPage` (ficha).

Registradas **antes** de `/:family` en `src/App.tsx` para evitar
colisión con `FamilyPage`.

## Imágenes

- 14 fotografías oficiales JPEG 1200×1200 descargadas con `curl`
  desde `store.storeimages.cdn-apple.com` a partir del SKU visible
  en `apple.com/es/shop/product/…`. Se conservan sin transformación.
- 8 ilustraciones SVG bespoke originales del prototipo para
  accesorios sin asset accesible desde el CDN público (30 W, cable
  240 W, Thunderbolt 4 Pro, funda iPhone Air, Magic Keyboard iPad
  Pro 11" M4, correa deportiva, AirTag y AirTag pack 4). Cada SVG
  incluye la leyenda "Ilustración del prototipo".

Detalle producto a producto en `docs/fuentes-imagenes-accesorios.md`.

## Variantes

- **Magic Mouse / Magic Trackpad**: variante blanco y negro con
  precio distinto (85€/119€ y 139€/169€). Comparten imagen porque
  Apple España usa una única fotografía representativa; el `alt`
  distingue la variante activa.
- **MagSafe**: variantes 1 m y 2 m con la misma foto por longitud.
- **Fundas iPhone**: por ahora una variante de color por ficha
  (la más representativa); se ampliarán cuando exista foto por color.

## Compatibilidad

Estructurada, no texto libre:

- Funda iPhone 17 → `models: ['iphone/17']` (no compatibleWith global).
- Funda iPhone 17 Pro trenzado → `models: ['iphone/17-pro']`.
- Funda iPhone Air → `models: ['iphone/air']`.
- Apple Pencil Pro → `models: ['ipad/ipad-pro', 'ipad/ipad-air']`.
- Magic Keyboard iPad Pro 11" M4 → `models: ['ipad/ipad-pro']`.
- Correa deportiva → `families: ['apple-watch']` + nota de tallas.
- MagSafe → `families: ['iphone', 'airpods']`.
- Cargador 20/30 W → `families: ['iphone', 'ipad', 'mac', 'airpods']`
  según el caso.

## Páginas

### `AccessoriesPage`

Encabezado + aviso de precios demostrativos + dos radiogroups
(Categoría y Compatibilidad) + botón "Limpiar filtros" + grid de
`AccessoryCard`. Estado vacío informativo. CTA final a tiendas y
soporte.

### `AccessoryDetailPage`

Breadcrumb (Inicio → Accesorios → nombre) + galería con radiogroup
de variantes (swatch de color cuando aplica) + info (nombre, tagline,
precio + `ProvisionalBadge` "Precio demostrativo",
`availabilityLabel`, descripción, highlights, CTAs a tiendas y
"Ver dispositivos compatibles") + especificaciones + compatibilidad
estructurada (modelos + familias + notas + dispositivos del catálogo
enlazados) + accesorios relacionados de la misma categoría.

### `AccessoryCard`

Imagen contenida en `aspect-square` con `imageBg`, categoría,
nombre, compatibilidad resumida y precio + `ProvisionalBadge`. Sin
botón Comprar, sin stock, sin financiación.

## Integración con dispositivos

Nuevo componente `CompatibleAccessoriesSection` en `ModelPage.tsx`.
Muestra hasta 4 accesorios ordenados por: exacto con el modelo →
familia → orden estable. Encabezado "Accesorios compatibles" + enlace
"Ver todos los accesorios ›". Cada tarjeta enlaza a la ficha.

## Integración con el buscador

`src/data/searchIndex.ts`:

- Se retiran `demo:apple-usb-c-cable`, `demo:apple-usb-c-adapter`,
  `demo:apple-airpods-tips`, `demo:apple-magsafe`,
  `demo:apple-watch-band`.
- Nueva función `accessoryItems()` genera `SearchItem` desde
  `appleAccessories` con `kind: 'apple-accessory'`, `brand: 'Apple'`,
  `source: 'catalog'`, `demo: false`, `route: accessoryPath(slug)`,
  `image`, `aliases` (incluye el nombre lowercased), `keywords`,
  `relatedTo` y `compatibleWith` derivadas de la compatibilidad
  estructurada.
- `buildSearchIndex()` inserta los accesorios entre los dispositivos
  y las entradas `SEARCH_DEMO_ITEMS` (terceros). El algoritmo de
  ranking no se modifica.

Al buscar:

- **AirPods** → Dispositivos primero, después accesorios Apple
  verificados relacionados por familia, después demos de terceros.
  `Almohadillas para AirPods Pro` no aparece.
- **cargador** → Adaptadores USB-C y MagSafe primero (con ruta a
  `/accesorios/…`). No aparecen dispositivos por mencionar batería.
- **funda iPhone 17 Pro** → Funda trenzado técnico exacta arriba.
- **Apple Pencil** → Pro y USB-C como fichas separadas.
- **correa Watch** → Correa deportiva oficial visible.

## Accesibilidad

- Filtros: `role="radiogroup"` + `role="radio"` con `aria-checked`,
  `min-h-[44px]` para objetivo táctil.
- Ficha: variantes `role="radiogroup"` + swatch decorativo con
  `aria-hidden`.
- Enlaces con nombre visible; sin `aria-hidden` sobre contenido
  interactivo.
- axe pasa sin violaciones en `/accesorios` y `/accesorios/apple-pencil-pro`.
- 375 px sin scroll horizontal.

## Pruebas

`tests/e2e/accessories.spec.ts` (22 tests, chromium + móvil):

1. Catálogo — encabezado, filtros, tarjetas, sin CTA Comprar.
2. Filtros por categoría filtran y "Limpiar" restaura.
3. Filtro AirTag muestra solo AirTag.
4-8. Fichas de 5 accesorios (MagSafe, Pencil Pro, Magic Mouse,
    correa Watch, AirTag).
9. Imágenes del catálogo cargan con `naturalWidth > 0` y `alt` no vacío.
10. Variantes de Magic Mouse cambian el `alt`.
11. iPhone 17 Pro — funda exacta, no la de Pro Max.
12. iPad Pro — Apple Pencil o Magic Keyboard correctos.
13. Buscar AirPods — dispositivos primero, sin almohadillas oficial.
14. Buscar cargador — MagSafe/Adaptador primero.
15. Buscar funda iPhone 17 Pro — funda exacta.
16. Buscar Apple Pencil — Pro y USB-C separados.
17. Buscar correa Watch — correa oficial visible.
18. Home — enlace Accesorios → /accesorios.
19. Header — acceso rápido Accesorios → /accesorios.
20-21. axe /accesorios y /accesorios/apple-pencil-pro.
22. 375 px sin scroll horizontal en /accesorios.

Endurecido: `tests/e2e/home.spec.ts` "enlaces de accesorios" ahora
exige `/accesorios$` en el destino, no `/buscar?q=fundas`.

Suite completa: **179/179** (156 → 179).

## Restricciones respetadas

- `src/lib/store.tsx` intacto.
- Sin cambios en carrito, checkout, seguro (`INSURANCE_PRICE`,
  `insurancePrice`, `cartInsuranceTotal`, `setLineInsurance`), Plan
  Renove, Servicio Técnico, tienda favorita, favoritos+avisos,
  inventario, comparador, recomendador, catálogo de dispositivos,
  precios de dispositivos, imágenes de dispositivos, workflows,
  Node, GitHub Pages.
- Sin dependencias nuevas, sin backend, sin IA real.

## Limitaciones reales

- Precios observados en Banana/Apple en la fecha de verificación,
  marcados siempre como "Precio demostrativo". Sin garantía de
  vigencia.
- Sin acceso al inventario real de Banana: la disponibilidad se
  presenta como "Producto mostrado públicamente por Banana" o
  "Disponibilidad pendiente de validación".
- 8 ilustraciones SVG bespoke sustituyen fotografías donde el asset
  oficial no estaba accesible desde el CDN público de Apple. Deben
  reemplazarse por fotos propias con derechos si Banana las aporta.
- Sin integración con carrito, checkout, favoritos, comparador ni
  seguro (fuera del alcance de esta PR).

## Datos que necesitaríamos de Banana para v2

- Lista canónica de SKUs con presencia real en tienda.
- Precios oficiales y promociones vigentes.
- Fotos propias con derechos de uso web para reemplazar las
  ilustraciones bespoke.
- Compatibilidad detallada por familia, generación y variante.
- Estados de disponibilidad reales (Disponible / Bajo pedido /
  Agotado).
- Política sobre catálogo de terceros: qué marcas y qué productos
  entrarían como catálogo real (hoy siguen siendo "Contenido
  demostrativo").
