// Datos y utilidades del comparador esencial y del futuro asistente
// "Encuentra tu Apple". Este módulo es la fuente única para:
//   - qué campos son "esenciales" de decisión en cada familia;
//   - qué datos específicos por modelo se muestran en cada fila;
//   - utilidades numéricas para comparar precio, capacidad, peso o pantalla.
//
// Reglas de contenido:
//   - `MODEL_META` recoge datos por `model.slug` — chip, cámara, autonomía,
//     peso, materiales, etc. — con la misma etiqueta demostrativa que el
//     resto del prototipo. No sustituye a `model.specs`, que sigue siendo
//     válido: el comparador consulta primero `MODEL_META[slug]` y, si no
//     hay dato, cae a `model.specs`.
//   - Si un campo no existe ni en `MODEL_META` ni en `model.specs`, se
//     devuelve `null` para que la celda muestre "No especificado" y las
//     filas totalmente vacías se omitan.
//   - Nunca se inventan valores en el punto de uso (extractores puros).

import type { Model } from './types'

export type FamilySlug = 'iphone' | 'mac' | 'ipad' | 'apple-watch' | 'airpods'

// Campos esenciales por familia (versión reducida — máx. 8).
// Regla: son las decisiones más habituales del usuario. Se muestran en la
// vista "Solo diferencias" y en la primera pasada de "Mostrar todas".
export const ESSENTIAL_FIELDS: Record<FamilySlug, readonly string[]> = {
  iphone: [
    'Precio',
    'Pantalla',
    'Chip',
    'Cámara principal',
    'Zoom óptico',
    'Autonomía de vídeo',
    'Peso',
    'Capacidad inicial',
  ],
  mac: [
    'Precio',
    'Chip',
    'CPU / GPU',
    'Memoria unificada',
    'Almacenamiento inicial',
    'Pantalla',
    'Autonomía',
    'Peso',
  ],
  ipad: [
    'Precio',
    'Pantalla',
    'Chip',
    'Apple Pencil',
    'Teclado compatible',
    'Almacenamiento inicial',
    'Peso',
  ],
  'apple-watch': [
    'Precio',
    'Tamaño de caja',
    'Autonomía',
    'Conectividad',
    'Sensores principales',
    'Resistencia',
    'Materiales',
  ],
  airpods: [
    'Precio',
    'Ajuste',
    'Cancelación de ruido',
    'Autonomía',
    'Autonomía con estuche',
    'Controles',
  ],
}

// Campos adicionales que aparecen sólo en la vista "Mostrar todas".
// Se añaden a `ESSENTIAL_FIELDS` en ese orden. Máx. 4 extra por familia para
// no volver a inflar la tabla.
export const EXTENDED_FIELDS: Record<FamilySlug, readonly string[]> = {
  iphone: ['Selfie', 'Materiales', 'Resistencia', 'Puerto', 'Uso recomendado'],
  mac: ['Puertos', 'Cámara', 'Uso recomendado'],
  ipad: ['Cámara trasera', 'Autonomía', 'Uso recomendado'],
  'apple-watch': ['Chip', 'Uso recomendado'],
  airpods: ['Chip', 'Resistencia', 'Uso recomendado'],
}

// Agrupación semántica de filas → sección visible en la tabla.
export const FIELD_SECTIONS: Record<FamilySlug, { title: string; fields: readonly string[] }[]> = {
  iphone: [
    { title: 'Precio', fields: ['Precio'] },
    { title: 'Pantalla y diseño', fields: ['Pantalla', 'Materiales', 'Peso'] },
    { title: 'Rendimiento', fields: ['Chip'] },
    { title: 'Cámara', fields: ['Cámara principal', 'Zoom óptico', 'Selfie'] },
    { title: 'Autonomía y capacidad', fields: ['Autonomía de vídeo', 'Capacidad inicial'] },
    { title: 'Otros', fields: ['Resistencia', 'Puerto', 'Uso recomendado'] },
  ],
  mac: [
    { title: 'Precio', fields: ['Precio'] },
    { title: 'Rendimiento', fields: ['Chip', 'CPU / GPU', 'Memoria unificada', 'Almacenamiento inicial'] },
    { title: 'Pantalla', fields: ['Pantalla'] },
    { title: 'Autonomía y portabilidad', fields: ['Autonomía', 'Peso'] },
    { title: 'Otros', fields: ['Puertos', 'Cámara', 'Uso recomendado'] },
  ],
  ipad: [
    { title: 'Precio', fields: ['Precio'] },
    { title: 'Pantalla y peso', fields: ['Pantalla', 'Peso'] },
    { title: 'Rendimiento y capacidad', fields: ['Chip', 'Almacenamiento inicial'] },
    { title: 'Accesorios', fields: ['Apple Pencil', 'Teclado compatible'] },
    { title: 'Otros', fields: ['Cámara trasera', 'Autonomía', 'Uso recomendado'] },
  ],
  'apple-watch': [
    { title: 'Precio', fields: ['Precio'] },
    { title: 'Diseño', fields: ['Tamaño de caja', 'Materiales'] },
    { title: 'Autonomía y conectividad', fields: ['Autonomía', 'Conectividad'] },
    { title: 'Salud y resistencia', fields: ['Sensores principales', 'Resistencia'] },
    { title: 'Otros', fields: ['Chip', 'Uso recomendado'] },
  ],
  airpods: [
    { title: 'Precio', fields: ['Precio'] },
    { title: 'Ajuste y controles', fields: ['Ajuste', 'Controles'] },
    { title: 'Sonido', fields: ['Cancelación de ruido'] },
    { title: 'Autonomía', fields: ['Autonomía', 'Autonomía con estuche'] },
    { title: 'Otros', fields: ['Chip', 'Resistencia', 'Uso recomendado'] },
  ],
}

// Alias que aceptamos como equivalentes al campo esencial. Nos permite mapear
// etiquetas reales de `model.specs` (que pueden variar por familia) a un mismo
// campo esencial. La comparación se hace en minúsculas y sin acentos.
const FIELD_ALIASES: Record<string, string[]> = {
  Precio: [],
  Pantalla: ['pantalla', 'display', 'tamano de pantalla', 'tamano pantalla'],
  Chip: ['chip', 'procesador'],
  'Cámara principal': ['camara principal', 'camaras', 'sistema de camaras', 'camara'],
  'Zoom óptico': ['zoom optico', 'zoom'],
  Selfie: ['selfie', 'camara frontal', 'frontal'],
  'Autonomía de vídeo': [
    'autonomia de video',
    'autonomia de vídeo',
    'autonomia video',
    'bateria',
    'bateria estimada',
  ],
  Autonomía: ['autonomia', 'bateria', 'bateria estimada', 'duracion bateria'],
  'Autonomía con estuche': ['autonomia con estuche', 'autonomia estuche'],
  Peso: ['peso', 'peso aproximado'],
  Materiales: ['materiales', 'material', 'acabado', 'caja'],
  Resistencia: ['resistencia', 'certificacion', 'ip'],
  Puerto: ['puerto', 'usb', 'usb-c', 'lightning'],
  'Capacidad inicial': ['capacidad', 'almacenamiento', 'almacenamiento inicial'],
  'CPU / GPU': ['cpu', 'gpu', 'cpu y gpu', 'nucleos'],
  'Memoria unificada': ['memoria', 'memoria unificada', 'ram'],
  'Almacenamiento inicial': ['almacenamiento', 'almacenamiento inicial', 'capacidad'],
  Puertos: ['puertos', 'conectividad'],
  Cámara: ['camara', 'webcam', 'facetime hd'],
  'Apple Pencil': ['apple pencil', 'pencil'],
  'Teclado compatible': ['teclado', 'teclado compatible', 'magic keyboard'],
  'Cámara trasera': ['camara trasera', 'trasera', 'camara principal'],
  'Tamaño de caja': ['tamano de caja', 'tamano', 'caja', 'talla'],
  Conectividad: ['conectividad', 'gps', 'cellular'],
  'Sensores principales': ['sensores', 'salud', 'sensores principales'],
  'Cancelación de ruido': ['cancelacion de ruido', 'cancelacion', 'noise cancelling'],
  Ajuste: ['ajuste', 'formato'],
  Controles: ['controles'],
  Formato: ['formato'],
  Sistema: ['sistema'],
  Inteligencia: ['inteligencia'],
  'Uso recomendado': ['uso recomendado', 'uso'],
}

// -----------------------------------------------------------------------
// Metadata detallada por modelo (orientación demostrativa del prototipo).
// -----------------------------------------------------------------------
//
// Los datos reflejan lo que el prototipo comunica de cada producto y en
// muchos casos coinciden con la comunicación pública de Apple, pero se
// mantienen bajo la misma etiqueta demostrativa que precios y stock. Si en
// una futura integración Banana Computer confirma cifras oficiales, este
// mapa es el único punto a actualizar.

