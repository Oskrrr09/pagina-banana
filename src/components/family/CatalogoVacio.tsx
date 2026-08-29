import { Button, ButtonLink } from '../ui/Button'
import { useIdioma } from '../../lib/i18n'
import { FILTROS_VACIOS, type FiltrosCatalogo } from '../../lib/catalogFilters'

/**
 * Qué se enseña cuando ningún modelo cumple los filtros.
 *
 * Antes sólo decía que no había coincidencias y dejaba a la persona ahí parada.
 * Ahora ofrece las dos salidas que existen de verdad: deshacer los filtros —sin
 * tocarlos por su cuenta— y el asistente, que es literalmente para cuando no se
 * sabe qué elegir. No se enseña ningún producto que no cumpla el filtro.
 *
 * Es de las dos plataformas: el mensaje y las salidas son los mismos en la web
 * y en la app, así que aquí no hay nada que separar.
 */
export function CatalogoVacio({ onLimpiar }: { onLimpiar: (siguiente: FiltrosCatalogo) => void }) {
  const { t } = useIdioma()

  return (
    <div role="region" aria-label={t('catalog.noResults')} className="py-10 text-center">
      <p className="text-muted">{t('catalog.noResults')}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={() => onLimpiar(FILTROS_VACIOS)}>
          {t('catalog.clearFilters')}
        </Button>
        <ButtonLink to="/elige-tu-apple" variant="secondary">
          {t('home.finder.title')}
        </ButtonLink>
      </div>
    </div>
  )
}
