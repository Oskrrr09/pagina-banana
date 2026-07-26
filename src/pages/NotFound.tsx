import { Container } from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'

export function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="font-display text-6xl font-extrabold text-ink">404</p>
      <h1 className="mt-4 text-2xl font-bold text-ink">No hemos encontrado esta página</h1>
      <p className="mt-2 text-muted">Puede que el enlace haya cambiado o que la sección no esté en el prototipo.</p>
      <ButtonLink to="/" className="mt-6">
        Volver al inicio
      </ButtonLink>
    </Container>
  )
}
