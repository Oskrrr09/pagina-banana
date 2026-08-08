import { useT } from '../../lib/i18n'
import { useAhora } from '../../lib/reloj'
import { estadoDeApertura, type EstadoTienda } from '../../data/stores'
import type { Store } from '../../data/types'

// Distintivo de estado de una tienda.
//
// Existe como componente y no como tres copias del mismo `?:` porque la lógica
// de color y de texto estaba repetida en la lista de tiendas, en la ficha y en
// el diálogo de tienda favorita. Con cuatro estados en vez de dos, mantener esa
// repetición era garantizar que se separasen.
//
// LOS COLORES
//
// Verde y rojo ya estaban escritos a mano en la lista de tiendas y se conservan
// tal cual. El ámbar de los avisos es el mismo par que la disponibilidad «bajo
// pedido» usa en el catálogo, oscurecido en el texto para que contraste sobre
// su fondo: un amarillo de marca sobre claro no se lee, y esto es información,
// no decoración.

const ESTILOS: Record<EstadoTienda, { fondo: string; texto: string; punto: string; clave: ClaveDeEstado }> = {
  abierta: { fondo: 'bg-[#e4f5ea]', texto: 'text-[#2e7a4a]', punto: 'bg-[#2e9a5a]', clave: 'availability.openNow' },
  'cierra-pronto': {
    fondo: 'bg-[#fdf0e3]',
    texto: 'text-[#8a4a08]',
    punto: 'bg-[#cf6a12]',
    clave: 'stores.closingSoon',
  },
  'abre-pronto': {
    fondo: 'bg-[#fdf0e3]',
    texto: 'text-[#8a4a08]',
    punto: 'bg-[#cf6a12]',
    clave: 'stores.openingSoon',
  },
  cerrada: { fondo: 'bg-[#fce8e8]', texto: 'text-[#b13333]', punto: 'bg-[#c14545]', clave: 'availability.closed' },
}

type ClaveDeEstado = 'availability.openNow' | 'availability.closed' | 'stores.openingSoon' | 'stores.closingSoon'

/**
 * SE ACTUALIZA SOLO
 *
 * El estado depende de la hora, así que calcularlo una vez al montar dejaría
 * la pantalla mintiendo: quien abra `/tiendas` a las 09:25 y la deje abierta
 * seguiría viendo «Cerrado» a las 09:35. El reloj compartido de `lib/reloj`
 * avanza una vez por minuto y con un solo temporizador para todas las tarjetas.
 *
 * @param date Sólo para las pruebas: fija el momento y desactiva el refresco.
 */
export function StoreStatus({ store, date, className = '' }: { store: Store; date?: Date; className?: string }) {
  const t = useT()
  const ahora = useAhora(date)
  const estado = estadoDeApertura(store, ahora)
  const estilo = ESTILOS[estado]

  return (
    <span
      data-store-status={estado}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${estilo.fondo} ${estilo.texto} ${className}`}
    >
      {/* El punto es decorativo: el estado se dice también con palabras, que es
          lo que lee quien no distingue el color. */}
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${estilo.punto}`} />
      {t(estilo.clave)}
    </span>
  )
}
