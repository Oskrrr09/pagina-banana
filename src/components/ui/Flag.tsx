import { useId } from 'react'

/**
 * Banderas de los idiomas de la tienda.
 *
 * Dibujadas en SVG y no con emoji (🇪🇸, 🇬🇧…) porque Windows no trae la fuente
 * de banderas: allí un emoji de bandera se ve como las dos letras del país
 * ("ES", "GB"), que es justo lo que no queremos.
 *
 * Proporción 3:2 salvo la del Reino Unido, que es 2:1 como la real.
 * Son decorativas: quien las use debe poner el nombre del idioma al lado o en
 * la etiqueta accesible.
 */

export type CodigoBandera = 'ES' | 'GB' | 'DE' | 'FR' | 'IT'

export function Flag({ code, className = 'h-4 w-6' }: { code: CodigoBandera; className?: string }) {
  const id = useId()
  const comun = {
    className: `${className} shrink-0 rounded-[2px] object-cover`,
    'aria-hidden': true as const,
    focusable: 'false' as const,
  }

  switch (code) {
    // Bandera civil: franjas roja, amarilla (el doble de ancha) y roja.
    case 'ES':
      return (
        <svg viewBox="0 0 30 20" {...comun}>
          <rect width="30" height="20" fill="#AA151B" />
          <rect y="5" width="30" height="10" fill="#F1BF00" />
        </svg>
      )

    case 'DE':
      return (
        <svg viewBox="0 0 30 20" {...comun}>
          <rect width="30" height="20" fill="#DD0000" />
          <rect width="30" height="6.667" fill="#000" />
          <rect y="13.333" width="30" height="6.667" fill="#FFCE00" />
        </svg>
      )

    case 'FR':
      return (
        <svg viewBox="0 0 30 20" {...comun}>
          <rect width="30" height="20" fill="#FFF" />
          <rect width="10" height="20" fill="#002654" />
          <rect x="20" width="10" height="20" fill="#ED2939" />
        </svg>
      )

    case 'IT':
      return (
        <svg viewBox="0 0 30 20" {...comun}>
          <rect width="30" height="20" fill="#F4F5F0" />
          <rect width="10" height="20" fill="#008C45" />
          <rect x="20" width="10" height="20" fill="#CD212A" />
        </svg>
      )

    // La Union Jack no son franjas: se construye con dos cruces superpuestas.
    // Las diagonales rojas van recortadas en contrarrotación, que es lo que le
    // da su asimetría característica.
    case 'GB': {
      const marco = `${id}-marco`
      const diagonales = `${id}-diagonales`
      return (
        <svg viewBox="0 0 60 30" {...comun}>
          <clipPath id={marco}>
            <path d="M0,0 v30 h60 v-30 z" />
          </clipPath>
          <clipPath id={diagonales}>
            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
          </clipPath>
          <g clipPath={`url(#${marco})`}>
            <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFF" strokeWidth="6" />
            <path
              d="M0,0 L60,30 M60,0 L0,30"
              clipPath={`url(#${diagonales})`}
              stroke="#C8102E"
              strokeWidth="4"
            />
            <path d="M30,0 v30 M0,15 h60" stroke="#FFF" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
          </g>
        </svg>
      )
    }
  }
}