/**
 * Metadata de decisión por modelo. Todos los `*Level` son cualitativos
 * (1 = básico · 2 = intermedio · 3 = avanzado) y sirven al asistente
 * "Encuentra tu Apple" para ordenar recomendaciones. NO son puntuaciones
 * oficiales y se muestran siempre etiquetados como demostrativos.
 *
 * Los booleanos (`supportsPencil`, `supportsKeyboard`, `hasNoiseCancellation`,
 * `hasCellular`) reflejan capacidades declaradas del prototipo. `fitType`
 * describe el ajuste (intraural / circumaural) para AirPods.
 */
export type Level = 1 | 2 | 3

/** Formato físico de los AirPods (taxonomía v2 del asistente). */
export type AirPodsFit = 'open' | 'in-ear' | 'over-ear'

/** Formato de un Mac. */
export type MacFormFactor = 'portable' | 'desktop'

export interface ModelDecisionMeta {
  usoRecomendado?: string
  fields?: Record<string, string>
  strengths?: string[]
  portabilityLevel?: Level
  performanceLevel?: Level
  cameraLevel?: Level
  batteryLevel?: Level
  valueLevel?: Level
  professionalLevel?: Level
  supportsPencil?: boolean
  supportsKeyboard?: boolean
  hasNoiseCancellation?: boolean
  hasCellular?: boolean
  /** @deprecated Use `airpodsFit`. Mantiene textos antiguos. */
  fitType?: 'intraural' | 'circumaural'
  /** Nueva taxonomía AirPods (v2). */
  airpodsFit?: AirPodsFit
  /** Formato de Mac (portable/desktop) para filtros duros. */
  macFormFactor?: MacFormFactor
  /** Tamaño físico aproximado (para restricciones de tamaño iPhone/iPad). */
  sizeCategory?: 'compact' | 'balanced' | 'large'
}

