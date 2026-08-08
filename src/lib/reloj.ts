import { useEffect, useState } from 'react'

// Un reloj compartido que avanza una vez por minuto.
//
// POR QUÉ NO UN INTERVALO POR COMPONENTE
//
// Lo necesita el distintivo de estado de cada tienda, y en `/tiendas` hay una
// tarjeta por tienda. Con un intervalo por tarjeta, abrir esa página crearía
// tantos temporizadores como tiendas, todos despertando en momentos distintos
// y provocando renders desperdigados. Con uno solo, todas las tarjetas cambian
// a la vez —que además es lo correcto: si el minuto pasa, pasa para todas— y el
// coste no depende de cuántas se pinten.
//
// El temporizador sólo existe mientras alguien mira: se crea con el primer
// suscriptor y se destruye con el último.
//
// PRECISIÓN
//
// Al minuto, no al segundo: lo único que depende de esto es cruzar un umbral de
// media hora. El primer salto se alinea con el cambio de minuto del reloj para
// que «09:30» se note al dar las 09:30 y no hasta cincuenta y nueve segundos
// después.

type Oyente = (ahora: Date) => void

const oyentes = new Set<Oyente>()
let temporizador: ReturnType<typeof setTimeout> | null = null

function avisar() {
  const ahora = new Date()
  for (const oyente of oyentes) {
    // Cada oyente en su propio `try`: uno que falle no puede dejar sin avisar
    // a los demás ni tumbar el temporizador.
    try {
      oyente(ahora)
    } catch (error) {
      console.error('[reloj] un oyente falló', error)
    }
  }
}

/**
 * Al volver a una pestaña que estuvo en segundo plano, se recalcula al momento.
 *
 * Los navegadores frenan los temporizadores de las pestañas ocultas, así que al
 * volver el estado podría estar hasta un minuto viejo. Es justo el caso que
 * esto viene a resolver —dejar la pantalla abierta—, así que conviene no
 * esperar al siguiente tic.
 */
function alVolverAlFrente() {
  if (typeof document === 'undefined' || document.visibilityState !== 'visible') return
  avisar()
  if (temporizador !== null) {
    clearTimeout(temporizador)
    programarSiguiente()
  }
}

function programarSiguiente() {
  const ahora = new Date()
  const faltaParaElMinuto = 60_000 - (ahora.getSeconds() * 1000 + ahora.getMilliseconds())
  temporizador = setTimeout(() => {
    avisar()
    programarSiguiente()
  }, faltaParaElMinuto)
}

/**
 * Se apunta a los avisos del minuto. Devuelve la función para darse de baja.
 *
 * Lo usa `useAhora`; se exporta además para poder comprobar en las pruebas que
 * varios oyentes comparten un único temporizador, que es la razón de ser de
 * este módulo.
 */
export function suscribir(oyente: Oyente): () => void {
  oyentes.add(oyente)
  if (temporizador === null) {
    programarSiguiente()
    // `typeof`: este módulo se importa también desde las pruebas unitarias,
    // que corren en Node y no tienen documento.
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', alVolverAlFrente)
  }

  return () => {
    oyentes.delete(oyente)
    if (oyentes.size === 0 && temporizador !== null) {
      clearTimeout(temporizador)
      temporizador = null
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', alVolverAlFrente)
    }
  }
}

/**
 * El momento actual, refrescado cada minuto.
 *
 * @param fijo Si se pasa, se devuelve tal cual y no se suscribe a nada. Sirve
 *   para fijar el momento en las pruebas sin tocar el reloj del sistema.
 */
export function useAhora(fijo?: Date): Date {
  const [ahora, setAhora] = useState(() => fijo ?? new Date())

  useEffect(() => {
    if (fijo) return suscribirNada()
    return suscribir(setAhora)
  }, [fijo])

  return fijo ?? ahora
}

/** Con momento fijo no hay nada a lo que suscribirse. */
function suscribirNada() {
  return () => {}
}

/** Sólo para las pruebas: cuántos oyentes hay y si el temporizador está vivo. */
export const _reloj = {
  oyentes: () => oyentes.size,
  activo: () => temporizador !== null,
}
