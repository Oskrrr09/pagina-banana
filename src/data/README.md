# src/data — Cómo modificar la web

Este directorio es la **fuente de verdad de los datos** del prototipo:
dispositivos, accesorios, tiendas, textos y configuración. Cambiar un
producto o un precio se hace aquí, no en los componentes.

## Mapa rápido

```
src/data/
├── config.ts               ← constantes globales (INSURANCE_PRICE, disclaimers, marca)
├── types.ts                ← tipos base (Model, ColorVariant, CapacityOption, Family)
├── repositories.ts         ← ProductRepository / AccessoryRepository (swap point para API real)
│
├── products/               ← catálogo de dispositivos, uno por familia
│   ├── index.ts            ← barrel: exporta families, allModels, getModel, etc.
│   ├── _shared.ts          ← helpers internos (buildColors, IMG, CapSpec)
│   ├── iphone.ts           ← iphoneModels
│   ├── mac.ts              ← macModels
│   ├── ipad.ts             ← ipadModels
│   ├── watch.ts            ← watchModels
│   └── airpods.ts          ← airpodsModels
│
├── accessories/            ← catálogo de accesorios, uno por categoría
│   ├── index.ts            ← barrel: exporta appleAccessories + tipos + helpers
│   ├── _shared.ts          ← tipos (Accessory, AccessoryCategory, …) + VERIFIED_ON
│   ├── carga.ts            ← cargaAccessories
│   ├── iphone.ts           ← iphoneAccessories
│   ├── ipad.ts             ← ipadAccessories
│   ├── mac.ts              ← macAccessories
│   ├── watch.ts            ← watchAccessories
│   └── airtag.ts           ← airtagAccessories
│
├── content.ts              ← servicios, ventajas, FAQ, temas de soporte
├── nav.ts                  ← estructura de navegación (Header, mega-menú, móvil)
├── stores.ts               ← tiendas físicas de Canarias
├── searchIndex.ts          ← ítems del buscador (auto: se derivan de products + accessories)
├── productDecisionData.ts  ← recomendador "Encuentra tu Apple" (usa searchIndex)
└── demoStoreInventory.ts   ← existencias demostrativas por tienda
```

Y para las imágenes:

```
public/img/
├── products/       ← .webp de dispositivos, uno por modelo+color
└── accessories/    ← .jpg de accesorios, uno por producto+variante
```

---

## Recetas

Todas asumen que trabajas en una rama y abres una PR después.

### 1. Cambiar el precio de un modelo existente

1. Abre el archivo de la familia: `src/data/products/{iphone|mac|ipad|watch|airpods}.ts`.
2. Localiza el modelo por su `slug`.
3. Cambia el número dentro de `caps: [ ['<capacidad>', <precio>], … ]`.

Ejemplo: bajar el iPhone 17 256 GB a 899 €.

```ts
// src/data/products/iphone.ts
{ slug: '17', family: 'iphone', name: 'iPhone 17', …,
  colors: buildColors([
    { slug: 'lavanda', name: 'Lavanda', hex: '#b7a7d6',
      image: `${IMG}/17-lavanda.webp`,
-     caps: [['256GB', 959, 1099], ['512GB', 1209]] },
+     caps: [['256GB', 899, 1099], ['512GB', 1209]] },
    …
  ]),
}
```

El `1099` de la derecha es el precio anterior (aparece tachado como oferta). Pon `null` si no quieres mostrar oferta.

### 2. Añadir un color nuevo a un modelo existente

1. Añade la foto a `public/img/products/` con nombre estable (ej. `air-verde.webp`).
2. Añade un objeto dentro del array `colors`:

```ts
{ slug: 'verde', name: 'Verde menta', hex: '#a5c9a8',
  image: `${IMG}/air-verde.webp`,
  caps: [['256GB', 1099], ['512GB', 1349], ['1TB', 1599]] },
```

El `hex` se usa para el círculo de color en el selector. El `slug` es el que aparece en la URL de la variante.

### 3. Añadir un modelo nuevo

1. Añade las fotos de todos sus colores a `public/img/products/`.
2. En el archivo de la familia, añade un objeto al array (`iphoneModels`, `macModels`, …):

```ts
{
  slug: 'iphone-17e',
  family: 'iphone',
  name: 'iPhone 17e',
  tagline: 'La opción más accesible.',
  fromPrice: 649,
  financeFrom: { monthly: 27, months: 24 },
  colors: buildColors([
    { slug: 'blanco', name: 'Blanco', hex: '#ececec',
      image: `${IMG}/17e-blanco.webp`,
      caps: [['128GB', 649], ['256GB', 799]] },
  ]),
  specs: iphoneSpecs('A18', 'Super Retina 6,1"'),
  highlights: ['Chip A18', '128 GB o 256 GB', 'Pantalla Super Retina'],
},
```

Que aparezca en el mega-menú y en la home es automático: los archivos `nav.ts` y `Home.tsx` leen de `modelsByFamily`.

### 4. Retirar un modelo

Bórralo del array o coméntalo con una nota explicativa. El buscador y el
comparador dejarán de mostrarlo automáticamente.

### 5. Añadir un accesorio nuevo

1. Añade la foto a `public/img/accessories/` (JPEG preferido, 1200×1200,
   fondo blanco de fábrica).
2. Elige la categoría: `carga | iphone | ipad | mac | apple-watch | airtag`
   y abre `src/data/accessories/<categoria>.ts`.
3. Añade un objeto al array. Mínimo:

```ts
{
  slug: 'nuevo-accesorio',
  name: 'Nombre visible del accesorio',
  brand: 'Apple',
  category: 'carga', // debe coincidir con el archivo
  tagline: 'Frase corta que aparece en la tarjeta.',
  description: 'Descripción larga que aparece en la ficha.',
  price: 39,                       // null si no hay precio verificado
  image: `${IMG}/nuevo-accesorio.jpg`,
  variants: [
    { slug: 'unico', label: 'Único', image: `${IMG}/nuevo-accesorio.jpg` },
  ],
  specs: [
    { label: 'Referencia Apple', value: 'MXX00ZM/A' },
  ],
  highlights: ['Punto clave 1', 'Punto clave 2'],
  compatibility: {
    families: ['iphone'],        // o
    models: ['iphone/17-pro'],   // exactos, usa 'familia/slug' del catálogo
  },
  aliases: ['nombre alternativo'],
  keywords: ['palabra', 'clave', 'para', 'buscador'],
  bananaSource: 'https://tienda.bananacomputer.com/...',
  verifiedOn: VERIFIED_ON,       // constante compartida
  availabilityLabel: 'Producto mostrado públicamente por Banana',
  provisionalTags: ['Precio demostrativo'],
},
```

Automáticamente aparece en `/accesorios`, en el buscador (`kind: 'apple-accessory'`), y en las fichas de dispositivo compatibles.

### 6. Añadir una variante de color a un accesorio existente

En el array `variants` del accesorio:

```ts
variants: [
  { slug: 'blanco', label: 'Blanco', image: `${IMG}/mouse-blanco.jpg`, swatch: '#f2f2f7', price: 85 },
+ { slug: 'negro',  label: 'Negro',  image: `${IMG}/mouse-negro.jpg`,  swatch: '#1d1d1f', price: 119 },
],
```

Requisitos:
- Cada variante debe tener **su propia foto**. No reutilices la imagen de otro color.
- El `swatch` (hex) se muestra en el selector de la ficha.
- El `price` por variante es opcional; si falta, cae al `price` general.

### 7. Retirar temporalmente un accesorio

Sustituye el objeto por un comentario que explique por qué se retira. Ejemplo del catálogo actual:

```ts
// Cable Thunderbolt 4 Pro (USB-C) 1,8 m — RETIRADO temporalmente
// (PR fix/accessory-images-round-2): no fue posible obtener una
// fotografía oficial legítima desde el CDN público de Apple.
```

Automáticamente desaparece de `/accesorios`, del buscador y de la sección "Complementa tu compra" de cualquier dispositivo. Si alguien intenta abrir su antigua ruta directa `/accesorios/<slug>`, se le redirige a `/accesorios`.

### 8. Añadir una tienda física

`src/data/stores.ts` — añade un objeto al array `stores`:

```ts
{
  slug: 'banana-lanzarote',
  name: 'Banana Arrecife',
  island: 'Lanzarote',
  address: 'Calle Real, 12 · Arrecife',
  coords: { lat: 28.963, lng: -13.548 },
  mapQuery: 'Banana Computer Arrecife Lanzarote',
  hours: [
    { day: 'Lun-Sáb', time: '10:00–20:30' },
  ],
  hoursSource: 'Google Maps',
  hoursVerifiedOn: '2026-07-30',
  services: ['Tienda', 'Servicio técnico'],
},
```

### 9. Cambiar el precio del seguro

`src/lib/store.tsx` — cambia la constante `INSURANCE_PRICE`. El nuevo
valor se propaga a carrito, checkout y ficha de dispositivo. `config.ts`
lo re-exporta, así que también podrás importarlo desde ahí.

### 10. Cambiar un texto legal reutilizable

`src/data/config.ts`:

```ts
export const PRICE_DEMO_LABEL = 'Precio demostrativo'
export const AVAILABILITY_PENDING_LABEL = 'Disponibilidad pendiente de validación'
```

Cámbialo y todos los sitios que lo importen se actualizan.

### 11. Cambiar el nº máximo de dispositivos en el comparador

`src/data/config.ts` → `MAX_COMPARE` (y también la constante local dentro de `store.tsx`, que hoy vive en el propio archivo por historia).

### 12. Añadir una entrada de servicio o de FAQ

`src/data/content.ts`. La estructura es autodescriptiva.

---

## Cuando llegue la API real de Banana

Cuando Banana os pase su API/inventario real, **el único cambio necesario** es en
`src/data/repositories.ts`:

```ts
// Nueva implementación
class ApiProductRepository implements ProductRepository {
  async listAll(): Promise<Model[]> { … fetch a la API … }
  // …
}

// Sustituir el default:
export const productRepo: ProductRepository = new ApiProductRepository()
```

Toda la UI, tests y el resto del código siguen sin cambios porque consumen
la interfaz `ProductRepository`, no los arrays directamente. Los helpers
`getModel`, `productImage`, etc. pueden mantenerse como envoltorios de
compatibilidad o migrarse gradualmente.

---

## Reglas de oro

1. **Nunca** poner un precio o un texto legal a mano dentro de un componente
   JSX. Todo va a `src/data/`.
2. **Nunca** mezclar datos de dispositivo con datos de accesorio: son tipos
   distintos y viven en carpetas distintas.
3. Cada imagen en `public/img/**` tiene que estar referenciada desde algún
   objeto del catálogo. Si no, bórrala (evita builds infladas).
4. Los precios del prototipo siempre llevan etiqueta "Precio demostrativo".
   No la quites hasta que Banana valide precios reales.
5. Cambiar `compatibility.models` de un accesorio sin actualizar los tests
   de compatibilidad exacta va a romper `tests/e2e/accessories.spec.ts`.
   Corre `npm run test:e2e` antes de hacer commit.