const MODEL_META: Record<string, ModelDecisionMeta> = {
  // -------------------- iPhone --------------------
  '17-pro-max': {
    usoRecomendado: 'Fotografía profesional y máxima autonomía.',
    strengths: ['Cámara pro con zoom largo', 'Batería para todo el día', 'Pantalla grande y brillante'],
    portabilityLevel: 1,
    performanceLevel: 3,
    cameraLevel: 3,
    batteryLevel: 3,
    valueLevel: 1,
    professionalLevel: 3,
    sizeCategory: 'large',
    fields: {
      Pantalla: 'Super Retina XDR 6,9"',
      Chip: 'A19 Pro',
      'Cámara principal': '48 MP Fusion + 48 MP UW + 48 MP tele',
      'Zoom óptico': 'Hasta 5x · digital 25x',
      Selfie: '18 MP TrueDepth',
      'Autonomía de vídeo': 'Hasta 33 h reproducción',
      Peso: '227 g',
      Materiales: 'Titanio',
      Resistencia: 'IP68',
      Puerto: 'USB-C',
    },
  },
  '17-pro': {
    usoRecomendado: 'Uso pro compacto con cámaras avanzadas.',
    strengths: ['Cámaras avanzadas en formato compacto', 'A19 Pro potente', 'Buena autonomía'],
    portabilityLevel: 2,
    performanceLevel: 3,
    cameraLevel: 3,
    batteryLevel: 2,
    valueLevel: 1,
    professionalLevel: 3,
    sizeCategory: 'balanced',
    fields: {
      Pantalla: 'Super Retina XDR 6,3"',
      Chip: 'A19 Pro',
      'Cámara principal': '48 MP Fusion + 48 MP UW + 48 MP tele',
      'Zoom óptico': 'Hasta 4x · digital 20x',
      Selfie: '18 MP TrueDepth',
      'Autonomía de vídeo': 'Hasta 27 h reproducción',
      Peso: '199 g',
      Materiales: 'Titanio',
      Resistencia: 'IP68',
      Puerto: 'USB-C',
    },
  },
  air: {
    usoRecomendado: 'Diseño ligero y batería equilibrada para uso diario.',
    strengths: ['El más ligero de la gama', 'Diseño premium en titanio', 'Chip A19'],
    portabilityLevel: 3,
    performanceLevel: 2,
    cameraLevel: 2,
    batteryLevel: 2,
    valueLevel: 2,
    professionalLevel: 2,
    sizeCategory: 'compact',
    fields: {
      Pantalla: 'Super Retina XDR 6,5"',
      Chip: 'A19',
      'Cámara principal': '48 MP Fusion',
      'Zoom óptico': 'Hasta 2x',
      Selfie: '12 MP TrueDepth',
      'Autonomía de vídeo': 'Hasta 22 h reproducción',
      Peso: '165 g',
      Materiales: 'Titanio',
      Resistencia: 'IP68',
      Puerto: 'USB-C',
    },
  },
  '17': {
    usoRecomendado: 'Uso cotidiano con muy buena relación calidad-precio.',
    strengths: ['Excelente relación calidad-precio', 'Chip A19', 'Pantalla Super Retina XDR'],
    portabilityLevel: 2,
    performanceLevel: 2,
    cameraLevel: 2,
    batteryLevel: 2,
    valueLevel: 3,
    professionalLevel: 1,
    sizeCategory: 'balanced',
    fields: {
      Pantalla: 'Super Retina XDR 6,3"',
      Chip: 'A19',
      'Cámara principal': '48 MP Fusion',
      'Zoom óptico': 'Hasta 2x',
      Selfie: '12 MP TrueDepth',
      'Autonomía de vídeo': 'Hasta 22 h reproducción',
      Peso: '170 g',
      Materiales: 'Aluminio y vidrio',
      Resistencia: 'IP68',
      Puerto: 'USB-C',
    },
  },

  // -------------------- Mac --------------------
  'macbook-neo': {
    usoRecomendado: 'Portátil ligero para estudio y ofimática.',
    strengths: ['Precio de entrada', 'Chip Apple', 'Peso contenido'],
    portabilityLevel: 3,
    performanceLevel: 1,
    batteryLevel: 2,
    valueLevel: 3,
    professionalLevel: 1,
    macFormFactor: 'portable',
    fields: {
      Chip: 'Apple M-series',
      'CPU / GPU': '8 núcleos CPU · 8 núcleos GPU',
      'Memoria unificada': 'Desde 8 GB',
      'Almacenamiento inicial': '256 GB',
      Pantalla: '13" Retina',
      Autonomía: 'Hasta 18 h',
      Peso: 'Aprox. 1,2 kg',
      Puertos: '2 · Thunderbolt / USB-C',
      Cámara: 'FaceTime HD',
    },
  },
  'macbook-air-13-m5': {
    usoRecomendado: 'Portabilidad y uso diario.',
    strengths: ['Muy ligero', 'M5 eficiente', 'Autonomía alta'],
    portabilityLevel: 3,
    performanceLevel: 2,
    batteryLevel: 3,
    valueLevel: 2,
    professionalLevel: 2,
    macFormFactor: 'portable',
    fields: {
      Chip: 'M5',
      'CPU / GPU': '10 núcleos CPU · 10 núcleos GPU',
      'Memoria unificada': 'Desde 16 GB',
      'Almacenamiento inicial': '256 GB',
      Pantalla: 'Liquid Retina 13,6"',
      Autonomía: 'Hasta 18 h',
      Peso: '1,24 kg',
      Puertos: 'MagSafe + 2 Thunderbolt / USB 4',
      Cámara: '12 MP Center Stage',
    },
  },
  'macbook-air-15-m4': {
    usoRecomendado: 'Pantalla grande y ligereza para trabajo.',
    strengths: ['Pantalla 15" ligera', 'Buena autonomía', 'M4 eficiente'],
    portabilityLevel: 2,
    performanceLevel: 2,
    batteryLevel: 3,
    valueLevel: 2,
    professionalLevel: 2,
    macFormFactor: 'portable',
    fields: {
      Chip: 'M4',
      'CPU / GPU': '10 núcleos CPU · 10 núcleos GPU',
      'Memoria unificada': 'Desde 16 GB',
      'Almacenamiento inicial': '256 GB',
      Pantalla: 'Liquid Retina 15,3"',
      Autonomía: 'Hasta 18 h',
      Peso: '1,51 kg',
      Puertos: 'MagSafe + 2 Thunderbolt / USB 4',
      Cámara: '12 MP Center Stage',
    },
  },
  'macbook-pro-14-m5': {
    usoRecomendado: 'Trabajo creativo exigente y portable.',
    strengths: ['M5 Pro potente', 'Pantalla mini-LED XDR', 'Buena portabilidad'],
    portabilityLevel: 2,
    performanceLevel: 3,
    batteryLevel: 3,
    valueLevel: 1,
    professionalLevel: 3,
    macFormFactor: 'portable',
    fields: {
      Chip: 'M5 Pro',
      'CPU / GPU': 'Hasta 12 núcleos CPU · 18 núcleos GPU',
      'Memoria unificada': 'Desde 16 GB',
      'Almacenamiento inicial': '512 GB',
      Pantalla: 'Liquid Retina XDR 14,2"',
      Autonomía: 'Hasta 22 h',
      Peso: '1,55 kg',
      Puertos: 'MagSafe 3 · 3 Thunderbolt 5 · HDMI · SDXC',
      Cámara: '12 MP Center Stage',
    },
  },
  'macbook-pro-16-m4': {
    usoRecomendado: 'Máxima potencia en formato portátil.',
    strengths: ['Pantalla 16" XDR', 'M4 Pro potente', 'Autonomía muy larga'],
    portabilityLevel: 1,
    performanceLevel: 3,
    batteryLevel: 3,
    valueLevel: 1,
    professionalLevel: 3,
    macFormFactor: 'portable',
    fields: {
      Chip: 'M4 Pro',
      'CPU / GPU': 'Hasta 14 núcleos CPU · 20 núcleos GPU',
      'Memoria unificada': 'Desde 24 GB',
      'Almacenamiento inicial': '512 GB',
      Pantalla: 'Liquid Retina XDR 16,2"',
      Autonomía: 'Hasta 24 h',
      Peso: '2,14 kg',
      Puertos: 'MagSafe 3 · 3 Thunderbolt 5 · HDMI · SDXC',
      Cámara: '12 MP Center Stage',
    },
  },
  'imac-m4': {
    usoRecomendado: 'Ordenador de sobremesa con pantalla integrada.',
    strengths: ['Todo en uno', 'Pantalla 4,5K integrada', 'Diseño delgado'],
    portabilityLevel: 1,
    performanceLevel: 2,
    valueLevel: 2,
    professionalLevel: 2,
    macFormFactor: 'desktop',
    fields: {
      Chip: 'M4',
      'CPU / GPU': '8-10 núcleos CPU · 8-10 núcleos GPU',
      'Memoria unificada': 'Desde 16 GB',
      'Almacenamiento inicial': '256 GB',
      Pantalla: '24" Retina 4,5K',
      Autonomía: 'Sobremesa · alimentación por cable',
      Peso: 'Aprox. 4,4 kg',
      Puertos: '2-4 Thunderbolt / USB 4',
      Cámara: '12 MP Center Stage',
    },
  },
  'mac-mini-m4': {
    usoRecomendado: 'Mac compacto para escritorio ampliable.',
    strengths: ['Muy compacto', 'Precio ajustado para la potencia', 'Ampliable con tu monitor'],
    portabilityLevel: 1,
    performanceLevel: 2,
    valueLevel: 3,
    professionalLevel: 2,
    macFormFactor: 'desktop',
    fields: {
      Chip: 'M4 / M4 Pro',
      'CPU / GPU': 'Hasta 12 núcleos CPU · 16 núcleos GPU',
      'Memoria unificada': 'Desde 16 GB',
      'Almacenamiento inicial': '256 GB',
      Pantalla: 'Sin pantalla integrada',
      Autonomía: 'Sobremesa · alimentación por cable',
      Peso: 'Aprox. 0,67 kg',
      Puertos: '3 Thunderbolt · HDMI · 2 USB-C · Ethernet',
      Cámara: 'No incluida',
    },
  },
  'mac-studio-m4': {
    usoRecomendado: 'Estudio profesional exigente.',
    strengths: ['Máxima potencia', 'M4 Max/Ultra', 'Muchos puertos Thunderbolt'],
    portabilityLevel: 1,
    performanceLevel: 3,
    valueLevel: 1,
    professionalLevel: 3,
    macFormFactor: 'desktop',
    fields: {
      Chip: 'M4 Max / M4 Ultra',
      'CPU / GPU': 'Hasta 32 núcleos CPU · 80 núcleos GPU',
      'Memoria unificada': 'Desde 36 GB',
      'Almacenamiento inicial': '512 GB',
      Pantalla: 'Sin pantalla integrada',
      Autonomía: 'Sobremesa · alimentación por cable',
      Peso: 'Aprox. 2,7 kg',
      Puertos: '4 Thunderbolt 5 · 2 USB-A · HDMI · Ethernet',
      Cámara: 'No incluida',
    },
  },

  // -------------------- iPad --------------------
  'ipad-pro-11-6gen-2025': {
    usoRecomendado: 'Trabajo creativo y dibujo avanzado.',
    strengths: ['Pantalla OLED XDR', 'M5 potente', 'Apple Pencil Pro'],
    portabilityLevel: 3,
    performanceLevel: 3,
    batteryLevel: 2,
    valueLevel: 1,
    professionalLevel: 3,
    supportsPencil: true,
    supportsKeyboard: true,
    fields: {
      Pantalla: 'Ultra Retina XDR OLED 11" o 13"',
      Chip: 'M5',
      'Apple Pencil': 'Apple Pencil Pro',
      'Teclado compatible': 'Magic Keyboard para iPad Pro',
      'Cámara trasera': '12 MP con LiDAR',
      'Almacenamiento inicial': '256 GB',
      Peso: 'Desde 444 g',
      Autonomía: 'Hasta 10 h',
    },
  },
  'ipad-air-11-m4-3gen-2026': {
    usoRecomendado: 'Estudio, dibujo y edición ligera.',
    strengths: ['M4 en formato Air', 'Compatible con Apple Pencil Pro', 'Buena relación calidad-precio'],
    portabilityLevel: 3,
    performanceLevel: 2,
    batteryLevel: 2,
    valueLevel: 2,
    professionalLevel: 2,
    supportsPencil: true,
    supportsKeyboard: true,
    fields: {
      Pantalla: 'Liquid Retina 11" o 13"',
      Chip: 'M4',
      'Apple Pencil': 'Apple Pencil Pro / USB-C',
      'Teclado compatible': 'Magic Keyboard para iPad Air',
      'Cámara trasera': '12 MP gran angular',
      'Almacenamiento inicial': '128 GB',
      Peso: 'Desde 460 g',
      Autonomía: 'Hasta 10 h',
    },
  },
  'ipad-mini-7-2024': {
    usoRecomendado: 'Portabilidad extrema y lectura.',
    strengths: ['Muy compacto', 'Ideal para lectura y viajes', 'Chip A17 Pro'],
    portabilityLevel: 3,
    performanceLevel: 2,
    batteryLevel: 2,
    valueLevel: 2,
    professionalLevel: 1,
    supportsPencil: true,
    supportsKeyboard: false,
    fields: {
      Pantalla: 'Liquid Retina 8,3"',
      Chip: 'A17 Pro',
      'Apple Pencil': 'Apple Pencil Pro / USB-C',
      'Teclado compatible': 'No compatible con Magic Keyboard',
      'Cámara trasera': '12 MP gran angular',
      'Almacenamiento inicial': '128 GB',
      Peso: '293 g',
      Autonomía: 'Hasta 10 h',
    },
  },
  'ipad-11-11gen-2025': {
    usoRecomendado: 'Uso diario y consumo multimedia.',
    strengths: ['Precio ajustado', 'Buena pantalla', 'Ideal para estudio'],
    portabilityLevel: 2,
    performanceLevel: 2,
    batteryLevel: 2,
    valueLevel: 3,
    professionalLevel: 1,
    supportsPencil: true,
    supportsKeyboard: true,
    fields: {
      Pantalla: 'Liquid Retina 11"',
      Chip: 'A16',
      'Apple Pencil': 'Apple Pencil (USB-C)',
      'Teclado compatible': 'Magic Keyboard Folio',
      'Cámara trasera': '12 MP gran angular',
      'Almacenamiento inicial': '128 GB',
      Peso: '477 g',
      Autonomía: 'Hasta 10 h',
    },
  },

  // -------------------- Apple Watch --------------------
  'watch-ultra-3-2025': {
    usoRecomendado: 'Deporte extremo, buceo y aventura con máxima autonomía.',
    strengths: ['42 h de autonomía', 'Titanio y WR100', 'Sensor de profundidad'],
    portabilityLevel: 3,
    performanceLevel: 3,
    batteryLevel: 3,
    valueLevel: 1,
    professionalLevel: 3,
    hasCellular: true,
    fields: {
      'Tamaño de caja': '49 mm',
      Materiales: 'Titanio',
      Autonomía: 'Hasta 42 h · modo de bajo consumo',
      Conectividad: 'GPS + Cellular',
      'Sensores principales': 'ECG · SpO2 · temperatura · profundidad',
      Resistencia: 'WR100 · IP6X · normas de submarinismo',
      Chip: 'S11 SiP',
    },
  },
  'watch-serie-11-gps': {
    usoRecomendado: 'Salud, deporte y uso cotidiano.',
    strengths: ['ECG y oxígeno en sangre', 'Detección de apnea del sueño', 'Diseño ligero'],
    portabilityLevel: 3,
    performanceLevel: 3,
    batteryLevel: 2,
    valueLevel: 2,
    professionalLevel: 2,
    hasCellular: false,
    fields: {
      'Tamaño de caja': '42 o 46 mm',
      Materiales: 'Aluminio o titanio',
      Autonomía: 'Hasta 24 h · 36 h en bajo consumo',
      Conectividad: 'GPS · opción GPS + Cellular',
      'Sensores principales': 'ECG · SpO2 · temperatura · apnea del sueño',
      Resistencia: 'WR50 · IP6X',
      Chip: 'S11 SiP',
    },
  },
  'watch-series-11': {
    usoRecomendado: 'Salud, deporte y uso cotidiano.',
    strengths: ['ECG y oxígeno en sangre', 'Detección de apnea del sueño', 'Diseño ligero'],
    portabilityLevel: 3,
    performanceLevel: 3,
    batteryLevel: 2,
    valueLevel: 2,
    professionalLevel: 2,
    hasCellular: false,
    fields: {
      'Tamaño de caja': '42 o 46 mm',
      Materiales: 'Aluminio o titanio',
      Autonomía: 'Hasta 24 h · 36 h en bajo consumo',
      Conectividad: 'GPS · opción GPS + Cellular',
      'Sensores principales': 'ECG · SpO2 · temperatura · apnea del sueño',
      Resistencia: 'WR50 · IP6X',
      Chip: 'S11 SiP',
    },
  },
  'watch-serie-se-3g-gps': {
    usoRecomendado: 'Iniciación al Apple Watch a mejor precio.',
    strengths: ['Precio de entrada', 'Sensor de frecuencia cardiaca', 'Detección de caídas'],
    portabilityLevel: 3,
    performanceLevel: 2,
    batteryLevel: 2,
    valueLevel: 3,
    professionalLevel: 1,
    hasCellular: false,
    fields: {
      'Tamaño de caja': '40 o 44 mm',
      Materiales: 'Aluminio',
      Autonomía: 'Hasta 18 h',
      Conectividad: 'GPS · opción GPS + Cellular',
      'Sensores principales': 'Frecuencia cardiaca · caídas · choques',
      Resistencia: 'WR50',
      Chip: 'S8 SiP',
    },
  },
  'watch-se-3': {
    usoRecomendado: 'Iniciación al Apple Watch a mejor precio.',
    strengths: ['Precio de entrada', 'Sensor de frecuencia cardiaca', 'Detección de caídas'],
    portabilityLevel: 3,
    performanceLevel: 2,
    batteryLevel: 2,
    valueLevel: 3,
    professionalLevel: 1,
    hasCellular: false,
    fields: {
      'Tamaño de caja': '40 o 44 mm',
      Materiales: 'Aluminio',
      Autonomía: 'Hasta 18 h',
      Conectividad: 'GPS · opción GPS + Cellular',
      'Sensores principales': 'Frecuencia cardiaca · caídas · choques',
      Resistencia: 'WR50',
      Chip: 'S8 SiP',
    },
  },

  // -------------------- AirPods --------------------
  'airpods-pro-3': {
    usoRecomendado: 'Cancelación de ruido para viajes y trabajo.',
    strengths: ['ANC adaptativa', 'IP54 resistencia', 'Ajuste intraural'],
    portabilityLevel: 3,
    performanceLevel: 3,
    batteryLevel: 2,
    valueLevel: 2,
    professionalLevel: 3,
    hasNoiseCancellation: true,
    airpodsFit: 'in-ear',
    fields: {
      'Cancelación de ruido': 'Activa adaptativa · modo Transparencia',
      Chip: 'H2',
      Autonomía: 'Hasta 6 h con ANC · 8 h sin ANC',
      'Autonomía con estuche': 'Hasta 30 h',
      Ajuste: 'Intraural con almohadillas de silicona',
      Controles: 'Sensor táctil · control de volumen',
      Resistencia: 'IP54 (auriculares y estuche)',
    },
  },
  'airpods-4-anc': {
    usoRecomendado: 'Cancelación de ruido en formato abierto y ajustado.',
    strengths: ['ANC en formato abierto', 'Chip H2', 'Estuche USB-C compacto'],
    portabilityLevel: 3,
    performanceLevel: 3,
    batteryLevel: 2,
    valueLevel: 3,
    professionalLevel: 2,
    hasNoiseCancellation: true,
    airpodsFit: 'open',
    fields: {
      'Cancelación de ruido': 'Activa · modo Transparencia',
      Chip: 'H2',
      Autonomía: 'Hasta 4 h con ANC',
      'Autonomía con estuche': 'Hasta 30 h',
      Ajuste: 'Abierto (no intraural)',
      Controles: 'Sensor de fuerza',
      Resistencia: 'IP54 (auriculares y estuche)',
    },
  },
  'airpods-4': {
    usoRecomendado: 'Uso diario asequible con buen sonido.',
    strengths: ['Precio ajustado', 'Chip H2', 'Estuche USB-C'],
    portabilityLevel: 3,
    performanceLevel: 2,
    batteryLevel: 2,
    valueLevel: 3,
    professionalLevel: 1,
    hasNoiseCancellation: false,
    airpodsFit: 'open',
    fields: {
      'Cancelación de ruido': 'No incluye',
      Chip: 'H2',
      Autonomía: 'Hasta 5 h',
      'Autonomía con estuche': 'Hasta 30 h',
      Ajuste: 'Abierto (no intraural)',
      Controles: 'Sensor de fuerza',
      Resistencia: 'IP54 (auriculares y estuche)',
    },
  },
  'airpods-max': {
    usoRecomendado: 'Audio premium para casa y música.',
    strengths: ['Audio de alta calidad', 'Ajuste circumaural cómodo', 'Digital Crown de precisión'],
    portabilityLevel: 1,
    performanceLevel: 3,
    batteryLevel: 3,
    valueLevel: 1,
    professionalLevel: 2,
    hasNoiseCancellation: true,
    airpodsFit: 'over-ear',
    fields: {
      'Cancelación de ruido': 'Activa · modo Transparencia',
      Chip: 'H1',
      Autonomía: 'Hasta 20 h con ANC',
      'Autonomía con estuche': 'Estuche Smart Case incluido',
      Ajuste: 'Circumaurales · almohadillas de espuma',
      Controles: 'Digital Crown · botón de control de ruido',
      Resistencia: 'Sin certificación IP',
    },
  },
}

