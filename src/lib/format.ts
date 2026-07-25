export function euro(value: number): string {
  return new Intl.NumberFormat('es-ES', {
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
