import { useId, type ReactNode } from 'react'

// Campo de formulario con etiqueta y error asociados.
//
// Nació dentro de CheckoutPage; se extrae aquí al reutilizarse en login,
// registro y perfil. La versión del checkout envuelve el control en un
// <label>, lo que basta cuando hay un único control dentro. Aquí pasamos
// el id explícitamente para poder enlazar también el mensaje de error con
// aria-describedby, que es lo que necesita un formulario de acceso.

export function Field({
  label,
  error,
  hint,
  full,
  children,
}: {
  label: string
  error?: string
  hint?: string
  full?: boolean
  /** Recibe los atributos que hay que aplicar al input/select/textarea. */
  children: (props: {
    id: string
    'aria-invalid'?: true
    'aria-describedby'?: string
  }) => ReactNode
}) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mb-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {children({
        id,
        ...(error ? { 'aria-invalid': true as const } : {}),
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      })}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
