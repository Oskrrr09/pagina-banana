// Afirmaciones comerciales del prototipo. TODAS son demostrativas hasta que
// Banana Computer valide plazos, precios, condiciones y disponibilidad. Se
// centralizan aquí para no dispersar textos por componentes ni presentar
// como reales condiciones que aún no lo son.
//
// Cada entrada incluye:
// - id: identificador estable para referenciar desde componentes/tests.
// - title: etiqueta corta (chip / listado).
// - text: descripción algo más larga.
// - status: 'demo' | 'verified' | 'pending'.
// - source / verifiedAt: opcionales; se rellenan cuando pasan a 'verified'.
// - disclaimer: nota fija que puede acompañar a la afirmación.

export type ClaimStatus = 'demo' | 'verified' | 'pending'

export interface CommercialClaim {
  id: string
  title: string
  text: string
  icon?: string
  status: ClaimStatus
  source?: string
  verifiedAt?: string
  disclaimer?: string
}

export const DEMO_DISCLAIMER = 'Condición demostrativa · pendiente de validación con Banana Computer.'

export const commercialClaims: Record<string, CommercialClaim> = {
  envio24: {
    id: 'envio24',
    title: 'Envío 24-48 h',
    text: 'Plazo estimado de ejemplo para pedidos a Canarias.',
    icon: 'truck',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
  financiacion0: {
    id: 'financiacion0',
    title: 'Financiación al 0 %',
    text: 'Simulador orientativo hasta 24 meses.',
    icon: 'credit-card',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
  soporteOficial: {
    id: 'soporteOficial',
    title: 'Servicio técnico oficial',
    text: 'Referencia demostrativa a Apple Premium Reseller.',
    icon: 'shield',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
  tiendasCanarias: {
    id: 'tiendasCanarias',
    title: '5 tiendas en Canarias',
    text: 'Ubicaciones tomadas de la web de Banana Computer el 2026-07-26.',
    icon: 'store',
    status: 'verified',
    source: 'https://tienda.bananacomputer.com/',
    verifiedAt: '2026-07-26',
  },
  planRenove400: {
    id: 'planRenove400',
    title: 'Hasta 400 € por tu dispositivo',
    text: 'Cantidad demostrativa. La tasación real se realiza en tienda.',
    icon: 'refresh',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
  formacion: {
    id: 'formacion',
    title: 'Talleres en tienda',
    text: 'Formación demostrativa asociada a la marca; oferta y condiciones sin confirmar.',
    icon: 'graduation',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
  seguroMensual: {
    id: 'seguroMensual',
    title: 'Seguro a todo riesgo',
    text: '8,99 €/mes por unidad como cantidad de ejemplo; contratación real pendiente.',
    icon: 'shield',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
  stockDemo: {
    id: 'stockDemo',
    title: 'Stock de ejemplo',
    text: 'La disponibilidad mostrada es orientativa; no se consulta stock real.',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
  precioDemo: {
    id: 'precioDemo',
    title: 'Precio demostrativo',
    text: 'Los precios se muestran a efectos de prototipo y no reflejan ofertas activas.',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
}

export function claim(id: keyof typeof commercialClaims): CommercialClaim {
  return commercialClaims[id]
}
