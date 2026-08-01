import type { SVGProps } from 'react'

// Iconos lineales, trazo 1.5 sobre rejilla de 24px (§5.4, estilo Lucide, MIT).
const paths: Record<string, string> = {
  home: 'M4 11l8-7 8 7M6 10v9h12v-9M10 19v-5h4v5',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6L6 18',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.35-4.35',
  heart:
    'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.49 4.04 3 5.5l7 7Z',
  cart: 'M3 4h2l2.4 12.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L21 8H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  compare: 'M4 5h7M4 12h7M4 19h7M20 5h-6M20 12h-4M20 19h-6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0',
  'chevron-right': 'M9 6l6 6-6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12l5 5L20 6',
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  truck: 'M3 6h11v9H3zM14 9h4l3 3v3h-7M6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  store: 'M4 9l1-5h14l1 5M4 9v10h16V9M4 9h16M9 19v-5h6v5',
  shield: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z',
  star: 'M12 4l2.4 5 5.6.6-4 4 1 5.4L12 16l-5 3 1-5.4-4-4 5.6-.6z',
  'credit-card': 'M3 6h18v12H3zM3 10h18',
  refresh: 'M4 9a8 8 0 0 1 14-3l2 2M20 15a8 8 0 0 1-14 3l-2-2M18 4v4h-4M6 20v-4h4',
  graduation: 'M12 4l10 5-10 5L2 9zM6 11v5c0 1 3 2 6 2s6-1 6-2v-5',
  package: 'M12 3l8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10',
  wrench: 'M15 6a4 4 0 0 0-5 5L4 17l3 3 6-6a4 4 0 0 0 5-5l-3 3-2-2z',
  chat: 'M4 5h16v11H9l-4 4V16H4z',
  'map-pin': 'M12 21c4-4 7-7.5 7-11a7 7 0 1 0-14 0c0 3.5 3 7 7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  parking: 'M6 20V4h6a4 4 0 0 1 0 8H6',
  filter: 'M4 5h16l-6 7v6l-4 2v-8z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: keyof typeof paths | string
  size?: number
}

export function Icon({ name, size = 20, className, ...rest }: IconProps) {
  const d = paths[name] ?? paths.info
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {d.split('M').filter(Boolean).map((seg, i) => (
        <path key={i} d={'M' + seg} />
      ))}
    </svg>
  )
}
