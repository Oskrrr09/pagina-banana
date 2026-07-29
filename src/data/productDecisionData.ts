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

// Campos esenciales por familia (orden de fila cuando "Mostrar todas").
// Se han elegido pensando en las decisiones más habituales del usuario.
export const ESSENTIAL_FIELDS: Record<FamilySlug, readonly string[]> = {
  iphone: [
    'Precio',
    'Pantalla',
    'Chip',
    'Cámara principal',
    'Zoom óptico',
    'Selfie',
    'Autonomía de vídeo',
    'Peso',
    'Materiales',
    'Resistencia',
    'Puerto',
    'Capacidad inicial',
    'Uso recomendado',
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
    'Puertos',
    'Cámara',
    'Uso recomendado',
  ],
  ipad: [
    'Precio',
    'Pantalla',
    'Chip',
    'Apple Pencil',
    'Teclado compatible',
    'Cámara trasera',
    'Almacenamiento inicial',
    'Peso',
    'Autonomía',
    'Uso recomendado',
  ],
  'apple-watch': [
    'Precio',
    'Tamaño de caja',
    'Materiales',
    'Autonomía',
    'Conectividad',
    'Sensores principales',
    'Resistencia',
    'Chip',
    'Uso recomendado',
  ],
  airpods: [
    'Precio',
    'Cancelación de ruido',
    'Chip',
    'Autonomía',
    'Autonomía con estuche',
    'Ajuste',
    'Controles',
    'Resistencia',
    'Uso recomendado',
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
  fitType?: 'intraural' | 'circumaural'
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
    fitType: 'intraural',
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
    fitType: 'intraural',
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
    fitType: 'intraural',
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
  'airpods-3': {
    usoRecomendado: 'Formato abierto con Audio Espacial.',
    strengths: ['Audio Espacial', 'Sensor de piel', 'Estuche MagSafe'],
    portabilityLevel: 3,
    performanceLevel: 2,
    batteryLevel: 2,
    valueLevel: 2,
    professionalLevel: 1,
    hasNoiseCancellation: false,
    fitType: 'intraural',
    fields: {
      'Cancelación de ruido': 'No incluye',
      Chip: 'H1',
      Autonomía: 'Hasta 6 h',
      'Autonomía con estuche': 'Hasta 30 h',
      Ajuste: 'Abierto (no intraural)',
      Controles: 'Sensor de fuerza',
      Resistencia: 'IPX4 (auriculares y estuche)',
    },
  },
  'airpods-2': {
    usoRecomendado: 'La opción más asequible del catálogo Apple.',
    strengths: ['Precio de entrada', 'Configuración instantánea', 'Chip H1'],
    portabilityLevel: 3,
    performanceLevel: 1,
    batteryLevel: 2,
    valueLevel: 3,
    professionalLevel: 1,
    hasNoiseCancellation: false,
    fitType: 'intraural',
    fields: {
      'Cancelación de ruido': 'No incluye',
      Chip: 'H1',
      Autonomía: 'Hasta 5 h',
      'Autonomía con estuche': 'Hasta 24 h',
      Ajuste: 'Abierto (no intraural)',
      Controles: 'Toque doble',
      Resistencia: 'Sin certificación IP',
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
    fitType: 'circumaural',
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
  const fields = ESSENTIAL_FIELDS[family] ?? []
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

// -----------------------------------------------------------------------
// Resumen ("Más económico", "Más ligero"…)
// -----------------------------------------------------------------------

export interface DecisionSummary {
  cheapestSlug: string | null
  largestCapacitySlug: string | null
  lightestSlug: string | null
  largestScreenSlug: string | null
}

export function buildDecisionSummary(contexts: DecisionContext[]): DecisionSummary {
  const result: DecisionSummary = {
    cheapestSlug: null,
    largestCapacitySlug: null,
    lightestSlug: null,
    largestScreenSlug: null,
  }
  if (contexts.length < 2) return result

  let minPrice = Infinity
  for (const ctx of contexts) {
    const p = resolvePrice(ctx)
    if (p != null && p < minPrice) {
      minPrice = p
      result.cheapestSlug = ctx.model.slug
    }
  }

  let maxCap = -Infinity
  for (const ctx of contexts) {
    const cap = parseCapacityGB(
      getEssentialValue(ctx, 'Capacidad inicial') ??
        getEssentialValue(ctx, 'Almacenamiento inicial'),
    )
    if (cap != null && cap > maxCap) {
      maxCap = cap
      result.largestCapacitySlug = ctx.model.slug
    }
  }

  const weights = contexts.map((ctx) => ({
    slug: ctx.model.slug,
    grams: parseWeightGrams(getEssentialValue(ctx, 'Peso')),
  }))
  const weightsWithData = weights.filter((w) => w.grams != null) as { slug: string; grams: number }[]
  if (weightsWithData.length >= 2) {
    weightsWithData.sort((a, b) => a.grams - b.grams)
    result.lightestSlug = weightsWithData[0].slug
  }

  const screens = contexts.map((ctx) => ({
    slug: ctx.model.slug,
    inches: parseScreenInches(
      getEssentialValue(ctx, 'Pantalla') ?? getEssentialValue(ctx, 'Tamaño de caja'),
    ),
  }))
  const screensWithData = screens.filter((s) => s.inches != null) as { slug: string; inches: number }[]
  if (screensWithData.length >= 2) {
    screensWithData.sort((a, b) => b.inches - a.inches)
    result.largestScreenSlug = screensWithData[0].slug
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
// Asistente "Encuentra tu Apple"
// =======================================================================
//
// Preguntas por familia + función `scoreModel` para el asistente.
// Todo es determinista: las mismas respuestas producen siempre las mismas
// recomendaciones. No usa aleatoriedad ni backend.

export interface FinderOption {
  value: string
  label: string
}

export interface FinderQuestion {
  id: string
  prompt: string
  help?: string
  multi?: boolean
  options: FinderOption[]
}

/** Presupuesto orientativo. `null` en `budget` = sin límite. */
export const BUDGET_OPTIONS: readonly { value: string; label: string; max: number | null }[] = [
  { value: 'entrada', label: 'Hasta 500 €', max: 500 },
  { value: 'medio', label: 'Hasta 1.000 €', max: 1000 },
  { value: 'alto', label: 'Hasta 1.500 €', max: 1500 },
  { value: 'sin-limite', label: 'Sin límite', max: null },
]

const BUDGET_QUESTION: FinderQuestion = {
  id: 'budget',
  prompt: '¿Qué presupuesto orientativo tienes?',
  help: 'Recomendaciones demostrativas: los precios reales pueden variar en Banana Computer.',
  options: BUDGET_OPTIONS.map(({ value, label }) => ({ value, label })),
}

/** Preguntas específicas por familia (4-6 relevantes). */
export const FINDER_QUESTIONS: Record<FamilySlug, readonly FinderQuestion[]> = {
  iphone: [
    {
      id: 'use',
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
      id: 'size',
      prompt: '¿Qué tamaño prefieres?',
      options: [
        { value: 'compacto', label: 'Compacto' },
        { value: 'equilibrado', label: 'Equilibrado' },
        { value: 'grande', label: 'Grande' },
      ],
    },
    {
      id: 'priority',
      prompt: '¿Qué es lo que más te importa?',
      options: [
        { value: 'camera', label: 'Cámara' },
        { value: 'battery', label: 'Batería' },
        { value: 'performance', label: 'Potencia' },
        { value: 'portability', label: 'Ligereza' },
        { value: 'value', label: 'Precio' },
      ],
    },
    BUDGET_QUESTION,
  ],
  mac: [
    {
      id: 'use',
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
      id: 'form',
      prompt: '¿Prefieres portátil o sobremesa?',
      options: [
        { value: 'portable', label: 'Portátil' },
        { value: 'desktop', label: 'Sobremesa' },
        { value: 'flex', label: 'Me da igual' },
      ],
    },
    {
      id: 'priority',
      prompt: '¿Qué prima?',
      options: [
        { value: 'portability', label: 'Ligereza y batería' },
        { value: 'performance', label: 'Potencia' },
        { value: 'value', label: 'Precio' },
      ],
    },
    BUDGET_QUESTION,
  ],
  ipad: [
    {
      id: 'use',
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
      id: 'pencil',
      prompt: '¿Vas a usar Apple Pencil?',
      options: [
        { value: 'si', label: 'Sí, Apple Pencil Pro' },
        { value: 'quizas', label: 'Quizás' },
        { value: 'no', label: 'No lo necesito' },
      ],
    },
    {
      id: 'keyboard',
      prompt: '¿Y teclado?',
      options: [
        { value: 'si', label: 'Sí, Magic Keyboard' },
        { value: 'quizas', label: 'Quizás' },
        { value: 'no', label: 'No' },
      ],
    },
    BUDGET_QUESTION,
  ],
  'apple-watch': [
    {
      id: 'use',
      prompt: '¿Para qué lo vas a usar?',
      options: [
        { value: 'salud', label: 'Salud' },
        { value: 'deporte', label: 'Deporte' },
        { value: 'diario', label: 'Uso cotidiano' },
        { value: 'aventura', label: 'Aventura y deporte extremo' },
      ],
    },
    {
      id: 'cellular',
      prompt: '¿Necesitas conexión sin llevar el iPhone?',
      options: [
        { value: 'si', label: 'Sí, quiero Cellular' },
        { value: 'no', label: 'No, con GPS me vale' },
      ],
    },
    {
      id: 'priority',
      prompt: '¿Qué prima?',
      options: [
        { value: 'battery', label: 'Autonomía' },
        { value: 'performance', label: 'Sensores y salud' },
        { value: 'value', label: 'Precio' },
      ],
    },
    BUDGET_QUESTION,
  ],
  airpods: [
    {
      id: 'use',
      prompt: '¿Cuál es el uso principal?',
      options: [
        { value: 'musica', label: 'Música' },
        { value: 'llamadas', label: 'Llamadas' },
        { value: 'viajes', label: 'Viajes y trabajo (ANC)' },
        { value: 'deporte', label: 'Deporte' },
      ],
    },
    {
      id: 'fit',
      prompt: '¿Qué ajuste prefieres?',
      options: [
        { value: 'intraural', label: 'Intraurales (in-ear)' },
        { value: 'circumaural', label: 'De diadema (over-ear)' },
        { value: 'flex', label: 'Me da igual' },
      ],
    },
    BUDGET_QUESTION,
  ],
}

/** Preguntas generales cuando el usuario elige "No lo tengo claro". */
export const GENERAL_QUESTIONS: readonly FinderQuestion[] = [
  {
    id: 'use',
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
    id: 'priority',
    prompt: '¿Qué valoras más?',
    options: [
      { value: 'portability', label: 'Portabilidad' },
      { value: 'performance', label: 'Potencia' },
      { value: 'camera', label: 'Cámara' },
      { value: 'value', label: 'Precio' },
    ],
  },
  BUDGET_QUESTION,
]

/** Mapa uso general → familia sugerida. */
const GENERAL_USE_TO_FAMILY: Record<string, FamilySlug> = {
  trabajo: 'mac',
  estudio: 'ipad',
  foto: 'iphone',
  audio: 'airpods',
  salud: 'apple-watch',
  diario: 'iphone',
}

export function inferFamilyFromGeneral(answers: Record<string, string>): FamilySlug {
  const use = answers.use
  return (use && GENERAL_USE_TO_FAMILY[use]) || 'iphone'
}

/** Resultado del scoring: puntuación + razones + posibles compromisos. */
export interface ScoreResult {
  score: number
  positives: string[]
  caveats: string[]
}

/**
 * Puntúa un modelo frente a un conjunto de respuestas. Determinista: mismos
 * inputs → mismo output. No usa aleatoriedad. La escala de score es interna
 * (relativa a los demás modelos de la misma familia); las razones y los
 * compromisos son cadenas orientadas al usuario.
 */
export function scoreModel(
  model: Model,
  answers: Record<string, string>,
): ScoreResult {
  const meta = MODEL_META[model.slug] ?? {}
  let score = 0
  const positives: string[] = []
  const caveats: string[] = []

  const priority = answers.priority
  const use = answers.use

  // --- Prioridad genérica ---
  if (priority === 'camera' && meta.cameraLevel) {
    score += meta.cameraLevel * 3
    if (meta.cameraLevel === 3) positives.push('Cámara destacada')
  }
  if (priority === 'battery' && meta.batteryLevel) {
    score += meta.batteryLevel * 3
    if (meta.batteryLevel === 3) positives.push('Muy buena autonomía')
  }
  if (priority === 'performance' && meta.performanceLevel) {
    score += meta.performanceLevel * 3
    if (meta.performanceLevel === 3) positives.push('Máxima potencia disponible')
  }
  if (priority === 'portability' && meta.portabilityLevel) {
    score += meta.portabilityLevel * 3
    if (meta.portabilityLevel === 3) positives.push('Muy portátil')
  }
  if (priority === 'value' && meta.valueLevel) {
    score += meta.valueLevel * 3
    if (meta.valueLevel === 3) positives.push('Excelente relación calidad-precio')
  }

  // --- Uso ---
  if (use === 'foto' && meta.cameraLevel) score += meta.cameraLevel * 2
  if (use === 'foto-video' && meta.performanceLevel) score += meta.performanceLevel * 2
  if (use === 'juegos' && meta.performanceLevel) score += meta.performanceLevel * 2
  if (use === 'trabajo' && meta.professionalLevel) score += meta.professionalLevel * 2
  if (use === 'pro' && meta.professionalLevel) score += meta.professionalLevel * 3
  if (use === 'estudio' && meta.valueLevel) score += meta.valueLevel * 2
  if (use === 'diario' && meta.valueLevel) score += meta.valueLevel * 1
  if (use === 'diseno' && meta.performanceLevel) score += meta.performanceLevel * 2
  if (use === 'programacion' && meta.performanceLevel) score += meta.performanceLevel * 2
  if (use === 'aventura' && meta.batteryLevel) score += meta.batteryLevel * 3
  if (use === 'deporte' && meta.portabilityLevel) score += meta.portabilityLevel * 2
  if (use === 'salud' && meta.performanceLevel) score += meta.performanceLevel * 2
  if (use === 'edicion' && meta.performanceLevel) score += meta.performanceLevel * 2
  if (use === 'viajes' && meta.hasNoiseCancellation) {
    score += 3
    positives.push('Cancelación de ruido para viajes')
  }

  // --- iPhone: tamaño ---
  if (answers.size) {
    const large = ['17-pro-max']
    const compact = ['air', '17-pro']
    const eq = ['17', '17-pro']
    if (answers.size === 'grande' && large.includes(model.slug)) score += 4
    if (answers.size === 'compacto' && compact.includes(model.slug)) score += 3
    if (answers.size === 'equilibrado' && eq.includes(model.slug)) score += 3
  }

  // --- Mac: forma ---
  if (answers.form) {
    const desktop = ['imac-m4', 'mac-mini-m4', 'mac-studio-m4']
    const portable = [
      'macbook-neo',
      'macbook-air-13-m5',
      'macbook-air-15-m4',
      'macbook-pro-14-m5',
      'macbook-pro-16-m4',
    ]
    if (answers.form === 'desktop' && desktop.includes(model.slug)) score += 4
    if (answers.form === 'portable' && portable.includes(model.slug)) score += 4
  }

  // --- iPad: pencil / keyboard ---
  if (answers.pencil === 'si' && meta.supportsPencil) {
    score += 3
    positives.push('Compatible con Apple Pencil')
  } else if (answers.pencil === 'si' && !meta.supportsPencil) {
    caveats.push('No incluye compatibilidad completa con Apple Pencil Pro')
  }
  if (answers.keyboard === 'si' && meta.supportsKeyboard) {
    score += 3
    positives.push('Compatible con Magic Keyboard')
  } else if (answers.keyboard === 'si' && meta.supportsKeyboard === false) {
    caveats.push('No es compatible con Magic Keyboard')
  }

  // --- Watch: cellular ---
  if (answers.cellular === 'si') {
    if (meta.hasCellular) {
      score += 4
      positives.push('Modelo con Cellular incluido')
    } else {
      caveats.push('Requiere elegir variante GPS + Cellular')
    }
  }

  // --- AirPods: ajuste ---
  if (answers.fit && meta.fitType) {
    if (answers.fit === meta.fitType) {
      score += 4
      positives.push(
        meta.fitType === 'intraural' ? 'Ajuste intraural cómodo' : 'Ajuste circumaural cómodo',
      )
    } else if (answers.fit !== 'flex') {
      score -= 2
    }
  }

  // --- Fortalezas declaradas ---
  if (meta.strengths && positives.length < 3) {
    for (const s of meta.strengths) {
      if (positives.length >= 3) break
      if (!positives.includes(s)) positives.push(s)
    }
  }

  // --- Presupuesto ---
  const budget = answers.budget ? BUDGET_OPTIONS.find((b) => b.value === answers.budget) : null
  if (budget?.max != null) {
    const price = model.fromPrice
    if (price > budget.max) {
      score -= 5
      caveats.push(`Precio orientativo por encima del presupuesto (${formatEuros(budget.max)}).`)
    } else if (price <= budget.max) {
      score += 1
    }
  }

  return {
    score,
    positives: dedupe(positives).slice(0, 3),
    caveats: dedupe(caveats).slice(0, 2),
  }
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

/** Resultado ordenado con etiquetas: recomendación, más económico, más avanzado. */
export interface FinderResult {
  model: Model
  role: 'recommendation' | 'cheaper' | 'advanced'
  score: number
  positives: string[]
  caveats: string[]
}

export function computeFinderResults(
  models: Model[],
  answers: Record<string, string>,
): FinderResult[] {
  const scored = models
    .map((model) => ({ model, ...scoreModel(model, answers) }))
    // Desempate estable: score desc → fromPrice asc → slug asc.
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.model.fromPrice !== b.model.fromPrice) return a.model.fromPrice - b.model.fromPrice
      return a.model.slug.localeCompare(b.model.slug)
    })

  const results: FinderResult[] = []
  if (scored.length === 0) return results

  results.push({ ...scored[0], role: 'recommendation' })
  const usedSlugs = new Set([scored[0].model.slug])

  // Más económico entre los que puntúan ≥ 0 y no son el ya elegido.
  const cheaper = scored
    .filter((s) => !usedSlugs.has(s.model.slug))
    .slice()
    .sort((a, b) => a.model.fromPrice - b.model.fromPrice)[0]
  if (cheaper) {
    results.push({ ...cheaper, role: 'cheaper' })
    usedSlugs.add(cheaper.model.slug)
  }

  // Más avanzado: mayor precio entre los restantes.
  const advanced = scored
    .filter((s) => !usedSlugs.has(s.model.slug))
    .slice()
    .sort((a, b) => b.model.fromPrice - a.model.fromPrice)[0]
  if (advanced) {
    results.push({ ...advanced, role: 'advanced' })
  }

  return results
}
