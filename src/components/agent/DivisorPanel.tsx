import { useEffect, useRef, useState } from 'react'
import { encajarAncho, guardarAncho, leerAnchoGuardado, maximoLista, MINIMO_LISTA } from '../../lib/panelDivisor'

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
   * El desmontaje tiene que poder cerrar un arrastre en curso.
   *
   * Los oyentes viven en `window` y los estilos en el `body`, así que si el
   * divisor desaparece a mitad de arrastre —el ancho baja de 768 y la
   * composición pasa a la rama móvil— no queda nadie que los quite. Medido: el
   * `body` se queda con `cursor: col-resize; user-select: none`, y si el
   * puntero se suelta fuera de la ventana no llega el `pointerup` que los
   * limpiaría. Eso deja toda la aplicación sin poder seleccionar texto.
   */
  const soltarPendiente = useRef<(() => void) | null>(null)
  useEffect(() => () => soltarPendiente.current?.(), [])

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
      soltarPendiente.current = null
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
    soltarPendiente.current = soltar
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

  // Hasta que el bloque no está medido no hay rango que anunciar.
  //
  // Con el contenedor a 0 el máximo sale negativo, y en el primer render el
  // separator se exponía como `valuemin=280 · valuemax=-369 · valuenow=400`:
  // un rango imposible, en el que el valor actual está fuera de sus propios
  // límites. Pasaba en los seis anchos, y también al cruzar de móvil a
  // escritorio. Se reserva el hueco —los mismos 9 px, para no dar un salto al
  // medir— sin anunciar nada ni entrar en el orden de tabulación: un control
  // que aún no puede operarse no debería ofrecerse como si pudiera.
  if (anchoContenedor <= 0) {
    return (
      <div aria-hidden="true" className="relative w-[9px] shrink-0">
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line" />
      </div>
    )
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Ancho de la lista de conversaciones"
      tabIndex={0}
      aria-valuenow={Math.round(ancho)}
      aria-valuemin={MINIMO_LISTA}
      // El máximo REAL, no el proporcional: anunciar un número al que no se
      // puede llegar sin romper la conversación es mentirle a quien navega con
      // teclado o con lector de pantalla.
      aria-valuemax={Math.round(maximoLista(anchoContenedor))}
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
 *
 * SE OBSERVA EL ELEMENTO, NO LA VENTANA
 *
 * Antes esto medía en un `resize` de `window`, y al pasar de móvil a escritorio
 * el divisor aparecía con el contenedor a 0: el evento llega ANTES de que React
 * monte la rama de escritorio, así que no había nada que medir y no volvía a
 * haber otro evento. `aria-valuemax` anunciaba −369 y el arrastre no respondía
 * hasta recargar.
 *
 * Con un `ResizeObserver` sobre el propio bloque, la medida se toma cuando el
 * elemento existe y cada vez que cambia de tamaño, venga de donde venga el
 * cambio. El `ref` es una función para engancharlo en ese mismo instante.
 */
export function useAnchoLista() {
  const [ancho, setAncho] = useState(() => leerAnchoGuardado())
  const [caja, setCaja] = useState({ ancho: 0, izquierda: 0 })
  const [nodo, setNodo] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!nodo) return

    const medir = () => {
      const r = nodo.getBoundingClientRect()
      if (r.width === 0) return
      setCaja({ ancho: r.width, izquierda: r.left })
      // Si el bloque encoge, el ancho guardado puede haber dejado de caber: se
      // reencaja en vez de quedarse con un número que estrangula la
      // conversación.
      setAncho((actual) => encajarAncho(actual, r.width))
    }

    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(nodo)
    // El borde izquierdo puede moverse sin que cambie el ancho —una barra
    // lateral que aparece—, y de ahí se traduce el puntero a un ancho.
    window.addEventListener('resize', medir)
    return () => {
      observador.disconnect()
      window.removeEventListener('resize', medir)
    }
  }, [nodo])

  return { ancho, setAncho, caja, refContenedor: setNodo }
}
