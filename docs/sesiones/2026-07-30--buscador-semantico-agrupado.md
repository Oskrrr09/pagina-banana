---
tipo: sesion
fecha: 2026-07-30
tema: buscador inteligente por secciones (motor + índice + Header + /buscar)
---

# Buscador semántico agrupado

## Problema del buscador anterior

`SearchPage` filtraba con `Array.filter` sobre nombre y tagline. El
Header desplegaba en escritorio un input vacío sin resultados en vivo,
y en móvil pintaba el catálogo completo como sugerencia estática. Ni
Header ni `/buscar` compartían la lógica.

Consecuencias observables:

- Buscar "AirPods" mezclaba dispositivos AirPods con cualquier
  accesorio o texto que contuviese "AirPods". Sin secciones.
- Sin corrección: "airpds" devolvía 0 resultados.
- Sin sinónimos: "cascos" o "air pods" no encontraban AirPods.
- Sin intención: buscar "funda AirPods" traía AirPods primero.
- Cargador → cualquier producto cuyo tagline mencionara batería.
- El Header no permitía teclado ni tenía patrón combobox.

## Arquitectura

Dos archivos nuevos + rediseño de dos existentes:

1. `src/data/searchIndex.ts` — tipos + índice + sinónimos + datos
   demostrativos.
2. `src/lib/catalogSearch.ts` — motor determinista puro (normalización,
   tokenización, intención, fuzzy, scoring, agrupación).
3. `src/pages/SearchPage.tsx` — usa `searchCatalog`. Pinta secciones.
   Estado vacío completo con asistente y soporte.
4. `src/components/layout/Header.tsx` — sustituye input escritorio y
   overlay móvil por `HeaderSearch`.
5. `src/components/search/HeaderSearch.tsx` — autocompletado
   compartido con combobox accesible.
6. `src/components/search/SearchResultCards.tsx` — tarjeta compacta y
   encabezado de sección con conteo.

### `SearchItem`

```ts
type SearchItemKind =
  | 'apple-family' | 'apple-device' | 'apple-accessory'
  | 'related-product' | 'compatible-accessory'
  | 'service' | 'help'
```

Campos: `id`, `kind`, `name`, `description?`, `brand?`, `family?`,
`category?`, `aliases?`, `keywords?`, `relatedTo?`, `compatibleWith?`,
`route?`, `image?`, `demo?`, `source`.

### Normalización

`normalizeSearchText`: `toLowerCase` + `NFD` + eliminar combining
marks (tildes) + normalizar guiones tipográficos + limpiar puntuación
+ colapsar espacios. No filtra números.

### Sinónimos

`SEARCH_SYNONYMS`: diccionario pequeño y explícito (~25 entradas).
Multi-palabra ("air pods") se aplica antes de tokenizar. Single-word
tras split. No transforma "trabajo" en Mac ni cosas similares —
respeta intención de compra.

### Fuzzy matching

Levenshtein propio. Umbrales por longitud: <=4 → 0, 5..7 → 1, >=8 →
2. Solo se aplica sobre nombres y alias, no sobre descripciones
largas.

### Intención

`inferSearchIntent`: mira los tokens. Si hay una palabra de
`ACCESSORY_INTENT_WORDS` → `accessory`. Si hay una de
`SERVICE_INTENT_WORDS` → `service`. Si no, `device`.

### Puntuación

Escala documentada en `catalogSearch.ts`. Prioridad:

1. Exacto en nombre — 1000.
2. Exacto en alias — 950.
3. Empieza por consulta — 700.
4. Todos los tokens en el nombre — 500.
5. Familia/categoría exacta — 400.
6. Palabras clave fuertes — 250 + 10 por token.
7. Producto relacionado por categoría — 160.
8. Accesorio compatible con familia buscada — 120 (+20 si Apple).
9. Solo en descripción — 60.
10. Ayuda sin match fuerte — máx 30.

Fuzzy penaliza 40 puntos respecto al mismo match sin distancia.

### Desempates

`compareScored`: score desc → sección según intención → marca Apple
gana → orden estable. Nunca alfabético.

### Secciones

Fijas en el resultado: `exactMatch`, `appleDevices`, `relatedProducts`,
`appleAccessories`, `compatibleAccessories`, `services`, `help`. El
orden visual en `/buscar` cambia según intención:

- `device` (por defecto): Coincidencia principal → Dispositivos →
  Relacionados → Acc Apple → Acc compatibles → Servicios → Ayuda.
- `accessory`: Coincidencia principal → Acc Apple → Acc compatibles →
  Dispositivos → Relacionados → Servicios → Ayuda.

### Contenido demostrativo

`SEARCH_DEMO_ITEMS` (14 entradas). Marcados con `demo: true`. Fuera
de `products.ts`. Sin precio, stock, financiación, ni CTA de compra.
La UI pinta `ProvisionalBadge label="Contenido demostrativo"`.

