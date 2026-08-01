import type { ClaveTexto } from '../lib/i18n'

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
  /** Clave de traducción del rótulo corto. */
  title: ClaveTexto
  /** Clave de traducción de la descripción. */
  text: ClaveTexto
  icon?: string
  status: ClaimStatus
  source?: string
  verifiedAt?: string
  disclaimer?: ClaveTexto
}

export const DEMO_DISCLAIMER: ClaveTexto = 'claim.disclaimer'

export const commercialClaims: Record<string, CommercialClaim> = {
  envio24: {
    id: 'envio24',
    title: 'claim.shipping.title',
    text: 'claim.shipping.text',
    icon: 'truck',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
  financiacion0: {
    id: 'financiacion0',
    title: 'claim.financing.title',
    text: 'claim.financing.text',
    icon: 'credit-card',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
  soporteOficial: {
    id: 'soporteOficial',
    title: 'claim.repair.title',
    text: 'claim.repair.text',
    icon: 'shield',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
  tiendasCanarias: {
    id: 'tiendasCanarias',
    title: 'claim.stores.title',
    text: 'claim.stores.text',
    icon: 'store',
    status: 'verified',
    source: 'https://tienda.bananacomputer.com/',
    verifiedAt: '2026-07-26',
  },
  planRenove400: {
    id: 'planRenove400',
    title: 'claim.tradeIn.title',
    text: 'claim.tradeIn.text',
    icon: 'refresh',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
  formacion: {
    id: 'formacion',
    title: 'claim.training.title',
    text: 'claim.training.text',
    icon: 'graduation',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
  seguroMensual: {
    id: 'seguroMensual',
    title: 'claim.insurance.title',
    text: 'claim.insurance.text',
    icon: 'shield',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
  stockDemo: {
    id: 'stockDemo',
    title: 'claim.stock.title',
    text: 'claim.stock.text',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
  precioDemo: {
    id: 'precioDemo',
    title: 'claim.price.title',
    text: 'claim.price.text',
    status: 'demo',
    disclaimer: DEMO_DISCLAIMER,
  },
}

export function claim(id: keyof typeof commercialClaims): CommercialClaim {
  return commercialClaims[id]
}
