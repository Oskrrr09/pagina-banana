import type { CSSProperties } from 'react'
import type { AccessoryImagePresentation } from '../../data/accessories'

// Renderiza la fotografía de un accesorio aplicando la configuración
// `AccessoryImagePresentation` (fit, scale, position, padding, background).
// Se usa desde AccessoryCard, AccessoryDetailPage y AccessorySearchCard
// para mantener una presentación consistente sin dispersar clases
// Tailwind por los datos.

type Size = 'thumb' | 'card' | 'hero'

const PADDING_BY_SIZE: Record<Size, Record<NonNullable<AccessoryImagePresentation['padding']>, string>> = {
  thumb: { none: 'p-0', compact: 'p-0.5', default: 'p-1' },
  card: { none: 'p-0', compact: 'p-2', default: 'p-3' },
  hero: { none: 'p-2', compact: 'p-4', default: 'p-5' },
}

const BG_BY_KEY: Record<NonNullable<AccessoryImagePresentation['background']>, string> = {
  neutral: '#fafafa',
  white: '#ffffff',
  transparent: 'transparent',
}

const POSITION_CLASS: Record<NonNullable<AccessoryImagePresentation['position']>, string> = {
  top: 'items-start',
  center: 'items-center',
  bottom: 'items-end',
}

export interface AccessoryImageProps {
  src: string
  alt: string
  size?: Size
  presentation?: AccessoryImagePresentation
  imageBg?: string
  width: number
  height: number
  loading?: 'lazy' | 'eager'
  className?: string
}

export function AccessoryImage({
  src,
  alt,
  size = 'card',
  presentation,
  imageBg,
  width,
  height,
  loading = 'lazy',
  className = '',
}: AccessoryImageProps) {
  const p = presentation ?? {}
  const padding = PADDING_BY_SIZE[size][p.padding ?? 'default']
  const position = POSITION_CLASS[p.position ?? 'center']
  const bg = imageBg ?? (p.background ? BG_BY_KEY[p.background] : '#fafafa')
  const fit = p.fit ?? 'contain'
  const scale = p.scale ?? 1
  const style: CSSProperties = {
    background: bg,
  }
  const imgStyle: CSSProperties = {
    objectFit: fit,
    transform: scale !== 1 ? `scale(${scale})` : undefined,
    transformOrigin: 'center',
  }
  return (
    <div
      className={`flex aspect-square w-full justify-center overflow-hidden ${position} ${padding} ${className}`}
      style={style}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        className="max-h-full max-w-full"
        style={imgStyle}
      />
    </div>
  )
}
