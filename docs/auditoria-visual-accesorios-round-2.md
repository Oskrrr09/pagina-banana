---
tipo: auditoria
actualizado: 2026-07-30
tema: segunda auditoría visual del catálogo de accesorios
---

# Segunda auditoría visual — Catálogo de accesorios

PR correctiva `fix/accessory-images-round-2` sobre PR #28 (merge
`001d0b1`).

## Metodología

Se abrieron **una a una** todas las imágenes de `public/img/accessories/`
con `Read` (vista real del archivo). No se confió en los nombres. Se
verificó producto, variante y ausencia de placeholder o marca ajena.

## Hallazgos

| Archivo (antes) | Contenido real observado | Producto declarado | Decisión |
|---|---|---|---|
| `thunderbolt-4-pro-cable-1_8m.jpg` | **Correa Hermès amarilla** | Cable Thunderbolt 4 Pro | **Retirar producto** — no se localizó fotografía legítima |
| `airtag-single.jpg` | **4 AirTags juntos** | AirTag individual | Sustituir por SKU MX532 (AirTag individual real) |
| `airtag-4pack.jpg` | **Llavero de cuero marrón** | AirTag pack de 4 | Sustituir por SKU MX542 (pack de 4 real) |
| `apple-pencil-tips-4pack.jpg` | **Adaptador USB-C AV digital** | Puntas Apple Pencil | Sustituir por SKU MLUN2 (puntas reales) |
| `magsafe-charger-2m.jpg` | **Funda silicona iPhone negra** | MagSafe 2 m | Sustituir por SKU MGDM4 (MagSafe 2 m real) |
| `magic-keyboard-usb-c.jpg` | **Magic Keyboard Touch ID + numérico blanco** | Magic Keyboard USB-C básico | Renombrar a variante blanca del Touch ID + numérico; **retirar** producto "Magic Keyboard (USB-C) básico" |
| `iphone-air-magsafe-case.jpg` | **Funda transparente iPhone 16e** (cámara con dos círculos pequeños) | Funda MagSafe iPhone Air | **Retirar producto** — SKU MGH34 sirve una funda que no es la del iPhone Air |
| `iphone-17-silicone-case-guayaba.jpg` | Funda silicona pink coral con plateau vertical (iPhone 17) | Funda silicona iPhone 17 guayaba | Conservar |

## Otras imágenes verificadas OK

- `apple-20w-usb-c-adapter.jpg` ✅ (adaptador USB-C EU blanco)
- `apple-30w-usb-c-adapter.jpg` ✅ (adaptador USB-C 30 W)
- `magsafe-charger-1m.jpg` ✅ (MagSafe redondo con cable)
- `usb-c-cable-240w-2m.jpg` ✅ (cable trenzado blanco USB-C 2 m)
- `apple-pencil-pro.jpg` ✅ (Pencil Pro con logo)
- `apple-pencil-usb-c.jpg` ✅ (Pencil USB-C sin logo Pro)
- `iphone-17-pro-braided-technical-case-blue.jpg` ✅ (funda trenzada azul)
- `iphone-crossbody-strap-guayaba.jpg` ✅ (correa cruzada rosa)
- `magic-mouse-white.jpg` ✅ (mouse blanco)
- `magic-mouse-black.jpg` ✅ (mouse negro)
- `magic-trackpad-white.jpg` ✅ (trackpad blanco)
- `magic-trackpad-black.jpg` ✅ (trackpad negro)
- `magic-keyboard-touch-id-numeric.jpg` ✅ (teclado TID+numérico negro)
- `magic-keyboard-ipad-pro-11-m4.jpg` ✅ (Magic Keyboard iPad Pro con trackpad)
- `watch-fast-charge-cable-usb-c-1m.jpg` ✅ (cable Watch magnético)
- `watch-sport-band-46mm-guayaba.jpg` ✅ (correa deportiva rosa)

## Nuevas descargas

| Producto | SKU nuevo | Verificado visualmente |
|---|---|---|
| AirTag individual | `MX532` | ✅ |
| AirTag pack de 4 | `MX542` (renombrado) | ✅ |
| Puntas Apple Pencil | `MLUN2` | ✅ |
| Cargador MagSafe 2 m | `MGDM4` | ✅ |

## Productos retirados

1. **Cable Thunderbolt 4 Pro (USB-C) 1,8 m** — SKU MWP73 en apple.com/es
   sirve una correa Hermès en el CDN público. HR7S2 (imagen aparente
   del PDP) es una base Belkin. Sin fotografía verificable.
2. **Funda con MagSafe para el iPhone Air** — SKU MGH34 en apple.com/es
   sirve una funda transparente para lo que parece un iPhone 16e
   (cámaras redondas), no el iPhone Air (barra horizontal de cámaras).
3. **Magic Keyboard (USB-C) básico** — SKU MXK73Y en apple.com/es sirve
   la variante Touch ID + numérico blanca, no el modelo compacto sin
   Touch ID. Se recicla la imagen como segunda variante del Touch ID +
   numérico (junto al negro MXK83Y).

Los tres se pueden volver a añadir cuando exista una fotografía
verificada del producto correcto.

## Cambios estructurales

- `Magic Keyboard con Touch ID y teclado numérico (USB-C)` pasa de 1 a
  2 variantes: **blanco** (`MXK73Y`, 199 €) y **negro** (`MXK83Y`,
  229 €). Ambos tienen `src` distinto.
- Se retira el archivo `iphone-air-magsafe-case.jpg` del repositorio.
- Se retira el archivo `thunderbolt-4-pro-cable-1_8m.jpg` del repositorio.
- Se renombra `magic-keyboard-usb-c.jpg` → `magic-keyboard-touch-id-numeric-white.jpg`.

## Total

- **19 productos** en el catálogo (antes 20).
- **22 archivos JPEG** en `public/img/accessories/` (antes 24).
- Todos con SKU y URL Apple documentados. Cero SVG bespoke. Cero
  hotlinking.
