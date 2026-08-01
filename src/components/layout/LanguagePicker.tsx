import { useEffect, useRef, useState } from 'react'
import { Flag } from '../ui/Flag'
import { Icon } from '../ui/Icon'
import { IDIOMAS, useIdioma, type Idioma } from '../../lib/i18n'

/**
 * Selector de idioma de la cabecera.
 *
 * Solo en la web: dentro de la app no se monta (ver `src/lib/i18n.tsx`).
 *
 * Es un menú de verdad y no un `<select>` porque hay que enseñar la bandera
 * junto al nombre, y un `<select>` nativo no admite imágenes. A cambio hay que
 * poner a mano lo que el nativo trae de serie: cerrar con Escape, cerrar al
 * pulsar fuera y devolver el foco al botón.
 */
export function LanguagePicker() {
  const { idioma, setIdioma, t } = useIdioma()
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const botonRef = useRef<HTMLButtonElement>(null)

  const actual = IDIOMAS.find((i) => i.code === idioma) ?? IDIOMAS[0]

  useEffect(() => {
    if (!abierto) return

    function alPulsarFuera(evento: MouseEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) setAbierto(false)
    }
    function alTeclear(evento: KeyboardEvent) {
      if (evento.key !== 'Escape') return
      evento.preventDefault()
      setAbierto(false)
      botonRef.current?.focus()
    }

    document.addEventListener('mousedown', alPulsarFuera)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('mousedown', alPulsarFuera)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto])

  function elegir(siguiente: Idioma) {
    setIdioma(siguiente)
    setAbierto(false)
    botonRef.current?.focus()
  }

  return (
    <div ref={contenedorRef} className="relative">
      <button
        ref={botonRef}
        type="button"
        // Marcador estable: la etiqueta accesible cambia con el idioma, así
        // que no sirve para encontrarlo desde las pruebas.
        data-language-picker
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label={t('lang.current', { idioma: actual.label })}
        // Compacto a propósito: solo bandera y flecha. Con el código de
        // idioma al lado ("ES", "EN") el grupo de iconos crecía lo justo para
        // comerse el aire que lo separaba del menú de dispositivos. El nombre
        // del idioma sigue estando en la etiqueta accesible y en el desplegable.
        className="flex h-10 items-center gap-1 rounded-full px-1.5 text-ink hover:bg-black/5"
      >
        <Flag code={actual.bandera} />
        <Icon
          name="chevron-down"
          size={12}
          aria-hidden="true"
          className={`transition-transform ${abierto ? 'rotate-180' : ''}`}
        />
      </button>

      {abierto && (
        <ul
          role="menu"
          aria-label={t('lang.choose')}
          className="absolute right-0 top-full z-50 mt-1 min-w-44 overflow-hidden rounded-[12px] border border-line bg-surface py-1 shadow-[var(--shadow-raised)]"
        >
          {IDIOMAS.map((opcion) => {
            const activo = opcion.code === idioma
            return (
              <li key={opcion.code} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={activo}
                  onClick={() => elegir(opcion.code)}
                  // `lang` en cada opción: así un lector de pantalla pronuncia
                  // "Deutsch" en alemán y no en castellano.
                  lang={opcion.code}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${
                    activo ? 'bg-brand-050 font-semibold text-ink' : 'text-ink hover:bg-neutral'
                  }`}
                >
                  <Flag code={opcion.bandera} />
                  <span className="flex-1">{opcion.label}</span>
                  {activo && <Icon name="check" size={14} aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
