/**
 * Precio en euros.
 *
 * `locale` cambia el formato, no la divisa: el euro sigue siendo el euro en
 * Canarias se mire desde donde se mire. Lo que cambia es el separador de
 * miles y dónde va el símbolo — "1.229 €" en castellano, "€1,229" en inglés.
 * Por defecto castellano, para los sitios que aún no pasan el idioma.
 */
export function euro(value: number, locale = 'es-ES'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Cuota orientativa simple para el simulador (siempre etiquetada como demostrativa)
export function monthlyQuote(price: number, months: number): number {
  return Math.round((price / months) * 100) / 100
}
