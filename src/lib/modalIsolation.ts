/**
 * Hace inerte todo lo que queda fuera de la rama DOM de un diálogo modal.
 *
 * Los diálogos del proyecto no viven en un portal, así que marcar únicamente
 * los hermanos inmediatos puede dejar activos el header, el footer u otros
 * controles situados en ancestros superiores. Recorremos la rama hasta
 * `#root` y conservamos qué atributos añadimos para no retirar un `inert`
 * previo que pertenezca a otra capa.
 */
export function isolateModalBranch(modalRoot: Element | null): () => void {
  const appRoot = document.getElementById('root')
  if (!modalRoot || !appRoot?.contains(modalRoot)) return () => undefined

  const inerted: Element[] = []
  let branch: Element = modalRoot

  while (branch.parentElement) {
    const parent = branch.parentElement
    for (const sibling of Array.from(parent.children)) {
      if (sibling !== branch && !sibling.hasAttribute('inert')) {
        sibling.setAttribute('inert', '')
        inerted.push(sibling)
      }
    }

    if (parent === appRoot) break
    branch = parent
  }

  return () => {
    for (const element of inerted) element.removeAttribute('inert')
  }
}