// -----------------------------------------------------------------------
// Normalización de texto
// -----------------------------------------------------------------------

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function labelMatches(specLabel: string, essentialField: string): boolean {
  const s = normalize(specLabel)
  const e = normalize(essentialField)
  if (s === e) return true
  const aliases = FIELD_ALIASES[essentialField] ?? []
  return aliases.some((a) => normalize(a) === s)
}

// -----------------------------------------------------------------------
// Extractores
// -----------------------------------------------------------------------

export interface DecisionContext {
  model: Model
  capacity: string | null
  color: string | null
}

/**
 * Valor visible ("Chip M4", "48 MP", …) del campo esencial pedido:
 *   1. Precio y capacidad inicial → cálculo directo desde el catálogo.
 *   2. `MODEL_META[slug].fields[field]` (datos específicos por modelo).
 *   3. `model.specs` mediante alias normalizados.
 *   4. `null` cuando el dato no existe (nunca se inventa).
 */
export function getEssentialValue(ctx: DecisionContext, field: string): string | null {
  const { model } = ctx

  if (field === 'Precio') {
    const price = resolvePrice(ctx)
    if (price == null) return null
    return formatEuros(price)
  }

  if (field === 'Capacidad inicial' || field === 'Almacenamiento inicial') {
    const meta = MODEL_META[model.slug]?.fields?.[field]
    if (meta) return meta
    const first = model.colors[0]?.capacities[0]?.capacity
    return first ?? null
  }

  if (field === 'Uso recomendado') {
    return MODEL_META[model.slug]?.usoRecomendado ?? null
  }

  const meta = MODEL_META[model.slug]?.fields?.[field]
  if (meta) return meta

  const match = model.specs.find((s) => labelMatches(s.label, field))
  return match?.value ?? null
}

/** Precio numérico del modelo en el contexto (usa `fromPrice` si no hay capacidad). */
export function resolvePrice(ctx: DecisionContext): number | null {
  const { model, capacity } = ctx
  if (capacity) {
    const cap = model.colors[0]?.capacities.find((c) => c.capacity === capacity)
    if (cap) return cap.price
  }
  return model.fromPrice ?? null
}

// "199 g" o "1,55 kg" → gramos
export function parseWeightGrams(value: string | null | undefined): number | null {
  if (!value) return null
  const match = value.match(/([\d.,]+)\s*(kg|g)?/i)
  if (!match) return null
  const num = parseFloat(match[1].replace(',', '.'))
  if (!Number.isFinite(num)) return null
  const unit = (match[2] || 'g').toLowerCase()
  return unit === 'kg' ? Math.round(num * 1000) : Math.round(num)
}

