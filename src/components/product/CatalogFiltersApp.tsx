import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { Icon } from '../ui/Icon'
import { euro } from '../../lib/format'
import { useIdioma } from '../../lib/i18n'
import {
  DISPONIBILIDADES,
  ORDENES,
  FILTROS_VACIOS,
  TRAMOS_PRECIO,
  cuentaFiltrosActivos,
  type Disponibilidad,
  type FiltrosCatalogo,
} from '../../lib/catalogFilters'

// Controles de «Filtrar» y «Ordenar» del catálogo de una familia, EN LA APP.
//
// SÓLO LA APP MONTA ESTO
//
// La presentación de aquí —dos botones táctiles del mismo alto y una hoja desde
// abajo— se diseñó en la Fase A para un ancho de 320 px, donde cada píxel por
// delante del producto se nota. En la web hay sitio de sobra y el orden se
// enseña a la vista: eso vive en `CatalogFiltersWeb`.
//
// Las dos comparten `lib/catalogFilters` —los mismos filtros, los mismos
// órdenes, el mismo estado en la URL—; lo único que diverge es cómo se pintan.
// Cuando esto era un solo componente, rediseñarlo «para la app» cambiaba
// también la web sin que nadie lo pidiera.
//
// El panel reutiliza `Modal`, que en móvil ya se abre como hoja desde abajo y
// se encarga de atrapar el foco, cerrar con Escape y devolver el foco al botón
// que lo abrió. Escribir otra hoja aquí habría significado repetir —y con
// suerte acertar— toda esa parte de accesibilidad.
//
// Los filtros que se ofrecen son los que el catálogo puede sostener; el porqué
// de los que faltan está en `lib/catalogFilters.ts`.

