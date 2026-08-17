// El identificador de un pedido.
//
// POR QUÉ DEJA DE SER `BC-` + SEIS CIFRAS
//
// El formato anterior era `'BC-' + Math.floor(100000 + Math.random() * 899999)`:
// 900.000 valores posibles, y `pedidos.id` es la CLAVE PRIMARIA de la tabla. Con
// ese espacio, la probabilidad de que dos pedidos cualesquiera choquen pasa del
// 50 % alrededor de los 1.100 pedidos —la paradoja del cumpleaños—, y `Math.random`
// además no promete independencia entre pestañas ni entre dispositivos.
//
// Mientras el pedido sólo se escribía con la sesión ya iniciada, un choque era
// un `insert` fallido y poco más. Desde que el identificador es también la
// ENTRADA de la reconciliación de una compra invitada, un choque significa que
// una compra legítima no se puede reclamar. Así que los pedidos nuevos usan una
// fuente de aleatoriedad criptográfica.
//
// SE CONSERVA EL PREFIJO
//
// `BC-` sigue delante: identifica visualmente un pedido de esta demostración y
// evita confundirlo con uno de la web oficial. Lo que cambia es lo que viene
// detrás.

/** Cuántos caracteres hexadecimales lleva la parte aleatoria. */
const LONGITUD = 12

/**
 * Un identificador nuevo: `BC-` y 12 hexadecimales en mayúscula.
 *
 * 48 bits de entropía criptográfica —`crypto.getRandomValues`—, es decir
 * 2,8 × 10¹⁴ valores. Para llegar al 50 % de probabilidad de colisión harían
 * falta del orden de veinte millones de pedidos, y sigue siendo corto para
 * leerlo en voz alta o teclearlo.
 *
 * `crypto` existe en todos los navegadores que la aplicación soporta y en el
 * WebView del binario; no hay respaldo con `Math.random` a propósito, porque un
 * respaldo silencioso devolvería justo el problema que esto viene a resolver.
 */
export function nuevoIdDePedido(): string {
  const bytes = new Uint8Array(LONGITUD / 2)
  crypto.getRandomValues(bytes)
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `BC-${hex.toUpperCase()}`
}

/**
 * ¿Esto tiene forma de identificador de pedido?
 *
 * Acepta el formato nuevo **y el antiguo**: en `pedidos` hay filas con `BC-123456`
 * y en el almacenamiento de alguien puede quedar un pedido escrito por una
 * versión anterior. Rechazarlos sería romper datos que ya existen.
 */
export function esIdDePedido(valor: unknown): valor is string {
  return typeof valor === 'string' && /^BC-([0-9A-F]{12}|\d{6})$/.test(valor)
}
