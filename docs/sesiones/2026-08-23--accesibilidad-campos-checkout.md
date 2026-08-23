---
tipo: sesion
fecha: 2026-08-23
tema: A62-08 — el error del checkout deja de renombrar el campo
---

# El error estaba dentro de la etiqueta

## Objetivo

Corregir **A62-08**, el primero de los hallazgos de UX-062 que la reauditoría
del mismo día confirmó abiertos. Sólo ése.

## Estado inicial

`main` en `0407bb88`, árbol limpio. Rama `fix/checkout-field-accessibility`.

## El defecto

El checkout tenía **su propia copia** de `Field`, que envolvía el control en un
`<label>` y metía el mensaje de error dentro de esa misma etiqueta. Con un único
control dentro, la envoltura basta para dar nombre —y por eso **axe seguía en
verde**—, pero al aparecer el error el texto pasaba a formar parte del nombre:

```
antes  → textbox "Nombre y apellidos"
al fallar → textbox "Nombre y apellidosIntroduce tu nombre."
```

Quien navega con lector de pantalla ve **cambiar el nombre del campo**, y nunca
oye que sea inválido: no había `aria-invalid`, ni `aria-describedby`, ni
asociación `label`/`for`, ni `required`.

## La solución ya estaba escrita

`src/components/ui/Field.tsx` hace lo correcto desde que se extrajo —su propio
comentario dice que nació en el checkout y que la versión compartida mejoró
justamente la asociación del error—. No se ha creado ningún componente nuevo ni
se ha tocado el compartido: el checkout pasa a usarlo y su copia local
desaparece.

## Contraprueba, por la vía auténtica

La prueba se escribió **antes** del arreglo y se ejecutó contra el código
defectuoso sin sabotear nada, porque el defecto ya vivía en `main`:

```
Error: el nombre de Nombre y apellidos no cambia al fallar
Expected: "Nombre y apellidos"
Received: "Nombre y apellidosIntroduce tu nombre."
```

La otra prueba del bloque —el estado sin error— pasaba ya en base, que es lo que
debe ocurrir: antes de validar, el nombre estaba limpio.

## Resultado medido

En los dos modos de entrega y a 390×844 y 1440×900:

| Campo | Nombre | Descripción | `aria-invalid` | `required` |
| --- | --- | --- | --- | --- |
| Nombre y apellidos | `Nombre y apellidos` | `Introduce tu nombre.` | `true` | sí |
| Email | `Email` | `Introduce un email válido.` | `true` | sí |
| Dirección (envío) | `Dirección` | `Introduce la dirección de envío.` | `true` | sí |
| Isla | `Isla` | — | — | no |
| Tienda (recogida) | `Tienda de recogida` | — | — | sí |

Isla y Tienda ilustran el caso sin error: **ninguna descripción colgante y sin
`aria-invalid`**. Isla no lleva `required` a propósito: `validateStep1` no la
comprueba y el selector nace con una opción válida; marcarla exigiría añadir una
opción vacía, que sería cambiar el control.

## Comprobaciones

489 E2E aprobadas y 1 omitida esperada contra el artefacto —dos más que el
baseline, que son las nuevas—, `accessibility.spec.ts` completo en verde con axe
incluido, 37/37 preferencias, 24/24 panel, 358 unitarias, `typecheck`, Prettier y
ESLint con **0 errores / 25 avisos**.

## Alcance

`src/pages/CheckoutPage.tsx` y `tests/e2e/accessibility.spec.ts`, más la
documentación de UX-062. **No** se creó un `<form>`, **no** se tradujo nada
—`Pago y extras` sigue hardcodeado, que es A62-03/04—, y no se tocaron el login,
el panel, Supabase ni las reglas de validación.

## Siguiente paso

Revisar la PR antes de fusionarla.
