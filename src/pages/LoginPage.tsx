import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useT } from '../lib/i18n'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { useCustomerAuth } from '../lib/customerAuth'
import { supabaseEnabled } from '../lib/supabase'

// Acceso de clientes a la tienda.
//
// Página completa (no modal) por coherencia con el checkout, y porque así
// se puede enlazar directamente y volver a donde estabas con ?redirect=.
//
// Cuentas de DEMOSTRACIÓN: no hay clientes reales de Banana.

/**
 * Solo aceptamos destinos internos. Un `?redirect=https://otro-sitio`
 * convertiría el login en un salto abierto a dominios ajenos.
 */
export function safeRedirect(raw: string | null): string {
  if (!raw) return '/cuenta'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/cuenta'
  return raw
}

export function LoginPage() {
  const t = useT()
  const [params] = useSearchParams()
  const redirectTo = safeRedirect(params.get('redirect'))
  const { session, signIn, loading } = useCustomerAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: signInError } = await signIn(email.trim(), password)
    setSubmitting(false)
    if (signInError) {
      setError(signInError === 'Invalid login credentials' ? t('auth.badCredentials') : signInError)
    }
  }

  if (session && !loading) {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-ink">{t('auth.signInTitle')}</h1>
        <p className="mt-2 text-sm text-muted">{t('auth.signInBody')}</p>

        {!supabaseEnabled ? (
          <p className="mt-6 rounded-[12px] border border-line bg-neutral p-4 text-sm text-muted">
            Las cuentas necesitan Supabase configurado. Copia <code className="font-mono text-xs">.env.example</code> a{' '}
            <code className="font-mono text-xs">.env.local</code> con las credenciales del proyecto para habilitarlas.
          </p>
        ) : (
          <>
            <form onSubmit={onSubmit} className="mt-8 grid gap-4" noValidate>
              <Field label="Email">
                {(props) => (
                  <input
                    {...props}
                    type="email"
                    className="field"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                )}
              </Field>
              <Field label={t('account.password')}>
                {(props) => (
                  <input
                    {...props}
                    type="password"
                    className="field"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                )}
              </Field>

              {error && (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" disabled={submitting} className="w-full">
                {submitting ? t('auth.signingIn') : t('account.signIn')}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted">
              {t('auth.noAccount')}{' '}
              <Link
                to={`/registro${params.get('redirect') ? `?redirect=${encodeURIComponent(params.get('redirect')!)}` : ''}`}
                className="font-semibold text-ink underline"
              >
                {t('account.signUp')}
              </Link>
            </p>
          </>
        )}
      </div>
    </Container>
  )
}
