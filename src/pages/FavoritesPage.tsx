import { Container } from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'
import { ProductCard } from '../components/product/ProductCard'
import { Icon } from '../components/ui/Icon'
import { useStore } from '../lib/store'
import { iphoneModels } from '../data/products'

export function FavoritesPage() {
  const { favorites } = useStore()
  // Los favoritos guardan `family/model` o `family/model/color`; agrupamos a modelo.
  const favModels = iphoneModels.filter((m) =>
    favorites.some((f) => f.startsWith(`iphone/${m.slug}`)),
  )

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-extrabold text-ink">Favoritos</h1>
      {favModels.length === 0 ? (
        <div className="mt-8 rounded-[12px] border border-dashed border-line py-16 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-neutral text-muted">
            <Icon name="heart" size={26} />
          </div>
          <p className="mt-4 text-muted">Aún no has guardado ningún producto.</p>
          <ButtonLink to="/iphone" className="mt-6">
            Explorar iPhone
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favModels.map((m) => (
            <ProductCard key={m.slug} model={m} />
          ))}
        </div>
      )}
    </Container>
  )
}
