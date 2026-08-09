import { useEffect, useState } from 'react'
import { encajarAncho, guardarAncho, leerAnchoGuardado, MAXIMO_PROPORCION, MINIMO_LISTA } from '../../lib/panelDivisor'

// Divisor vertical arrastrable entre la lista de conversaciones y la
// conversación abierta.
//
// POR QUÉ HACE FALTA
//
// La lista era `w-80 shrink-0`: 320 px fijos que no cedían nunca. En una
// ventana de 900 px la conversación se quedaba con 580, y en una de 700 con
// 380, que es donde el canal, la asignación y la caja de respuesta empiezan a
// amontonarse. Quien atiende pasa el día en una de las dos columnas según lo
// que esté haciendo, y cuál de las dos cambia a lo largo del día: la única
// respuesta honesta es dejar que lo decida.
//
// ES UN CONTROL, NO UNA DECORACIÓN
//
// Lleva `role="separator"`, entra en el orden de tabulación y se ajusta con las
// flechas —20 px, o hasta el extremo con Inicio y Fin—. Un `div` que sólo
// responde al ratón deja fuera a quien navega con teclado, y este panel es una
// herramienta de trabajo interno: se usa muchas horas seguidas.

const PASO_TECLADO = 20

export function DivisorPanel({
  ancho,
  onAncho,
  anchoContenedor,
  izquierdaContenedor,
}: {
  ancho: number
  onAncho: (siguiente: number) => void
  /** Espacio total de las dos columnas, para encajar contra él. */
  anchoContenedor: number
  /** Borde izquierdo, para traducir la posición del puntero a un ancho. */
  izquierdaContenedor: number
}) {
  /**
   * El arrastre se engancha en el propio `pointerdown`, no en un efecto.
   *
   * Y los oyentes van en `window`, no en el divisor: el puntero se adelanta al
   * arrastrar rápido y, si sólo escuchara el elemento, el arrastre se soltaría
   * solo al salirse de sus nueve píxeles de ancho.
   */
  function empezarArrastre(xInicial: number) {
    // El último ancho calculado vive aquí y no en un `ref`: al soltar hay que
    // guardar el ancho final, y el que se cerró en el `pointerdown` sería el
    // de antes de arrastrar.
    let ultimo = encajarAncho(xInicial - izquierdaContenedor, anchoContenedor)
    onAncho(ultimo)

    const mover = (e: PointerEvent) => {
      e.preventDefault()
      ultimo = encajarAncho(e.clientX - izquierdaContenedor, anchoContenedor)
      onAncho(ultimo)
    }
    const soltar = () => {
      document.body.style.removeProperty('cursor')
      document.body.style.removeProperty('user-select')
      guardarAncho(ultimo)
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
    }

    // Mientras se arrastra, el cursor manda en toda la ventana: si no, al pasar
    // por encima del texto vuelve a ser de selección y parece que el arrastre
    // se ha soltado.
    document.body.style.setProperty('cursor', 'col-resize')
    document.body.style.setProperty('user-select', 'none')
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', soltar)
  }

  function conTeclado(e: React.KeyboardEvent) {
    let pedido: number | null = null
    if (e.key === 'ArrowLeft') pedido = ancho - PASO_TECLADO
    if (e.key === 'ArrowRight') pedido = ancho + PASO_TECLADO
    if (e.key === 'Home') pedido = 0
    if (e.key === 'End') pedido = anchoContenedor
    if (pedido === null) return
    e.preventDefault()
    const encajado = encajarAncho(pedido, anchoContenedor)
    onAncho(encajado)
    guardarAncho(encajado)
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Ancho de la lista de conversaciones"
      tabIndex={0}
      aria-valuenow={Math.round(ancho)}
      aria-valuemin={MINIMO_LISTA}
      aria-valuemax={Math.round(anchoContenedor * MAXIMO_PROPORCION)}
      data-divisor-panel
      onPointerDown={(e) => {
        e.preventDefault()
        empezarArrastre(e.clientX)
      }}
      onKeyDown={conTeclado}
      // 1 px de línea, 9 px de zona de agarre: una línea de un píxel es
      // imposible de coger con el ratón y peor con el dedo.
      className="group relative w-[9px] shrink-0 cursor-col-resize touch-none bg-transparent focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line transition-colors group-hover:bg-ink/30 group-focus-visible:bg-ink"
      />
    </div>
  )
}

/**
 * Ancho de la lista, y la caja del contenedor con la que se encaja.
 *
 * La caja se guarda en estado y no se lee del `ref` al pintar: leer un `ref`
 * durante el render no garantiza que el componente se actualice cuando cambia.
 */
export function useAnchoLista(contenedor: React.RefObject<HTMLDivElement | null>) {
  const [ancho, setAncho] = useState(() => leerAnchoGuardado())
  const [caja, setCaja] = useState({ ancho: 0, izquierda: 0 })

  useEffect(() => {
    const medir = () => {
      const r = contenedor.current?.getBoundingClientRect()
      if (!r || r.width === 0) return
      setCaja({ ancho: r.width, izquierda: r.left })
      // Al cambiar el tamaño de la ventana, el ancho guardado puede haber
      // dejado de caber: se reencaja en vez de quedarse con un número que
      // estrangula la conversación.
      setAncho((actual) => encajarAncho(actual, r.width))
    }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [contenedor])

  return { ancho, setAncho, caja }
}
