// Foto real de producto almacenada localmente y con procedencia documentada.
// Se muestra contenida para conservar el encuadre aunque cambie su proporción.
// `priority` = imagen crítica (ficha de compra visible en el fold). El resto
// carga lazy con decoding async para no bloquear el hilo principal.

export function ProductImage({
  src,
  alt,
  ratio = '1 / 1',
  className = '',
  pad = true,
  bgColor,
  priority = false,
}: {
  src?: string
  alt: string
  ratio?: string
  className?: string
  pad?: boolean
  bgColor?: string
  priority?: boolean
}) {
  return (
    <div
      className={`relative grid place-items-center overflow-hidden rounded-[12px] ${bgColor ? '' : 'bg-neutral'} ${className}`}
      style={{ aspectRatio: ratio, backgroundColor: bgColor }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          width={1080}
          height={1080}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          className={`h-full w-full object-contain object-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] ${
            pad ? 'p-3' : ''
          }`}
        />
      ) : (
        <span className="text-xs text-muted">{alt}</span>
      )}
    </div>
  )
}
