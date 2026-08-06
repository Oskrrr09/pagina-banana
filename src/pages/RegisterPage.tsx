import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useT } from '../lib/i18n'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { useCustomerAuth } from '../lib/customerAuth'
import { supabaseEnabled } from '../lib/supabase'
import { safeRedirect } from './LoginPage'

// Registro de clientes. Cuentas de DEMOSTRACIÓN.
//
// Si en Supabase está activo "Confirm email", el registro no devuelve
// sesión y hay que validar el correo antes de entrar; lo detectamos y lo
// explicamos en pantalla en vez de dejar al usuario colgado.

const MIN_PASSWORD = 8

export function RegisterPage() {
  const t = useT()
  const [params] = useSearchParams()
  const redirectTo = safeRedirect(params.get('redirect'))
  const { session, signUp, loading } = useCustomerAuth()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!nombre.trim()) nextErrors.nombre = t('auth.nameRequired')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      nextErrors.email = t('auth.emailInvalid')
    }
    if (password.length < MIN_PASSWORD) {
      nextErrors.password = `Usa al menos ${MIN_PASSWORD} caracteres.`
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setFormError(null)
    setSubmitting(true)
    const result = await signUp(email.trim(), password, nombre.trim())
    setSubmitting(false)

    if (result.error) {
      setFormError(result.error)
      return
    }
    if (result.needsEmailConfirmation) {
      setNeedsConfirmation(true)
    }
  }

  if (session && !loading) {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-ink">{t('account.signUp')}</h1>
        <p className="mt-2 text-sm text-muted">{t('account.signUpIntro')}</p>

        {!supabaseEnabled ? (
          <p className="mt-6 rounded-[12px] border border-line bg-neutral p-4 text-sm text-muted">
            Las cuentas necesitan Supabase configurado. Copia <code className="font-mono text-xs">.env.example</code> a{' '}
            <code className="font-mono text-xs">.env.local</code> con las credenciales del proyecto para habilitarlas.
          </p>
        ) : needsConfirmation ? (
          <div role="status" className="mt-6 rounded-[12px] border border-line bg-neutral p-4 text-sm text-ink">
            <p className="font-semibold">{t('auth.checkEmail')}</p>
            <p className="mt-1 text-muted">
              {t('auth.confirmSent')} <strong className="text-ink">{email}</strong>. Ábrelo para activar la cuenta y
              luego vuelve a{' '}
              <Link to="/login" className="font-semibold text-ink underline">
                iniciar sesión
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={onSubmit} className="mt-8 grid gap-4" noValidate>
              <Field label={t('checkout.fullName')} error={errors.nombre}>
                {(props) => (
                  <input
                    {...props}
                    className="field"
                    autoComplete="name"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                )}
              </Field>
              <Field label="Email" error={errors.email}>
                {(props) => (
                  <input
                    {...props}
                    type="email"
                    className="field"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                )}
              </Field>
              <Field
                label={t('account.password')}
                error={errors.password}
                hint={t('auth.passwordHint', { n: MIN_PASSWORD })}
              >
                {(props) => (
                  <input
                    {...props}
                    type="password"
                    className="field"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
              </Field>

              {formError && (
                <p role="alert" className="text-sm text-danger">
                  {formError}
                </p>
              )}

              <Button type="submit" size="lg" disabled={submitting} className="w-full">
                {submitting ? t('auth.creating') : t('account.signUp')}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted">
              {t('auth.hasAccount')}{' '}
              <Link
                to={`/login${params.get('redirect') ? `?redirect=${encodeURIComponent(params.get('redirect')!)}` : ''}`}
                className="font-semibold text-ink underline"
              >
                Iniciar sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </Container>
  )
}
