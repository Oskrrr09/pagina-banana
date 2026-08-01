import type { ClaveTexto } from '../lib/i18n'

// Textos de marketing y datos de secundarias (apartado 7). Todo de ejemplo.
//
// Los rótulos son **claves de traducción**, no texto: este fichero alimenta
// servicios, Plan Renove y el centro de soporte, que se ven en los cinco
// idiomas. El texto castellano vive en `src/i18n/es.ts`.

export const services: { slug: string; icon: string; name: ClaveTexto; line: ClaveTexto; note: ClaveTexto }[] = [
  { slug: 'financiacion', icon: 'credit-card', name: 'service.financing.name', line: 'service.financing.line', note: 'note.pendingValidation' },
  { slug: 'envios', icon: 'truck', name: 'service.shipping.name', line: 'service.shipping.line', note: 'note.pendingValidation' },
  { slug: 'plan-renove', icon: 'refresh', name: 'service.tradeIn.name', line: 'service.tradeIn.line', note: 'note.provisional' },
  { slug: 'seguro', icon: 'shield', name: 'service.insurance.name', line: 'service.insurance.line', note: 'note.pendingValidation' },
  { slug: 'educacion', icon: 'graduation', name: 'service.education.name', line: 'service.education.line', note: 'note.pendingValidation' },
]

// `title` y `note` son claves de traducción, no texto.
export const advantages: { icon: string; title: ClaveTexto; note: ClaveTexto }[] = [
  { icon: 'truck', title: 'advantage.shipping', note: 'note.pendingValidation' },
  { icon: 'store', title: 'advantage.pickup', note: 'note.pendingValidation' },
  { icon: 'star', title: 'advantage.specialists', note: 'note.provisional' },
  { icon: 'shield', title: 'advantage.insurance', note: 'note.pendingValidation' },
]

export const homeFaq: { q: ClaveTexto; a: ClaveTexto; note: ClaveTexto }[] = [
  { q: 'faq.shipping.q', a: 'faq.shipping.a', note: 'note.pendingValidation' },
  { q: 'faq.financing.q', a: 'faq.financing.a', note: 'note.pendingValidation' },
  { q: 'faq.tradeIn.q', a: 'faq.tradeIn.a', note: 'note.provisional' },
]

export const serviceFaq: { q: ClaveTexto; a: ClaveTexto; note: ClaveTexto }[] = [
  { q: 'serviceFaq.shipping.q', a: 'serviceFaq.shipping.a', note: 'note.pendingValidation' },
  { q: 'serviceFaq.financing.q', a: 'serviceFaq.financing.a', note: 'note.pendingValidation' },
  { q: 'serviceFaq.tradeIn.q', a: 'serviceFaq.tradeIn.a', note: 'note.provisional' },
]

export const planRenoveDevices = ['iPhone', 'iPad', 'Mac', 'Apple Watch']

export const planRenoveSteps: ClaveTexto[] = [
  'tradeIn.step1',
  'tradeIn.step2',
  'tradeIn.step3',
]

export const planRenoveFaq: { q: ClaveTexto; a: ClaveTexto; note: ClaveTexto }[] = [
  { q: 'tradeInFaq.docs.q', a: 'tradeInFaq.docs.a', note: 'note.provisional' },
  { q: 'tradeInFaq.time.q', a: 'tradeInFaq.time.a', note: 'note.provisional' },
  { q: 'tradeInFaq.rejected.q', a: 'tradeInFaq.rejected.a', note: 'note.provisional' },
]

// Centro de soporte
export const supportQuickLinks: { icon: string; title: ClaveTexto; desc: ClaveTexto }[] = [
  { icon: 'package', title: 'support.tracking.title', desc: 'support.tracking.desc' },
  { icon: 'wrench', title: 'support.prepare.title', desc: 'support.prepare.desc' },
  { icon: 'chat', title: 'support.contact.title', desc: 'support.contact.desc' },
  { icon: 'shield', title: 'support.warranty.title', desc: 'support.warranty.desc' },
]

export const supportTopics: {
  topic: ClaveTexto
  items: { q: ClaveTexto; a: ClaveTexto; note: ClaveTexto }[]
}[] = [
  {
    topic: 'supportTopic.orders',
    items: [
      { q: 'supportFaq.track.q', a: 'supportFaq.track.a', note: 'note.provisional' },
      { q: 'supportFaq.address.q', a: 'supportFaq.address.a', note: 'note.pendingValidation' },
    ],
  },
  {
    topic: 'supportTopic.shipping',
    items: [{ q: 'supportFaq.outside.q', a: 'supportFaq.outside.a', note: 'note.pendingValidation' }],
  },
  {
    topic: 'supportTopic.warranty',
    items: [{ q: 'supportFaq.warranty.q', a: 'supportFaq.warranty.a', note: 'note.pendingValidation' }],
  },
  {
    topic: 'supportTopic.payments',
    items: [{ q: 'supportFaq.payments.q', a: 'supportFaq.payments.a', note: 'note.pendingValidation' }],
  },
  {
    topic: 'supportTopic.repairs',
    items: [{ q: 'supportFaq.repair.q', a: 'supportFaq.repair.a', note: 'note.provisional' }],
  },
]
