---
tipo: sesion
fecha: 2026-07-30
tema: corrección visual del catálogo de accesorios
---

# Corrección visual del catálogo de accesorios

## Problema original

La primera oleada (PR #27) dejó tres problemas serios:

1. **8 ilustraciones SVG bespoke** en lugar de fotografías reales:
   adaptador USB-C 30 W, cable USB-C 240 W, cable Thunderbolt 4 Pro,
   funda MagSafe iPhone Air, Magic Keyboard iPad Pro 11" M4, correa
   deportiva Watch 46 mm, AirTag individual y pack de 4. El
   `docs/catalogo-accesorios-apple.md` las presentaba como
   "Ilustración del prototipo", pero la UI las mostraba con la misma
   jerarquía visual que las fotos oficiales — riesgo real de que el
   visitante interpretara la ilustración como fotografía del producto.
2. **Magic Mouse y Magic Trackpad** con variantes duplicadas: el mismo
   archivo se usaba para "blanco" y "negro"; además la variante
   "blanca" del Magic Trackpad usaba en realidad la foto del Magic
   Mouse blanco (el SKU MXK53 corresponde al Magic Mouse blanco, no
   al Trackpad).
3. **Buscador con desequilibrio visual**: los dispositivos aparecían
   con `ProductCard` (imagen grande), pero los accesorios aparecían
   como texto compacto sin fotografía, pese a que `item.image` ya
   estaba disponible en el índice del buscador.

Adicional:

4. Padding excesivo (`p-6` en tarjetas, `p-8` en fichas) que hacía
   ver los productos diminutos.
5. Tests que solo verificaban `naturalWidth > 0` pero no detectaban
   variantes duplicadas ni ilustraciones inventadas.

## Trabajo

### Imágenes reales

- Descargadas 8 nuevas fotografías desde el CDN público de Apple
  (`store.storeimages.cdn-apple.com`) para los productos SVG-inventado.
- Añadidas 4 nuevas variantes visuales (Magic Mouse blanco MXK53,
  Magic Mouse negro MXK63, Magic Trackpad blanco MXK93, Magic
  Trackpad negro MXKA3).
- Retirados los 8 SVG y los archivos genéricos ambiguos
  `magic-mouse.jpg` / `magic-trackpad.jpg`.
- Total: **24 archivos JPEG 1200×1200**, todos en
  `public/img/accessories/`, con fuente documentada en
  `docs/fuentes-imagenes-accesorios.md`.

### `Accessory.imagePresentation`

Configuración visual tipada y limitada:

```ts
interface AccessoryImagePresentation {
  fit?: 'contain' | 'cover'
  scale?: 0.85 | 0.9 | 1 | 1.05 | 1.1 | 1.15 | 1.2
  position?: 'top' | 'center' | 'bottom'
  padding?: 'none' | 'compact' | 'default'
  background?: 'neutral' | 'white' | 'transparent'
}
```

Ejemplo: `{ scale: 1.1, padding: 'compact' }` en los adaptadores 20W
y 30W para que no parezcan diminutos dentro del cuadrado. Los datos
no contienen clases Tailwind arbitrarias.

### Nuevo componente `AccessoryImage`

Centraliza fondo, padding, fit, escala, posición y `object-fit`.
Reemplaza el `<img className="object-contain p-6/p-8/p-4">` disperso
que existía en tres pantallas (`AccessoryCard`,
`AccessoryDetailPage`, sección "Accesorios compatibles" de
`ModelPage`).

### `AccessorySearchCard` en /buscar

Nueva tarjeta visual para la sección "Accesorios Apple" que muestra
fotografía + nombre + marca + categoría + compatibilidad resumida +
precio demostrativo. `SearchPage` pinta ahora accesorios reales con
`AccessoryVisualGrid` y usa `CompactSearchCard` solo como fallback
para los ítems demostrativos de terceros. `ExactMatchCard` también
usa la nueva tarjeta cuando el match exacto es un accesorio real.

### Miniatura en Header

`SuggestionRow` de `HeaderSearch` muestra un thumbnail 44×44 px
cuando el ítem tiene `image` y no es demo. Se preserva:

- `role="combobox"` y `role="listbox"`.
- `aria-activedescendant` (solo si `activeIndex >= 0`).
- ArrowUp/Down / Enter directo / Enter con selección / Escape.
- Restauración de foco a la lupa.
- Alt vacío (el label del botón ya dice el nombre).

## Casos verificados

- **`/buscar?q=iPhone`**: la sección "Accesorios Apple" contiene
  ahora enlaces a `/accesorios/…` con `<img src=".../img/accessories/...">`
  y `naturalWidth > 0`.
- **`/buscar?q=cargador`**: adaptadores y MagSafe aparecen con
  fotografía. Ninguna tarjeta lleva "Contenido demostrativo".
- **`/buscar?q=Apple Pencil`**: Pro y USB-C tienen `src` distinto.
- **Header + "MagSafe"**: la sugerencia real muestra la miniatura.
- **Header + "iPhone" + Enter**: sigue navegando a `/buscar?q=iPhone`
  (Enter directo intacto).
- **Magic Mouse ficha**: blanco y negro tienen imágenes distintas
  (se comprueba `srcBlack !== srcWhite`).
- **Magic Trackpad ficha**: ídem.
- **`/accesorios`**: 20 tarjetas, todas con fotografía. Cada
  contenedor de imagen mide al menos 140×140.

## Productos retirados

Ninguno. Se pudo obtener una fotografía real para los 20 accesorios
que estaban en el catálogo.

## Variantes retiradas

Ninguna. Las 4 variantes duplicadas de Mouse/Trackpad se corrigieron
con 4 fotos distintas en vez de retirar.

## Tests

10 nuevos en `accessories.spec.ts` (bloque "PR correctiva"):

1. Ningún `<img>` de accesorio real termina en `.svg` ni contiene
   "placeholder".
2. Todas las imágenes cargan (`naturalWidth > 0` y `naturalHeight > 0`),
   `src` pertenece a `/img/accessories/`, alt no vacío, sin
   `apple.com` ni `cdn-apple` en el src (no hotlinking).
3. Magic Mouse: `srcBlack !== srcWhite`.
4. Magic Trackpad: `srcBlack !== srcWhite`.
5. `/buscar?q=iPhone`: sección Accesorios Apple con enlaces
   `/accesorios/` que contienen `<img>` con `src` local y
   `naturalWidth > 0`.
6. `/buscar?q=cargador`: enlaces con imagen; 0 badges "Contenido
   demostrativo" en esa sección.
7. `/buscar?q=Apple Pencil`: Pro y USB-C con `src` distinto.
8. Header con "MagSafe": la opción real contiene `<img>` con
   `src` local y `naturalWidth > 0`.
9. Header con "iPhone" + Enter: URL `/buscar?q=iPhone$`.
10. `/accesorios`: contenedor de imagen ≥ 140×140 px.
11. Guardia "0 SVG" en `/accesorios`.

Endurecidos: los tests históricos de variantes Magic Mouse ahora
exigen `src` distinto, no solo cambio de `alt`.

Suite completa: **189/189** (179 → 189).

## Revisión visual

Se comprobó vía Playwright headless: alturas de imagen, presencia
de `<img>` en todas las secciones esperadas y ausencia de SVG en el
DOM renderizado. **No se realizó revisión visual con navegador
gráfico**; la PR queda abierta para que la persona que la revisa
inspeccione visualmente `/accesorios`, cinco fichas, `/buscar?q=iPhone`
y `/buscar?q=cargador`. Esta PR NO se debe fusionar automáticamente.

## Limitaciones reales

- No se puede afirmar con 100 % de certeza que cada archivo del CDN
  corresponda exactamente a la variante etiquetada — la asignación
  depende de la ficha oficial de Apple España, cuya URL sí está
  documentada.
- Sin fotos propias de Banana: si algún producto tiene variantes de
  color específicas de Banana no cubiertas por el catálogo oficial
  de Apple, no se representan.
- El motor de búsqueda no filtra por disponibilidad — todos los
  accesorios aparecen aunque el prototipo no puede saber si están
  agotados.

## Archivos modificados

- `src/data/accessories.ts` — `AccessoryImagePresentation`; refs a
  JPG en vez de SVG; variantes distintas para Mouse/Trackpad;
  `imagePresentation` para adaptadores; sin `imageBg` redundante.
- `src/components/product/AccessoryImage.tsx` — nuevo helper.
- `src/components/product/AccessoryCard.tsx` — usa AccessoryImage.
- `src/pages/AccessoryDetailPage.tsx` — usa AccessoryImage.
- `src/pages/ModelPage.tsx` — sección "Accesorios compatibles" usa
  AccessoryImage.
- `src/components/search/AccessorySearchCard.tsx` — nuevo.
- `src/pages/SearchPage.tsx` — AccessoryVisualGrid + ExactMatchCard
  para accesorios reales.
- `src/components/search/HeaderSearch.tsx` — miniatura en
  SuggestionRow.
- `public/img/accessories/` — 8 SVG eliminados, 12 JPG nuevos.
- `tests/e2e/accessories.spec.ts` — 10 tests nuevos + 2 endurecidos.
- `docs/auditoria-visual-accesorios.md` — nuevo.
- `docs/fuentes-imagenes-accesorios.md` — reescrito.
- `docs/catalogo-accesorios-apple.md` — banner de actualización.
- `docs/05-registro-de-cambios.md` — nueva entrada + PR #27
  actualizada.
- Esta nota.
