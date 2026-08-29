import { useParams } from 'react-router-dom'
import { getFamilyModels, familyInfo } from '../data/products'
import { isNativeApp } from '../lib/nativeApp'
import { AppFamilyPage } from '../components/family/AppFamilyPage'
import { WebFamilyPage } from '../components/family/WebFamilyPage'
import { NotFound } from './NotFound'

/**
 * Página de familia (§4.5).
 *
 * LA PLATAFORMA SE DECIDE AQUÍ, UNA SOLA VEZ
 *
 * Dentro del binario nativo se monta otra composición. No es la misma página
 * con condicionales repartidos: son dos experiencias con anchos y públicos
 * distintos que comparten catálogo, tarjetas, rutas, ofertas y el estado de los
 * filtros —ver `useCatalogoFamilia`— pero no estructura. Es el mismo patrón que
 * ya usa `Home`.
 *
 * POR QUÉ SE HIZO ASÍ, Y NO ANTES
 *
 * Esta página la montaban las dos plataformas a la vez. En `f3143d85` se
 * simplificó «para la app» —con razón: en `/iphone` los filtros aparecían casi
 * tres pantallas abajo— y con ello desaparecieron **también de la web** el
 * carrusel de modelos, el escaparate de Oportunidades y el encabezado del
 * catálogo. La Fase A (PR #85) no causó aquella pérdida, pero siguió tocando la
 * misma composición compartida.
 *
 * La regla que deja establecida esta separación: **si cambiar una plataforma
 * puede mover la otra por accidente, la frontera está mal puesta.** Lo que se
 * comparte es dominio; lo que diverge es presentación, y vive aparte.
 */
export function FamilyPage() {
  const { family: familySlug } = useParams()

  const family = familyInfo(familySlug ?? '')
  const models = getFamilyModels(familySlug ?? '')

  // Familia inexistente o sin catálogo desarrollado → 404 amable.
  if (!family || models.length === 0) return <NotFound />

  if (isNativeApp) return <AppFamilyPage family={family} models={models} />
  return <WebFamilyPage family={family} models={models} />
}