export function CatalogFiltersApp({
  filtros,
  onCambiar,
  totalVisible,
  totalSin,
}: {
  filtros: FiltrosCatalogo
  onCambiar: (siguiente: FiltrosCatalogo) => void
  totalVisible: number
  totalSin: number
}) {
  const { t, intl } = useIdioma()
  // QUÉ PANEL SE HA PEDIDO, NO SÓLO SI HAY PANEL
  //
  // Con un booleano, «Ordenar» abría una hoja titulada «Filtrar»: funcionaba,
  // pero quien la abría creía haberse equivocado de botón. El mismo `Modal` se
  // reutiliza —no hace falta otro componente— y lo que cambia es su título y su
  // contenido según por dónde se haya entrado.
  const [panel, setPanel] = useState<'filtros' | 'orden' | null>(null)
  const activos = cuentaFiltrosActivos(filtros)

  const alternarDisponibilidad = (valor: Disponibilidad) => {
    const ya = filtros.disponibilidad.includes(valor)
    onCambiar({
      ...filtros,
      disponibilidad: ya ? filtros.disponibilidad.filter((v) => v !== valor) : [...filtros.disponibilidad, valor],
    })
  }

  const etiquetaOrden = ORDENES.find((o) => o.valor === filtros.orden) ?? ORDENES[0]

  return (
    <div className="mb-2">
      {/* UNA FILA, NO TRES.
          Antes esto ocupaba «Filtrar», una etiqueta con un `<select>` y el
          recuento, cada uno con su alto: ~130 px sumando separaciones, justo
          por delante del primer producto. En 320 px eso bastaba para que no
          entrara ni una tarjeta.

          La funcionalidad no cambia: los mismos filtros, los mismos tres
          órdenes y el mismo estado en la URL. Lo que cambia es que ahora son
          dos controles táctiles del mismo alto y el catálogo empieza justo
          debajo. */}
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setPanel('filtros')}>
          <Icon name="filter" size={16} />
          {t('catalog.filter')}
          {activos > 0 && (
            <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-xs font-bold text-white">
              {activos}
            </span>
          )}
        </Button>

        {/* El orden deja de ser un `<select>` de formulario y abre su propia
            hoja. Sigue siendo alcanzable de un toque y sigue escribiéndose en la
            URL; lo que se va es el lenguaje de escritorio —y con él el problema
            de ancho intrínseco que obligaba a `min-w-0` en tres sitios para que
            «Orden del catálogo» no desbordara a 320—. */}
        {/* EL VALOR SÓLO SE ENSEÑA CUANDO DICE ALGO
            Poner siempre el orden actual dentro del botón parecía informativo y
            a 320 px reventaba: «Ordenar · Orden del catálogo» no cabe, y el
            texto se salía del control en tres líneas. Medido en la captura de
            la Fase A.

            Además el valor por defecto no aporta —«Orden del catálogo» es
            justamente «no he ordenado nada»—, así que se enseña sólo cuando hay
            un orden elegido, y truncado. `min-w-0` porque un elemento flexible
            no encoge por debajo de su contenido sin él. */}
        <Button variant="secondary" size="sm" className="min-w-0" onClick={() => setPanel('orden')}>
          <span className="truncate">
            {t('catalog.sort')}
            {filtros.orden !== 'catalogo' && (
              <span className="font-normal text-muted"> · {t(etiquetaOrden.clave)}</span>
            )}
          </span>
          <Icon name="chevron-down" size={14} aria-hidden="true" className="shrink-0" />
        </Button>
      </div>

      {/* El recuento se anuncia, pero ya no ocupa una tercera pieza delante del
          producto: quien ve la rejilla los está contando con los ojos. Para
          lector de pantalla no cambia nada. */}
      <p aria-live="polite" className="sr-only">
        {t('catalog.showing', { visibles: totalVisible, total: totalSin })}
      </p>

      {/* EL MISMO `Modal`, DOS INTENCIONES
          No se escribe otra hoja: `Modal` ya se abre desde abajo en móvil y se
          encarga del foco, de Escape y de devolver el foco al botón que lo
          abrió. Lo que cambia es el título y lo que hay dentro, para que quien
          pulsó «Ordenar» vea «Ordenar» y no «Filtrar». */}
      <Modal
        open={panel !== null}
        onClose={() => setPanel(null)}
        title={panel === 'orden' ? t('catalog.sort') : t('catalog.filter')}
      >
        {panel === 'orden' ? (
          // Elegir un orden cierra la hoja: es una decisión única, no una
          // combinación que se vaya montando. Los valores y la URL no cambian.
          <fieldset className="border-0 p-0">
            <legend className="sr-only">{t('catalog.sort')}</legend>
            <div className="flex flex-wrap gap-2">
              {ORDENES.map((o) => (
                <Chip
                  key={o.valor}
                  selected={filtros.orden === o.valor}
                  onClick={() => {
                    onCambiar({ ...filtros, orden: o.valor })
                    setPanel(null)
                  }}
                >
                  {t(o.clave)}
                </Chip>
              ))}
            </div>
          </fieldset>
        ) : (
          <>
            <fieldset className="border-0 p-0">
              <legend className="text-sm font-bold text-ink">{t('catalog.maxPrice')}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                <Chip selected={filtros.precioMax == null} onClick={() => onCambiar({ ...filtros, precioMax: null })}>
                  {t('catalog.anyPrice')}
                </Chip>
                {TRAMOS_PRECIO.map((tope) => (
                  <Chip
                    key={tope}
                    selected={filtros.precioMax === tope}
                    onClick={() => onCambiar({ ...filtros, precioMax: tope })}
                  >
                    {t('catalog.upTo', { precio: euro(tope, intl) })}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-6 border-0 p-0">
              <legend className="text-sm font-bold text-ink">{t('catalog.availability')}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {DISPONIBILIDADES.map((d) => (
                  <Chip
                    key={d.valor}
                    selected={filtros.disponibilidad.includes(d.valor)}
                    onClick={() => alternarDisponibilidad(d.valor)}
                  >
                    {t(d.clave)}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <div className="mt-8 flex gap-3">
              <Button variant="secondary" onClick={() => onCambiar({ ...FILTROS_VACIOS, orden: filtros.orden })}>
                {t('catalog.clearFilters')}
              </Button>
              <Button className="flex-1" onClick={() => setPanel(null)}>
                {t('catalog.showResults', { total: totalVisible })}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
