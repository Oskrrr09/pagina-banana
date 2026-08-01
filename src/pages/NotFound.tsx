import { Container } from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'
import { useT } from '../lib/i18n'

export function NotFound() {
  const t = useT()
  return (
    <Container className="py-24 text-center">
      <p className="font-display text-6xl font-extrabold text-ink">404</p>
      <h1 className="mt-4 text-2xl font-bold text-ink">{t('notFound.title')}</h1>
      <p className="mt-2 text-muted">{t('notFound.body')}</p>
      <ButtonLink to="/" className="mt-6">
        {t('notFound.back')}
      </ButtonLink>
    </Container>
  )
}