Cuando un ítem no tiene `route`, la UI renderiza una tarjeta
informativa sin enlace. No se inventan URLs.

## Header

`HeaderSearch` es reutilizado por dos padres: contenedor `hidden
xl:block` para escritorio y `xl:hidden` overlay pantalla completa
para móvil. Ambos comparten la misma lógica.

### Escritorio

- Al abrir la lupa, `HeaderSearch` monta con `autoFocus` en el input.
- Con `<2` caracteres: accesos rápidos (iPhone, Mac, iPad, Apple
  Watch, AirPods, Accesorios).
- Con `>=2` caracteres: `limitSearchResults` a máximos (4/3/3/3/3/3)
  → panel agrupado por sección con `role="listbox"` +
  `role="option"`.
- ↓/↑ mueven `activeIndex`. Enter navega. Escape cierra y devuelve
  foco a la lupa (`restoreFocusTo`).
- Al final: "Ver todos los resultados para «…»" → `/buscar?q=…`.

### Móvil

Mismo componente con `mode="mobile"`. Bloquea scroll de fondo (el
Header ya lo hace desde antes). Restaura foco al botón lupa móvil al
cerrar.

## Accesibilidad

- Combobox accesible: `role="combobox"`, `aria-expanded`,
  `aria-controls`, `aria-owns`, `aria-haspopup="listbox"`,
  `aria-autocomplete="list"`, `aria-activedescendant`.
- Lista con `role="listbox"` y nombre accesible.
- Opciones con `aria-selected`. Objetivo táctil `min-h-[44px]`.
- Foco visible por defecto de Tailwind + `outline-none` solo donde
  se pinta un anillo alternativo.
- `/buscar` añade un `<h1>` visible con `sr-only` para satisfacer
  `page-has-heading-one`.
- axe sin violaciones en `/buscar?q=AirPods` y en el estado vacío.

## Pruebas

`tests/e2e/search.spec.ts` (20 escenarios):

- `input se sincroniza con q` (histórico).
- `accesorios en la portada abren /buscar` (histórico).
- **Ranking**: AirPods → Dispositivos antes que Accesorios y Ayuda;
  sin IDs duplicados.
- **Intención accesorio**: funda AirPods → accesorios antes que
  dispositivos; contenido demostrativo etiquetado; sin botón
  Comprar.
- **Cargador**: Accesorios Apple antes que compatibles; no se cuelan
  dispositivos.
- **Cascos**: AirPods como dispositivo + auriculares de terceros
  como relacionados.
- **Sinónimos**: air pods ≡ airpods.
- **Corrección**: airpds → "Quizá querías decir AirPods".
- **Estado vacío**: mensaje, categorías, asistente, soporte.
- **URL**: q se mantiene, recarga y back/forward sincronizan.
- **Header escritorio**: escribir muestra grupos, no todo el catálogo;
  ↓ + Enter navega; Escape cierra y devuelve foco; "Ver todos".
- **Header móvil**: overlay usa mismo motor; sin scroll horizontal.
- **Axe**: /buscar con y sin resultados.

Suite completa: **141/141** (chromium + mobile). 122 → 141.

## Limitaciones

- El fuzzy matching es simple; consultas muy alejadas no se
  corrigen (por diseño).
- No hay runner unitario. Añadirlo implicaría dependencia nueva y
  quedó fuera del alcance.
- El catálogo demostrativo cubre las categorías mínimas de la
  demo. Ampliar productos relacionados o accesorios reales requiere
  extender `SEARCH_DEMO_ITEMS`.

## Cómo añadir alias o relaciones futuras

1. **Sinónimo nuevo**: añadir entrada a `SEARCH_SYNONYMS` en
   `src/data/searchIndex.ts`.
2. **Ítem demostrativo nuevo**: añadir a `SEARCH_DEMO_ITEMS` con al
   menos `id`, `kind`, `name`, `brand`, `category`, `compatibleWith`,
   `demo: true`, `source: 'demo'`.
3. **Relación categoría-familia**: extender
   `FAMILY_ACCESSORY_CATEGORIES`.
4. **Palabras de intención**: `ACCESSORY_INTENT_WORDS` o
   `SERVICE_INTENT_WORDS`.
5. **Nueva categoría de familia**: ampliar `FAMILY_META`.

## Archivos afectados

- `src/data/searchIndex.ts` — nuevo.
- `src/lib/catalogSearch.ts` — nuevo.
- `src/components/search/HeaderSearch.tsx` — nuevo.
- `src/components/search/SearchResultCards.tsx` — nuevo.
- `src/pages/SearchPage.tsx` — reescrito.
- `src/components/layout/Header.tsx` — sustituye búsqueda escritorio
  y móvil por `HeaderSearch`.
- `tests/e2e/search.spec.ts` — reescrito (20 escenarios).
- `README.md`, `docs/05-registro-de-cambios.md`, esta nota.