// '6,3"' o '42 mm' → pulgadas
export function parseScreenInches(value: string | null | undefined): number | null {
  if (!value) return null
  const inch = value.match(/([\d.,]+)\s*(?:"|pulg)/i)
  if (inch) return parseFloat(inch[1].replace(',', '.'))
  const mm = value.match(/([\d.,]+)\s*mm/i)
  if (mm) {
    const n = parseFloat(mm[1].replace(',', '.'))
    return Number.isFinite(n) ? n / 25.4 : null
  }
  return null
}

// "256 GB" o "1 TB" → GB
export function parseCapacityGB(value: string | null | undefined): number | null {
  if (!value) return null
  const tb = value.match(/([\d.,]+)\s*TB/i)
  if (tb) return Math.round(parseFloat(tb[1].replace(',', '.')) * 1024)
  const gb = value.match(/([\d.,]+)\s*GB/i)
  if (gb) return Math.round(parseFloat(gb[1].replace(',', '.')))
  return null
}

// -----------------------------------------------------------------------
// Reducción del comparador
// -----------------------------------------------------------------------

export interface DecisionRow {
  field: string
  values: (string | null)[]
  allEqual: boolean
  someHasValue: boolean
}

export function buildDecisionRows(
  contexts: DecisionContext[],
  family: FamilySlug,
  { onlyDifferences }: { onlyDifferences: boolean },
): DecisionRow[] {
  const essential = ESSENTIAL_FIELDS[family] ?? []
  const extended = EXTENDED_FIELDS[family] ?? []
  const fields = onlyDifferences ? essential : [...essential, ...extended]
  const rows: DecisionRow[] = fields.map((field) => {
    const values = contexts.map((ctx) => getEssentialValue(ctx, field))
    const nonNull = values.filter((v): v is string => v != null)
    const someHasValue = nonNull.length > 0
    const allEqual =
      nonNull.length > 0 &&
      nonNull.every((v) => v === nonNull[0]) &&
      nonNull.length === values.length
    return { field, values, allEqual, someHasValue }
  })

  return rows.filter((row) => {
    if (!row.someHasValue) return false
    if (onlyDifferences && row.allEqual) return false
    return true
  })
}

/**
 * Devuelve las filas agrupadas por sección (para la vista con títulos de
 * sección). Solo incluye secciones que tengan al menos una fila visible.
 */
export interface DecisionSection {
  title: string
  rows: DecisionRow[]
}

export function buildDecisionSections(
  contexts: DecisionContext[],
  family: FamilySlug,
  { onlyDifferences }: { onlyDifferences: boolean },
): DecisionSection[] {
  const visible = buildDecisionRows(contexts, family, { onlyDifferences })
  const byField = new Map(visible.map((r) => [r.field, r]))
  const sections = FIELD_SECTIONS[family] ?? []
  const out: DecisionSection[] = []
  const usedFields = new Set<string>()
  for (const sec of sections) {
    const rows = sec.fields
      .map((f) => byField.get(f))
      .filter((r): r is DecisionRow => Boolean(r))
    rows.forEach((r) => usedFields.add(r.field))
    if (rows.length > 0) out.push({ title: sec.title, rows })
  }
  // Cualquier fila no cubierta por FIELD_SECTIONS termina en "Otros".
  const leftover = visible.filter((r) => !usedFields.has(r.field))
  if (leftover.length > 0) out.push({ title: 'Otros', rows: leftover })
  return out
}

// -----------------------------------------------------------------------
// Resumen ("Más económico", "Más ligero"…)
// -----------------------------------------------------------------------

export interface DecisionSummary {
  cheapestSlug: string | null
  largestCapacitySlug: string | null
  lightestSlug: string | null
  largestScreenSlug: string | null
}

/**
 * Devuelve el slug del "ganador único" solo si:
 *   - hay >= 2 contextos,
 *   - todos los contextos tienen dato numérico (nunca declaramos un ganador
 *     si a algún candidato le falta el dato),
 *   - existe un valor extremo estricto (no hay empate en la posición ganadora).
 * En cualquier otro caso devuelve `null` — el usuario prefiere que no
 * marquemos ningún ganador antes que marcar uno arbitrario.
 */
function uniqueExtreme<T extends { slug: string; value: number }>(
  items: T[],
  mode: 'min' | 'max',
): string | null {
  if (items.length < 2) return null
  const sorted = [...items].sort((a, b) => (mode === 'min' ? a.value - b.value : b.value - a.value))
  if (sorted[0].value === sorted[1].value) return null
  return sorted[0].slug
}

export function buildDecisionSummary(contexts: DecisionContext[]): DecisionSummary {
  const result: DecisionSummary = {
    cheapestSlug: null,
    largestCapacitySlug: null,
    lightestSlug: null,
    largestScreenSlug: null,
  }
  if (contexts.length < 2) return result

  // Precio: todos deben tenerlo.
  const prices = contexts.map((ctx) => ({
    slug: ctx.model.slug,
    value: resolvePrice(ctx),
  }))
  if (prices.every((p) => p.value != null)) {
    result.cheapestSlug = uniqueExtreme(
      prices as { slug: string; value: number }[],
      'min',
    )
  }

  // Capacidad: todos deben tenerla.
  const caps = contexts.map((ctx) => ({
    slug: ctx.model.slug,
    value: parseCapacityGB(
      getEssentialValue(ctx, 'Capacidad inicial') ??
        getEssentialValue(ctx, 'Almacenamiento inicial'),
    ),
  }))
  if (caps.every((c) => c.value != null)) {
    result.largestCapacitySlug = uniqueExtreme(
      caps as { slug: string; value: number }[],
      'max',
    )
  }

  // Peso: todos deben tenerlo.
  const weights = contexts.map((ctx) => ({
    slug: ctx.model.slug,
    value: parseWeightGrams(getEssentialValue(ctx, 'Peso')),
  }))
  if (weights.every((w) => w.value != null)) {
    result.lightestSlug = uniqueExtreme(
      weights as { slug: string; value: number }[],
      'min',
    )
  }

  // Pantalla: todos deben tenerla.
  const screens = contexts.map((ctx) => ({
    slug: ctx.model.slug,
    value: parseScreenInches(
      getEssentialValue(ctx, 'Pantalla') ?? getEssentialValue(ctx, 'Tamaño de caja'),
    ),
  }))
  if (screens.every((s) => s.value != null)) {
    result.largestScreenSlug = uniqueExtreme(
      screens as { slug: string; value: number }[],
      'max',
    )
  }

  return result
}

// -----------------------------------------------------------------------

function formatEuros(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

// =======================================================================
// =======================================================================
// Asistente "Encuentra tu Apple" (arquitectura v2).
// =======================================================================
//
// Estructura explícita de respuestas: general / family / specific — evita
// que las claves de las preguntas específicas pisen a las generales.
// Los cálculos se separan en:
//   1. filterEligibleModels() — restricciones DURAS (portátil vs sobremesa,
//      formato AirPods, Pencil/teclado obligatorio, Cellular obligatorio,
//      presupuesto estricto…). Un modelo que no pasa este filtro NUNCA se
//      recomienda.
//   2. scoreEligibleModel() — preferencias BLANDAS (uso, prioridad, valor,
//      autonomía, presupuesto flexible o de referencia).
//   3. buildRecommendationReasons() / buildRecommendationCaveats() — razones
//      y compromisos DERIVADOS de las respuestas concretas (no de los
//      `strengths` genéricos).
//   4. computeFinderResults() — elige "Mejor encaje", "Mejor relación
//      calidad-precio" y "Otra opción que también encaja" con umbrales; o
//      devuelve un resultado "no-match" cuando ninguna opción cumple.
// Todo es determinista: mismos inputs → mismos resultados.

export interface FinderOption {
  value: string
  label: string
}

export interface FinderQuestion {
  id: string
  prompt: string
  help?: string
  options: FinderOption[]
}

/** Flexibilidad del presupuesto (elegida como respuesta general aparte). */
export type BudgetFlex = 'strict' | 'flex' | 'reference'

/** Un tramo de presupuesto. `max: null` = sin límite. */
export interface BudgetOption {
  value: string
  label: string
  max: number | null
}

/**
 * Devuelve las bandas de presupuesto sugeridas para una familia. Se
 * construyen a partir de los `fromPrice` reales de los modelos: mínimo,
 * mediana redondeada y máximo redondeado + tramo "sin límite". Sensato para
 * AirPods, Watch, iPad, iPhone y Mac sin necesidad de hard-codearlo.
 */
export function getBudgetOptionsForFamily(
  family: FamilySlug,
  models: readonly Model[],
): BudgetOption[] {
  const prices = models
    .map((m) => m.fromPrice)
    .filter((n): n is number => Number.isFinite(n))
    .sort((a, b) => a - b)
  if (prices.length === 0) {
    return [{ value: 'sin-limite', label: 'Sin límite', max: null }]
  }
  const min = prices[0]
  const max = prices[prices.length - 1]
  const mid = prices[Math.floor((prices.length - 1) / 2)]
  const bands = new Set<number>()
  const roundUp = (n: number, step: number) => Math.ceil(n / step) * step
  const step = family === 'airpods' ? 25 : family === 'apple-watch' ? 50 : 100
  bands.add(roundUp(min, step))
  bands.add(roundUp(mid, step))
  bands.add(roundUp(max, step))
  const sortedBands = Array.from(bands).sort((a, b) => a - b)
  const opts: BudgetOption[] = sortedBands.map((v) => ({
    value: `hasta-${v}`,
    label: `Hasta ${formatEuros(v)}`,
    max: v,
  }))
  opts.push({ value: 'sin-limite', label: 'Sin límite', max: null })
  return opts
}

/** Preguntas específicas por familia. IDs prefijados por familia (namespace). */
export const FINDER_QUESTIONS: Record<FamilySlug, readonly FinderQuestion[]> = {
  iphone: [
    {
      id: 'iphone.use',
      prompt: '¿Para qué usas más el iPhone?',
      options: [
        { value: 'diario', label: 'Uso cotidiano' },
        { value: 'foto', label: 'Fotografía y vídeo' },
        { value: 'trabajo', label: 'Trabajo' },
        { value: 'juegos', label: 'Juegos' },
        { value: 'redes', label: 'Redes sociales' },
      ],
    },
    {
      id: 'iphone.size',
      prompt: '¿Qué tamaño prefieres?',
      options: [
        { value: 'compacto', label: 'Compacto' },
        { value: 'equilibrado', label: 'Equilibrado' },
        { value: 'grande', label: 'Grande' },
        { value: 'flex', label: 'Me da igual' },
      ],
    },
    {
      id: 'iphone.priority',
      prompt: '¿Qué es lo que más te importa?',
      options: [
        { value: 'camera', label: 'Cámara' },
        { value: 'battery', label: 'Batería' },
        { value: 'performance', label: 'Potencia' },
        { value: 'portability', label: 'Ligereza' },
        { value: 'value', label: 'Precio' },
      ],
    },
  ],
  mac: [
    {
      id: 'mac.use',
      prompt: '¿Cuál es el uso principal del Mac?',
      options: [
        { value: 'estudio', label: 'Estudio y ofimática' },
        { value: 'programacion', label: 'Programación' },
        { value: 'diseno', label: 'Diseño' },
        { value: 'foto-video', label: 'Fotografía y vídeo' },
        { value: 'pro', label: 'Trabajo profesional exigente' },
      ],
    },
    {
      id: 'mac.form',
      prompt: '¿Prefieres portátil o sobremesa?',
      help: 'Si es imprescindible, filtramos: portátil no propone iMac/Mac mini/Studio y viceversa.',
      options: [
        { value: 'portable', label: 'Portátil (imprescindible)' },
        { value: 'desktop', label: 'Sobremesa (imprescindible)' },
        { value: 'flex', label: 'Me da igual' },
      ],
    },
    {
      id: 'mac.priority',
      prompt: '¿Qué prima?',
      options: [
        { value: 'portability', label: 'Ligereza y batería' },
        { value: 'performance', label: 'Potencia' },
        { value: 'value', label: 'Precio' },
      ],
    },
  ],
  ipad: [
    {
      id: 'ipad.use',
      prompt: '¿Para qué lo vas a usar principalmente?',
      options: [
        { value: 'estudio', label: 'Estudio' },
        { value: 'multimedia', label: 'Consumo multimedia' },
        { value: 'dibujo', label: 'Dibujo' },
        { value: 'trabajo', label: 'Trabajo' },
        { value: 'edicion', label: 'Edición' },
      ],
    },
    {
      id: 'ipad.pencil',
      prompt: '¿Vas a usar Apple Pencil?',
      help: '"Sí" descarta modelos sin compatibilidad Pencil.',
      options: [
        { value: 'si', label: 'Sí (imprescindible)' },
        { value: 'quizas', label: 'Quizás' },
        { value: 'no', label: 'No lo necesito' },
      ],
    },
    {
      id: 'ipad.keyboard',
      prompt: '¿Y teclado (Magic Keyboard)?',
      help: '"Sí" descarta modelos sin teclado compatible.',
      options: [
        { value: 'si', label: 'Sí (imprescindible)' },
        { value: 'quizas', label: 'Quizás' },
        { value: 'no', label: 'No' },
      ],
    },
  ],
  'apple-watch': [
    {
      id: 'watch.use',
      prompt: '¿Para qué lo vas a usar?',
      options: [
        { value: 'salud', label: 'Salud' },
        { value: 'deporte', label: 'Deporte' },
        { value: 'diario', label: 'Uso cotidiano' },
        { value: 'aventura', label: 'Aventura y deporte extremo' },
      ],
    },
    {
      id: 'watch.cellular',
      prompt: '¿Necesitas conexión sin llevar el iPhone?',
      help: '"Sí" filtra los modelos que no ofrecen variante Cellular en el prototipo.',
      options: [
        { value: 'si', label: 'Sí, Cellular imprescindible' },
        { value: 'no', label: 'No, con GPS me vale' },
      ],
    },
    {
      id: 'watch.priority',
      prompt: '¿Qué prima?',
      options: [
        { value: 'battery', label: 'Autonomía' },
        { value: 'performance', label: 'Sensores y salud' },
        { value: 'value', label: 'Precio' },
      ],
    },
  ],
  airpods: [
    {
      id: 'airpods.use',
      prompt: '¿Cuál es el uso principal?',
      options: [
        { value: 'musica', label: 'Música' },
        { value: 'llamadas', label: 'Llamadas' },
        { value: 'viajes', label: 'Viajes y trabajo (ANC)' },
        { value: 'deporte', label: 'Deporte' },
      ],
    },
    {
      id: 'airpods.fit',
      prompt: '¿Qué tipo de ajuste prefieres?',
      help: '"Abiertos" descarta Pro/Max; "In-ear" descarta AirPods 4 y Max; "De diadema" solo permite AirPods Max.',
      options: [
        { value: 'open', label: 'Abiertos, sin almohadilla' },
        { value: 'in-ear', label: 'In-ear, con almohadillas' },
        { value: 'over-ear', label: 'De diadema' },
        { value: 'flex', label: 'Me da igual' },
      ],
    },
  ],
}

/** Preguntas generales para el flujo "No lo tengo claro". IDs con prefijo. */
export const GENERAL_QUESTIONS: readonly FinderQuestion[] = [
  {
    id: 'general.use',
    prompt: '¿Para qué lo utilizarás principalmente?',
    options: [
      { value: 'trabajo', label: 'Trabajo' },
      { value: 'estudio', label: 'Estudio' },
      { value: 'foto', label: 'Fotografía y vídeo' },
      { value: 'audio', label: 'Escuchar música o podcasts' },
      { value: 'salud', label: 'Salud y deporte' },
      { value: 'diario', label: 'Uso cotidiano' },
    ],
  },
  {
    id: 'general.priority',
    prompt: '¿Qué valoras más?',
    options: [
      { value: 'portability', label: 'Portabilidad' },
      { value: 'performance', label: 'Potencia' },
      { value: 'camera', label: 'Cámara' },
      { value: 'battery', label: 'Batería' },
      { value: 'value', label: 'Precio' },
    ],
  },
  {
    id: 'general.portability',
    prompt: '¿Necesitas que sea muy portable?',
    options: [
      { value: 'high', label: 'Sí, lo llevaré siempre encima' },
      { value: 'low', label: 'No, será para casa/oficina' },
      { value: 'flex', label: 'Me da igual' },
    ],
  },
]

/** Pregunta de flexibilidad de presupuesto. */
export const BUDGET_FLEX_QUESTION: FinderQuestion = {
  id: 'general.budgetFlex',
  prompt: '¿Qué tan estricto es ese presupuesto?',
  options: [
    { value: 'strict', label: 'Es mi máximo' },
    { value: 'flex', label: 'Podría subir un poco (10–15 %)' },
    { value: 'reference', label: 'Solo es una referencia' },
  ],
}

// -----------------------------------------------------------------------
// Estructura de respuestas (namespaced).
// -----------------------------------------------------------------------

export interface FinderAnswers {
  general: {
    use?: string
    priority?: string
    portability?: string
    budget?: string
    budgetFlex?: BudgetFlex
  }
  family: FamilySlug | null
  specific: Record<string, string>
}

export function emptyAnswers(): FinderAnswers {
  return { general: {}, family: null, specific: {} }
}

// -----------------------------------------------------------------------
// Sugerencia de familia ("No lo tengo claro").
// -----------------------------------------------------------------------

export interface FamilyCandidate {
  family: FamilySlug
  score: number
  reasons: string[]
}

/**
 * Devuelve las dos familias más probables dadas las respuestas generales,
 * ordenadas por score. Combina uso + prioridad + portabilidad + presupuesto.
 * No elige silenciosamente: el usuario tendrá que confirmar.
 */
export function computeFamilyCandidates(general: FinderAnswers['general']): FamilyCandidate[] {
  const scores: Record<FamilySlug, { score: number; reasons: string[] }> = {
    iphone: { score: 0, reasons: [] },
    mac: { score: 0, reasons: [] },
    ipad: { score: 0, reasons: [] },
    'apple-watch': { score: 0, reasons: [] },
    airpods: { score: 0, reasons: [] },
  }
  const add = (f: FamilySlug, n: number, r: string) => {
    scores[f].score += n
    if (r) scores[f].reasons.push(r)
  }

  const use = general.use
  if (use === 'trabajo') {
    add('mac', 5, 'Has indicado que lo usarás para trabajo.')
    add('ipad', 2, 'Los iPad también encajan para trabajo móvil.')
  }
  if (use === 'estudio') {
    add('ipad', 5, 'El estudio combina bien con iPad.')
    add('mac', 3, 'Un Mac también funciona para estudiar.')
  }
  if (use === 'foto') {
    add('iphone', 5, 'La cámara del iPhone es tu prioridad.')
    add('mac', 2, 'Para editar en escritorio, un Mac ayuda.')
  }
  if (use === 'audio') {
    add('airpods', 6, 'Para música o podcasts, AirPods.')
  }
  if (use === 'salud') {
    add('apple-watch', 6, 'Salud y deporte encajan con Apple Watch.')
  }
  if (use === 'diario') {
    add('iphone', 4, 'Para uso cotidiano, el iPhone es la base.')
    add('airpods', 2, 'Los AirPods complementan bien el día a día.')
  }

  const priority = general.priority
  if (priority === 'portability') {
    add('iphone', 2, 'La portabilidad es una prioridad para ti.')
    add('airpods', 2, 'Los AirPods son máximamente portátiles.')
    add('ipad', 1, '')
  }
  if (priority === 'performance') {
    add('mac', 3, 'Para potencia, Mac es donde más margen hay.')
    add('iphone', 1, '')
    add('ipad', 1, '')
  }
  if (priority === 'camera') {
    add('iphone', 4, 'La cámara del iPhone es tu prioridad.')
  }
  if (priority === 'battery') {
    add('apple-watch', 2, '')
    add('iphone', 1, '')
    add('mac', 1, '')
  }
  if (priority === 'value') {
    add('airpods', 2, 'AirPods es la familia con mejor precio de entrada.')
    add('ipad', 1, '')
  }

  const port = general.portability
  if (port === 'high') {
    add('iphone', 2, 'Buscas algo muy portable.')
    add('airpods', 2, '')
    add('apple-watch', 2, '')
    add('mac', -1, '')
  }
  if (port === 'low') {
    add('mac', 3, 'Preferirás algo de escritorio.')
    add('iphone', -1, '')
  }

  const sorted = (Object.keys(scores) as FamilySlug[])
    .map((f) => ({ family: f, score: scores[f].score, reasons: scores[f].reasons.slice(0, 3) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.family.localeCompare(b.family)
    })
    .filter((c) => c.score > 0)
  return sorted.slice(0, 2)
}

// -----------------------------------------------------------------------
// Filtros duros y scoring.
// -----------------------------------------------------------------------

const MAC_PORTABLE_SLUGS = new Set([
  'macbook-neo',
  'macbook-air-13-m5',
  'macbook-air-15-m4',
  'macbook-pro-14-m5',
  'macbook-pro-16-m4',
])
const MAC_DESKTOP_SLUGS = new Set(['imac-m4', 'mac-mini-m4', 'mac-studio-m4'])

export interface HardFilterFailure {
  slug: string
  reason: string
}

/** Restricciones duras — un modelo que las incumple NO se recomienda. */
export function filterEligibleModels(
  models: readonly Model[],
  answers: FinderAnswers,
): { eligible: Model[]; excluded: HardFilterFailure[] } {
  const eligible: Model[] = []
  const excluded: HardFilterFailure[] = []
  const budget = resolveBudgetMax(answers)
  for (const m of models) {
    const meta = MODEL_META[m.slug] ?? {}
    let reason: string | null = null

    if (answers.family === 'mac') {
      const form = answers.specific['mac.form']
      if (form === 'portable' && !MAC_PORTABLE_SLUGS.has(m.slug)) {
        reason = 'Formato: has pedido portátil.'
      } else if (form === 'desktop' && !MAC_DESKTOP_SLUGS.has(m.slug)) {
        reason = 'Formato: has pedido sobremesa.'
      }
    }

    if (!reason && answers.family === 'airpods') {
      const fit = answers.specific['airpods.fit'] as AirPodsFit | 'flex' | undefined
      if (fit && fit !== 'flex' && meta.airpodsFit && fit !== meta.airpodsFit) {
        reason = 'Formato de ajuste distinto al indicado.'
      }
    }

    if (!reason && answers.family === 'ipad') {
      if (answers.specific['ipad.pencil'] === 'si' && meta.supportsPencil === false) {
        reason = 'No es compatible con Apple Pencil.'
      }
      if (!reason && answers.specific['ipad.keyboard'] === 'si' && meta.supportsKeyboard === false) {
        reason = 'No es compatible con Magic Keyboard.'
      }
    }

    if (!reason && answers.family === 'apple-watch') {
      if (answers.specific['watch.cellular'] === 'si' && meta.hasCellular === false) {
        reason = 'No ofrece variante Cellular en el prototipo.'
      }
    }

    if (
      !reason &&
      budget != null &&
      answers.general.budgetFlex === 'strict' &&
      m.fromPrice > budget
    ) {
      reason = `Precio ${formatEuros(m.fromPrice)} por encima del presupuesto (${formatEuros(budget)}).`
    }
    if (
      !reason &&
      budget != null &&
      answers.general.budgetFlex === 'flex' &&
      m.fromPrice > Math.ceil(budget * 1.15)
    ) {
      reason = `Precio por encima incluso del margen del 15 % (${formatEuros(Math.ceil(budget * 1.15))}).`
    }

    if (reason) excluded.push({ slug: m.slug, reason })
    else eligible.push(m)
  }
  return { eligible, excluded }
}

function resolveBudgetMax(answers: FinderAnswers): number | null {
  if (!answers.family || !answers.general.budget) return null
  // Reconstruimos las opciones y buscamos el valor elegido.
  return budgetMaxFromValue(answers.family, answers.general.budget)
}

function budgetMaxFromValue(family: FamilySlug, value: string): number | null {
  if (value === 'sin-limite') return null
  const match = value.match(/^hasta-(\d+)$/)
  if (match) return parseInt(match[1], 10)
  // Fallback compat: valores antiguos tipo 'entrada'/'medio'/'alto'.
  const legacy: Record<string, number | null> = {
    entrada: 500,
    medio: 1000,
    alto: 1500,
    'sin-limite': null,
  }
  return legacy[value] ?? null
  // El uso concreto de `family` queda para futuras bandas por familia.
  void family
}

export interface ScoreResult {
  score: number
  positives: string[]
  caveats: string[]
}

/**
 * Puntúa un modelo YA elegible frente a las respuestas del usuario.
 * Determinista. Rango orientativo 0–100 (aunque no se muestra al usuario).
 */
export function scoreEligibleModel(model: Model, answers: FinderAnswers): ScoreResult {
  const meta = MODEL_META[model.slug] ?? {}
  let score = 0

  const priority = answers.specific[`${answers.family}.priority`] ?? answers.general.priority
  if (priority === 'camera' && meta.cameraLevel) score += meta.cameraLevel * 10
  if (priority === 'battery' && meta.batteryLevel) score += meta.batteryLevel * 10
  if (priority === 'performance' && meta.performanceLevel) score += meta.performanceLevel * 10
  if (priority === 'portability' && meta.portabilityLevel) score += meta.portabilityLevel * 10
  if (priority === 'value' && meta.valueLevel) score += meta.valueLevel * 10

  const familyUse = answers.family ? answers.specific[`${answers.family}.use`] : undefined
  const use = familyUse ?? answers.general.use
  if (use === 'foto' && meta.cameraLevel) score += meta.cameraLevel * 6
  if (use === 'foto-video' && meta.performanceLevel) score += meta.performanceLevel * 6
  if (use === 'juegos' && meta.performanceLevel) score += meta.performanceLevel * 5
  if (use === 'trabajo' && meta.professionalLevel) score += meta.professionalLevel * 6
  if (use === 'pro' && meta.professionalLevel) score += meta.professionalLevel * 8
  if (use === 'estudio' && meta.valueLevel) score += meta.valueLevel * 5
  if (use === 'diario' && meta.valueLevel) score += meta.valueLevel * 3
  if (use === 'diseno' && meta.performanceLevel) score += meta.performanceLevel * 6
  if (use === 'programacion' && meta.performanceLevel) score += meta.performanceLevel * 6
  if (use === 'aventura' && meta.batteryLevel) score += meta.batteryLevel * 8
  if (use === 'deporte' && meta.portabilityLevel) score += meta.portabilityLevel * 4
  if (use === 'salud' && meta.performanceLevel) score += meta.performanceLevel * 4
  if (use === 'edicion' && meta.performanceLevel) score += meta.performanceLevel * 6
  if (use === 'viajes' && meta.hasNoiseCancellation) score += 10

  // iPhone: tamaño blando.
  if (answers.family === 'iphone') {
    const size = answers.specific['iphone.size']
    if (size && size !== 'flex' && meta.sizeCategory) {
      const wanted = size === 'grande' ? 'large' : size === 'compacto' ? 'compact' : 'balanced'
      if (meta.sizeCategory === wanted) score += 8
      else score -= 2
    }
  }

  // Watch cellular bonus si sí lo quería.
  if (answers.family === 'apple-watch' && answers.specific['watch.cellular'] === 'si' && meta.hasCellular) {
    score += 8
  }

  // AirPods ANC preferido si el uso es viajes.
  if (answers.family === 'airpods' && use === 'viajes' && meta.hasNoiseCancellation) score += 6

  // Presupuesto de referencia: penalización proporcional.
  const budget = resolveBudgetMax(answers)
  if (budget != null && answers.general.budgetFlex === 'reference' && model.fromPrice > budget) {
    const over = model.fromPrice - budget
    score -= Math.min(15, Math.round((over / budget) * 25))
  }
  // Estricto/flex: los que sobrepasan ya fueron filtrados.
  if (budget != null && model.fromPrice <= budget) score += 2

  return { score, positives: [], caveats: [] }
}

// -----------------------------------------------------------------------
// Razones y compromisos derivados de las respuestas.
// -----------------------------------------------------------------------

export function buildRecommendationReasons(model: Model, answers: FinderAnswers): string[] {
  const meta = MODEL_META[model.slug] ?? {}
  const reasons: string[] = []
  const family = answers.family
  const familyUse = family ? answers.specific[`${family}.use`] : undefined
  const use = familyUse ?? answers.general.use
  const priority = (family ? answers.specific[`${family}.priority`] : undefined) ?? answers.general.priority
  const budget = resolveBudgetMax(answers)

  if (family === 'mac' && answers.specific['mac.form'] === 'portable' && MAC_PORTABLE_SLUGS.has(model.slug))
    reasons.push('Encaja con el formato portátil que pediste.')
  if (family === 'mac' && answers.specific['mac.form'] === 'desktop' && MAC_DESKTOP_SLUGS.has(model.slug))
    reasons.push('Encaja con el formato sobremesa que pediste.')
  if (family === 'airpods' && meta.airpodsFit && answers.specific['airpods.fit'] === meta.airpodsFit)
    reasons.push(`Ajuste ${airpodsFitLabel(meta.airpodsFit)} coincide con tu preferencia.`)
  if (family === 'ipad' && answers.specific['ipad.pencil'] === 'si' && meta.supportsPencil)
    reasons.push('Compatible con Apple Pencil, como pediste.')
  if (family === 'ipad' && answers.specific['ipad.keyboard'] === 'si' && meta.supportsKeyboard)
    reasons.push('Compatible con Magic Keyboard, como pediste.')
  if (family === 'apple-watch' && answers.specific['watch.cellular'] === 'si' && meta.hasCellular)
    reasons.push('Incluye variante Cellular disponible.')

  if (priority === 'camera' && meta.cameraLevel === 3)
    reasons.push('Cámara destacada, tu prioridad principal.')
  if (priority === 'battery' && meta.batteryLevel === 3)
    reasons.push('Muy buena autonomía, tu prioridad principal.')
  if (priority === 'performance' && meta.performanceLevel === 3)
    reasons.push('Máxima potencia de la familia.')
  if (priority === 'portability' && meta.portabilityLevel === 3)
    reasons.push('Muy portátil, como pediste.')
  if (priority === 'value' && meta.valueLevel === 3)
    reasons.push('Excelente relación calidad-precio.')

  if (family === 'iphone' && answers.specific['iphone.size'] && meta.sizeCategory) {
    const want = answers.specific['iphone.size']
    if (
      (want === 'grande' && meta.sizeCategory === 'large') ||
      (want === 'compacto' && meta.sizeCategory === 'compact') ||
      (want === 'equilibrado' && meta.sizeCategory === 'balanced')
    ) {
      reasons.push(`Tamaño ${want} como preferiste.`)
    }
  }

  if (use === 'aventura' && meta.batteryLevel === 3) reasons.push('Batería para deportes largos.')
  if (use === 'viajes' && meta.hasNoiseCancellation) reasons.push('Cancelación de ruido para viajes.')
  if (use === 'estudio' && meta.valueLevel && meta.valueLevel >= 2)
    reasons.push('Buena opción para estudio.')

  if (budget != null && model.fromPrice <= budget)
    reasons.push(`Entra en tu presupuesto (${formatEuros(budget)}).`)

  return dedupe(reasons).slice(0, 3)
}

export function buildRecommendationCaveats(model: Model, answers: FinderAnswers): string[] {
  const meta = MODEL_META[model.slug] ?? {}
  const caveats: string[] = []
  const budget = resolveBudgetMax(answers)

  if (answers.family === 'iphone') {
    const size = answers.specific['iphone.size']
    if (size && size !== 'flex' && meta.sizeCategory) {
      const wanted = size === 'grande' ? 'large' : size === 'compacto' ? 'compact' : 'balanced'
      if (meta.sizeCategory !== wanted) caveats.push('Tamaño distinto al que preferías.')
    }
  }
  if (answers.family === 'apple-watch' && answers.specific['watch.cellular'] === 'si' && !meta.hasCellular) {
    caveats.push('Requiere elegir explícitamente la variante Cellular al comprar.')
  }
  if (answers.family === 'ipad' && answers.specific['ipad.pencil'] === 'si' && meta.supportsPencil === false) {
    caveats.push('No es compatible con Apple Pencil.')
  }
  if (budget != null && model.fromPrice > budget && answers.general.budgetFlex === 'flex') {
    caveats.push(
      `Ligeramente por encima del presupuesto (${formatEuros(model.fromPrice)} vs ${formatEuros(budget)}).`,
    )
  }
  if (budget != null && model.fromPrice > budget && answers.general.budgetFlex === 'reference') {
    caveats.push(
      `Por encima de tu referencia (${formatEuros(model.fromPrice)} vs ${formatEuros(budget)}).`,
    )
  }
  return dedupe(caveats).slice(0, 2)
}

function airpodsFitLabel(fit: AirPodsFit): string {
  return fit === 'open' ? 'abierto' : fit === 'in-ear' ? 'in-ear' : 'de diadema'
}

// -----------------------------------------------------------------------
// Resultado final: roles + relajación transparente.
// -----------------------------------------------------------------------

export type FinderRole = 'best-fit' | 'best-value' | 'other'

export interface FinderResult {
  model: Model
  role: FinderRole
  score: number
  positives: string[]
  caveats: string[]
}

export interface FinderComputation {
  results: FinderResult[]
  eligibleCount: number
  excluded: HardFilterFailure[]
  // Si `noMatch` es true, ningún modelo cumple las restricciones duras.
  noMatch: boolean
}

/**
 * Ejecuta el pipeline completo. Reglas:
 *  - "best-fit" = mayor score entre los elegibles.
 *  - "best-value" = mejor cociente score/precio entre los elegibles, con
 *    score ≥ 70 % del best-fit y distinto slug al best-fit.
 *  - "other" = otro modelo elegible con score ≥ 75 % del best-fit y una
 *    fortaleza diferente al best-fit (o simplemente el siguiente).
 *  - Nunca incluir modelos filtrados por restricción dura.
 */
export function computeFinderResults(models: readonly Model[], answers: FinderAnswers): FinderComputation {
  const { eligible, excluded } = filterEligibleModels(models, answers)
  if (eligible.length === 0) {
    return { results: [], eligibleCount: 0, excluded, noMatch: true }
  }
  const scored = eligible
    .map((m) => ({ model: m, ...scoreEligibleModel(m, answers) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.model.fromPrice !== b.model.fromPrice) return a.model.fromPrice - b.model.fromPrice
      return a.model.slug.localeCompare(b.model.slug)
    })

  const best = scored[0]
  const bestFit: FinderResult = {
    model: best.model,
    role: 'best-fit',
    score: best.score,
    positives: buildRecommendationReasons(best.model, answers),
    caveats: buildRecommendationCaveats(best.model, answers),
  }
  const results: FinderResult[] = [bestFit]

  const bestScore = Math.max(best.score, 1)

  // Best-value: score/precio máximo entre los que llegan al 70 % del top.
  const valueCandidates = scored
    .filter((s) => s.model.slug !== best.model.slug && s.score >= bestScore * 0.7)
    .map((s) => ({
      ...s,
      ratio: s.model.fromPrice > 0 ? s.score / s.model.fromPrice : s.score,
    }))
    .sort((a, b) => {
      if (b.ratio !== a.ratio) return b.ratio - a.ratio
      return a.model.fromPrice - b.model.fromPrice
    })
  const bestValue = valueCandidates[0]
  if (bestValue && bestValue.model.slug !== best.model.slug && bestValue.model.fromPrice <= best.model.fromPrice) {
    results.push({
      model: bestValue.model,
      role: 'best-value',
      score: bestValue.score,
      positives: buildRecommendationReasons(bestValue.model, answers),
      caveats: buildRecommendationCaveats(bestValue.model, answers),
    })
  }

  // "Otra opción" — el siguiente en score sin coincidir con los ya elegidos y
  // con score ≥ 75 % del top.
  const usedSlugs = new Set(results.map((r) => r.model.slug))
  const other = scored.find((s) => !usedSlugs.has(s.model.slug) && s.score >= bestScore * 0.75)
  if (other) {
    results.push({
      model: other.model,
      role: 'other',
      score: other.score,
      positives: buildRecommendationReasons(other.model, answers),
      caveats: buildRecommendationCaveats(other.model, answers),
    })
  }

  return { results, eligibleCount: eligible.length, excluded, noMatch: false }
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}
