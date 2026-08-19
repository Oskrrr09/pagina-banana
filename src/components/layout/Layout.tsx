import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { FavoriteStoreDialogs, VARIABLE_BANDA } from './FavoriteStoreDialogs'
import { AppTabBar } from './AppTabBar'
import { AppCategoryChips, AppTopBar } from './AppTopBar'
import { TranslationNotice } from './TranslationNotice'
import { isNativeApp } from '../../lib/nativeApp'

// Layout general. Al cambiar de ruta, sube al inicio (salvo anclas #).
export function Layout() {
  const { pathname, hash } = useLocation()
  const contenidoRef = useRef<HTMLElement>(null)

  // Marca el documento para que el CSS le quite el scroll: en la app manda
  // el contenedor de contenido, no la ventana.
  useEffect(() => {
    if (!isNativeApp) return
    document.documentElement.setAttribute('data-app-shell', '')
    return () => document.documentElement.removeAttribute('data-app-shell')
  }, [])

  useEffect(() => {
    if (hash) return
    // En la app el que se desplaza es el contenedor, no la ventana.
    if (isNativeApp) contenidoRef.current?.scrollTo({ top: 0 })
    else window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])

  return (
    <div
      className={isNativeApp ? 'flex h-[100dvh] flex-col' : 'flex min-h-screen flex-col'}
      // RESERVA PARA EL AVISO DE TIENDA (sólo en la web)
      //
      // Ahí el aviso es una hoja pegada al borde inferior de la ventana, así que
      // viaja con ella: lo que caiga en su banda se queda debajo por mucho que
      // se desplace la página. Se midió al final del documento, que es el caso
      // sin salida —ya no queda desplazamiento que lo despeje—: a 1280×800 se
      // quedaba «Plan Renove», «Seguimiento de pedido» y «Servicio técnico» del
      // pie, y a 320×568 dos preguntas del acordeón.
      //
      // Reservando su alto por abajo, el documento crece justo lo que el aviso
      // ocupa y todo se puede sacar de debajo desplazándose. En la app la
      // variable no existe —el aviso es un hermano de esta misma columna y ya
      // ocupa su sitio—, y el valor de respaldo deja esto en cero.
      style={isNativeApp ? undefined : { paddingBottom: `var(${VARIABLE_BANDA}, 0px)` }}
    >
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-[8px] focus:bg-brand focus:px-4 focus:py-2 focus:text-ink"
      >
        Saltar al contenido
      </a>
      {/* Dentro de la app, arriba no hay ni logo ni menú: la navegación vive
          abajo, así que ese sitio se aprovecha para buscar. */}
      {isNativeApp ? <AppTopBar /> : <Header />}
      {/* Solo se pinta fuera del castellano; en la app nunca, porque allí no
          hay más idioma que el castellano. */}
      <TranslationNotice />
      <main
        id="contenido"
        ref={contenidoRef}
        // Enfocable por código, fuera del recorrido de Tab: es el destino del
        // enlace "Saltar al contenido" y el sitio al que vuelve el foco
        // cuando se cierra el chat de la app y no queda un origen al que
        // regresar.
        tabIndex={-1}
        // En la app este es el ÚNICO elemento que se desplaza. Las dos barras
        // son hermanas suyas y no se mueven porque nada las mueve.
        // `overscroll-none` en vez de `contain`: además de evitar que el
        // gesto se propague, quita el rebote al llegar al tope. Con rebote,
        // al tirar hacia abajo estando arriba del todo el contenido se
        // separaba de la barra de búsqueda y dejaba ver una franja del fondo
        // entre el amarillo de la barra y el de los filtros.
        className={isNativeApp ? 'min-h-0 flex-1 overflow-y-auto overscroll-none outline-none' : 'flex-1 outline-none'}
      >
        {/* Dentro del contenedor que se desplaza, para que se escondan bajo
            la barra de búsqueda al bajar. */}
        {isNativeApp && <AppCategoryChips />}
        <Outlet />
      </main>
      {/* El pie de página es un mapa del sitio: en la web orienta, pero
          dentro de una app, donde la navegación vive abajo en la barra,
          sobra y alarga cada pantalla.

          EL AVISO DE TIENDA VA EN DISTINTO SITIO SEGÚN DÓNDE ESTEMOS

          En la app es un hermano de esta columna, entre el contenido y la barra
          de pestañas: al abrirse, `main` se encoge y el aviso nunca se pone
          delante de nada. En la web sigue siendo una hoja pegada al borde
          inferior —el comportamiento que fijó la #53— y va al final, con su
          banda reservada arriba por el `paddingBottom` de este mismo div. */}
      {isNativeApp ? (
        <>
          <FavoriteStoreDialogs />
          <AppTabBar />
        </>
      ) : (
        <>
          <Footer />
          <FavoriteStoreDialogs />
        </>
      )}
    </div>
  )
}
