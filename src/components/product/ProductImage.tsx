// Foto real de producto almacenada localmente y con procedencia documentada.
// Se muestra contenida para conservar el encuadre aunque cambie su proporción.

export function ProductImage({
  src,
  alt,
  ratio = '1 / 1',
  className = '',
  pad = true,
}: {
  src?: string
  alt: string
  ratio?: string
  className?: string
  pad?: boolean
}) {
  return (
    <div
      className={`relative grid place-items-center overflow-hidden rounded-[12px] bg-neutral ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
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
