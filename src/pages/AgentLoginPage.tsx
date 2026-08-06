import { useState, type FormEvent } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { useAgentAuth } from '../lib/agentAuth'
import { supabaseEnabled } from '../lib/supabase'
import { InstallAppNote } from '../components/agent/AgentAppBar'

// Acceso al panel de agentes — Fase 2.
//
// Email + contraseña, no magic link: en una demostración en vivo se puede
// escribir la credencial en pantalla sin depender de abrir un correo.
//
// Las cuentas son ficticias y se dan de alta a mano desde el panel de
// Supabase (ver supabase/schema.sql). No hay registro público de agentes.

const BANANA_YELLOW = '#ffce1f'

export function AgentLoginPage() {
  const { session, agente, loading, signIn } = useAgentAuth()
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
      setError(signInError === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : signInError)
    }
  }

  // Ya dentro: al panel. Solo cuando el perfil confirma que es agente,
  // para no rebotar entre /agente y /agente/login.
  if (session && agente) {
    return <Navigate to="/agente" replace />
  }

  if (!supabaseEnabled) {
    return (
      <CenteredCard title="Panel de agentes">
        <p className="text-sm text-muted">
          Supabase no está configurado en este entorno, así que no hay acceso de agentes. Copia{' '}
          <code className="font-mono text-xs">.env.example</code> a{' '}
          <code className="font-mono text-xs">.env.local</code> con las credenciales del proyecto para habilitarlo.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold underline">
          Volver a la tienda
        </Link>
      </CenteredCard>
    )
  }

  return (
    <CenteredCard title="Panel de agentes">
      <p className="text-sm text-muted">
        Acceso para el equipo de tienda. Entorno de demostración con cuentas ficticias.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
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
        <Field label="Contraseña">
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

        {/* La cuenta existe pero no está dada de alta como agente. */}
        {session && !agente && !loading && !error && (
          <p role="alert" className="text-sm text-danger">
            Esta cuenta no tiene permiso de agente. Habla con quien administre el panel para que te dé de alta.
          </p>
        )}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <InstallAppNote />

      <Link to="/" className="mt-6 inline-block text-sm text-muted underline">
        Volver a la tienda
      </Link>
    </CenteredCard>
  )
}

function CenteredCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-neutral px-4 py-10">
      <div className="w-full max-w-sm rounded-[20px] border border-line bg-surface p-6 shadow-[var(--shadow-raised)]">
        <div className="-mx-6 -mt-6 mb-6 rounded-t-[20px] px-6 py-4" style={{ background: BANANA_YELLOW }}>
          <h1 className="text-lg font-bold text-ink">{title}</h1>
        </div>
        {children}
      </div>
    </main>
  )
}
