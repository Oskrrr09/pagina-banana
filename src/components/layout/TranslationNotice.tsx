import { useState } from 'react'
import { Icon } from '../ui/Icon'
import { useIdioma } from '../../lib/i18n'

const CLAVE_DESCARTADO = 'banana:aviso-traduccion'

/**
 * Aviso de que lo que se está leyendo es una traducción demostrativa.
 *
 * Solo aparece fuera del castellano. No es un formalismo: el prototipo traduce
 * también condiciones de garantía, financiación, seguro y Plan Renove, y una
 * traducción aproximada de una condición puede afirmar algo que Banana no
 * ofrece. Mientras el texto no lo dé Banana en cada idioma, hay que decirlo.
 *
 * Va en el flujo, encima del contenido, y no como capa flotante: un aviso que
 * tapa media pantalla se cierra sin leerlo.
 */
export function TranslationNotice() {
  const { t, traducido, setIdioma } = useIdioma()
  const [descartado, setDescartado] = useState(() => {
    try {
      return window.localStorage.getItem(CLAVE_DESCARTADO) === '1'
    } catch {
      return false
    }
  })

  if (!traducido || descartado) return null

  function descartar() {
    try {
      window.localStorage.setItem(CLAVE_DESCARTADO, '1')
    } catch {
      // Sin persistencia; se vuelve a ver en la próxima visita, que no es grave.
    }
    setDescartado(true)
  }

  return (
    <aside
      data-translation-notice
      aria-label={t('lang.demoNotice.title')}
      className="border-b border-line bg-brand-050 px-4 py-2.5 sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <Icon name="info" size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink/60" />
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-ink">
          <span className="font-semibold">{t('lang.demoNotice.title')}.</span>{' '}
          {t('lang.demoNotice.body')}{' '}
          <button
            type="button"
            onClick={() => setIdioma('es')}
            className="font-semibold underline underline-offset-2 hover:text-ink/70"
          >
            {t('lang.demoNotice.switch')}
          </button>
        </p>
        <button
          type="button"
          onClick={descartar}
          aria-label={t('lang.demoNotice.dismiss')}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink/60 hover:bg-black/5 hover:text-ink"
        >
          <Icon name="close" size={14} aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
