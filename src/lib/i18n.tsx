import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { isNativeApp } from './nativeApp'
import { traducirCatalogo } from '../i18n/catalogo'
import { es } from '../i18n/es'
import { en } from '../i18n/en'
import { de } from '../i18n/de'
import { fr } from '../i18n/fr'
import { it } from '../i18n/it'

/**
 * Idiomas de la tienda.
 *
 * Canarias vende a mucho visitante extranjero, así que la tienda se ofrece en
 * los idiomas de sus mercados principales además del castellano.
 *
 * Solo en la **web**: dentro de la app no hay selector y todo va en
 * castellano. Quien se descarga la app de una tienda de Canarias vive aquí;
 * el visitante extranjero entra por la web. La maquinaria es la misma, así
 * que si algún día hace falta, es cuestión de montar el selector.
 *
 * **Las traducciones son demostrativas**, igual que los precios: las ha
 * generado el prototipo, no Banana. El texto que vale es el castellano, y así
 * se avisa en pantalla mientras se navega en otro idioma. Importa sobre todo
 * en garantía, financiación, seguro y Plan Renove, donde una traducción
 * aproximada podría afirmar algo que Banana no ofrece.
 */

export const IDIOMAS = [
  { code: 'es', label: 'Español', bandera: 'ES', intl: 'es-ES' },
  { code: 'en', label: 'English', bandera: 'GB', intl: 'en-GB' },
  { code: 'de', label: 'Deutsch', bandera: 'DE', intl: 'de-DE' },
  { code: 'fr', label: 'Français', bandera: 'FR', intl: 'fr-FR' },
  { code: 'it', label: 'Italiano', bandera: 'IT', intl: 'it-IT' },
] as const

export type Idioma = (typeof IDIOMAS)[number]['code']

/**
 * El castellano es la fuente de verdad y **también el tipo**: los demás
 * diccionarios se declaran como `Diccionario`, así que a TypeScript le falla
 * el build si a alguno le falta una clave o si sobra. No hace falta acordarse
 * de revisarlo.
 */
export type ClaveTexto = keyof typeof es
export type Diccionario = Record<ClaveTexto, string>

const DICCIONARIOS: Record<Idioma, Diccionario> = { es, en, de, fr, it }

const CLAVE_GUARDADA = 'banana:idioma'

function esIdioma(valor: string | null): valor is Idioma {
  return IDIOMAS.some((i) => i.code === valor)
}

/** Idioma inicial: el que se eligió antes; si no, el del navegador; si no, castellano. */
function idiomaInicial(): Idioma {
  // En la app no hay selector, así que tampoco detección: quedarse en un
  // idioma sin poder cambiarlo sería peor que no ofrecerlo.
  if (isNativeApp) return 'es'
  try {
    const guardado = window.localStorage.getItem(CLAVE_GUARDADA)
    if (esIdioma(guardado)) return guardado
  } catch {
    // Modo privado: se sigue con la detección.
  }
  for (const preferido of navigator.languages ?? [navigator.language]) {
    const base = preferido.slice(0, 2).toLowerCase()
    if (esIdioma(base)) return base
  }
  return 'es'
}

interface EstadoIdioma {
  idioma: Idioma
  setIdioma: (idioma: Idioma) => void
  /** Traduce una clave. Admite sustituciones con `{nombre}`. */
  t: (clave: ClaveTexto, valores?: Record<string, string | number>) => string
  /** Etiqueta BCP-47 para `Intl` (`es-ES`, `de-DE`…). */
  intl: string
  /** ¿Se está viendo una traducción demostrativa? */
  traducido: boolean
}

const IdiomaContext = createContext<EstadoIdioma | null>(null)

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdiomaEstado] = useState<Idioma>(idiomaInicial)

  const setIdioma = useCallback((siguiente: Idioma) => {
    setIdiomaEstado(siguiente)
    try {
      window.localStorage.setItem(CLAVE_GUARDADA, siguiente)
    } catch {
      // Sin persistencia, pero el cambio se aplica igual.
    }
  }, [])

  // `lang` correcto en el documento: de él dependen los lectores de pantalla
  // para elegir voz y pronunciación, y el navegador para la partición de
  // palabras.
  useEffect(() => {
    document.documentElement.lang = idioma
  }, [idioma])

  const valor = useMemo<EstadoIdioma>(() => {
    const diccionario = DICCIONARIOS[idioma]
    const meta = IDIOMAS.find((i) => i.code === idioma) ?? IDIOMAS[0]
    return {
      idioma,
      setIdioma,
      intl: meta.intl,
      traducido: idioma !== 'es',
      t: (clave, valores) => {
        // El castellano hace de red: si una clave se quedara sin traducir en
        // otro idioma —cosa que el tipo impide, pero por si acaso— se ve el
        // texto en castellano y no la clave en crudo.
        const texto = diccionario[clave] ?? es[clave] ?? String(clave)
        if (!valores) return texto
        return texto.replace(/\{(\w+)\}/g, (coincidencia, nombre: string) =>
          nombre in valores ? String(valores[nombre]) : coincidencia,
        )
      },
    }
  }, [idioma, setIdioma])

  return <IdiomaContext.Provider value={valor}>{children}</IdiomaContext.Provider>
}

export function useIdioma(): EstadoIdioma {
  const contexto = useContext(IdiomaContext)
  if (!contexto) throw new Error('useIdioma debe usarse dentro de <IdiomaProvider>')
  return contexto
}

/**
 * Nombre de color traducido.
 *
 * Los colores viven en `src/data/products/` con su nombre en castellano, que
 * hace además de identificador. En vez de meter una clave al lado de cada uno
 * —son 39 repartidos por seis ficheros— se deriva la clave del propio nombre.
 *
 * Un color que se añada al catálogo y no esté traducido **sale en castellano**
 * en vez de mostrar la clave en crudo: es un dato de producto, no un rótulo, y
 * verlo en castellano molesta menos que ver `color.turquesa`.
 */
export function useColorName(): (nombre: string) => string {
  const { t } = useIdioma()
  return (nombre) => {
    const clave = `color.${normalizarColor(nombre)}` as ClaveTexto
    return clave in es ? t(clave) : nombre
  }
}

function normalizarColor(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/·/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Traductor de textos del catálogo: reclamos de modelo, características y
 * especificaciones. Ver `src/i18n/catalogo.ts`.
 */
export function useCatalogo(): (texto: string) => string {
  const { idioma } = useIdioma()
  return (texto) => traducirCatalogo(texto, idioma)
}

/** Atajo para el caso habitual: solo traducir. */
export function useT(): EstadoIdioma['t'] {
  return useIdioma().t
}
