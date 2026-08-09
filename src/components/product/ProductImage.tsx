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
  blend = false,
}: {
  src?: string
  alt: string
  ratio?: string
  className?: string
  pad?: boolean
  bgColor?: string
  priority?: boolean
  /**
   * `true` cuando la fotografía tiene fondo blanco sólido (JPG) y
   * queremos que se funda con el gris de la tarjeta. Aplica
   * `mix-blend-mode: multiply` para eliminar visualmente el blanco sin
   * tener que reprocesar el asset a PNG con alfa.
   */
  blend?: boolean
}) {
  return (
    <div
      // `flex` y no `grid place-items-center`.
      //
      // Con el grid, la única fila se dimensiona por contenido. Al medirla, el
      // `h-full` de la imagen todavía no puede resolverse —depende de la fila
      // que se está calculando—, así que la imagen cae en su proporción nativa
      // 1:1 y aporta su ancho completo de alto. La fila se quedaba con esa
      // medida y entonces `h-full` resolvía contra LA FILA, no contra la caja:
      // en la portada de la app, 316 px de imagen dentro de una caja de 197,5,
      // con el `overflow-hidden` cortando el portátil por abajo.
      //
      // Sólo se notaba con proporciones no cuadradas, que es donde la fila y la
      // caja discrepan: portada de la app y de la web, buscador, ficha de
      // modelo, comparador y favoritos.
      className={`relative flex items-center justify-center overflow-hidden rounded-[12px] ${bgColor ? '' : 'bg-neutral'} ${className}`}
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
          style={blend ? { mixBlendMode: 'multiply' } : undefined}
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
