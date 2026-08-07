---
tipo: sesion
fecha: 2026-08-07
tema: transferencia del repositorio y protección de main
---

# Transferencia del repositorio y protección de `main`

## Objetivo

Proteger `main` para que no admita cambios directos accidentales, y arreglar lo
que la transferencia del repositorio dejó apuntando al propietario anterior.

## Estado inicial

`main` **sin ninguna protección**: aceptaba force push, borrado y escritura
directa. Ni ruleset, ni protección clásica.

El primer intento de configurarlo se topó con algo que no estaba previsto: la
cuenta `Oskrrr09` era colaboradora con permiso de push, **no administradora**,
y tanto los rulesets como la protección clásica exigen admin. El endpoint de
protección devolvía `404`, que en GitHub significa a la vez «no hay protección»
y «no tienes acceso para verlo»: hasta tener admin no se podía distinguir.

Tras la transferencia a `Oskrrr09/pagina-banana`, con `admin: true`, sí.

## Trabajo realizado

### Ruleset «Protección de main» — `20547777`

Sobre `~DEFAULT_BRANCH`, activo, con `bypass_actors` vacío:

- pull request obligatorio, **0 aprobaciones** —mantenedor único—;
- los cuatro checks de CI en verde;
- rama al día con `main` (`strict`);
- force push y borrado bloqueados.

Tres decisiones que no son evidentes:

- **`~DEFAULT_BRANCH`** en lugar de `refs/heads/main`: si se renombra la rama por
  defecto, la protección la sigue.
- **`integration_id: 15368`** en cada check, para atarlos a GitHub Actions. Sin
  eso, cualquier aplicación externa podría publicar un check con el mismo nombre
  y darlo por bueno.
- **`Publicar en GitHub Pages` fuera de los obligatorios.** Está condicionado a
  `push` sobre `main`, así que en un PR siempre sale *skipped*, y un check
  obligatorio omitido es una causa clásica de PR bloqueados para siempre. Era el
  riesgo principal del diseño.

### La transferencia había roto la URL pública

GitHub Pages **no redirige entre cuentas**. `luis-lop-nas.github.io` devolvía
404 y la dirección buena pasó a ser `oskrrr09.github.io/pagina-banana/`. El
`basename` no cambia porque el nombre del repositorio es el mismo.

Se actualizaron 33 referencias en README y documentación (PR #37). Diez estaban
rotas de verdad; las otras veintitrés —enlaces a PRs y a ejecuciones de
Actions— funcionaban por la redirección de GitHub, pero esa redirección se rompe
en cuanto alguien cree un repositorio con el mismo nombre bajo la cuenta
anterior. Los números de PR y los IDs de run se conservan en la transferencia.

El remoto `origin` también se actualizó, y las ramas ya fusionadas se retiraron:
sólo queda `main`, en local y en remoto.

## Comprobación de que la protección funciona

La PR #37 se abrió con ese doble propósito. El resultado, con los dos checks
largos aún corriendo:

```
X Pull request Oskrrr09/pagina-banana#37 is not mergeable:
  the base branch policy prohibits the merge.
```

| Momento | `mergeStateStatus` | Fusión |
| --- | --- | --- |
| Checks pendientes | `BLOCKED` | rechazada por GitHub |
| Cuatro checks en verde | `CLEAN` | permitida |

El intento se hizo a propósito cuando los dos checks pendientes acababan de
arrancar, con minutos de margen, para que no pudiera colarse por accidente.

**No se probó `--admin`.** Confirmarlo exigiría intentar una fusión con los
checks en rojo, y si la protección fallara se habría fusionado de verdad. Con
`bypass_actors: []`, `current_user_can_bypass: never` y el bloqueo ya demostrado,
el riesgo no compensa.

## Decisiones tomadas

- [[02-decisiones#D-063]]: `main` protegida por ruleset, sin bypass, y por qué
  ruleset en vez de protección clásica.
- Las URLs de las notas de sesión **sí** se reescriben, al contrario de lo hecho
  con afirmaciones desfasadas como la de Docker o la de React Router: allí se
  corregía un hecho fechado y reescribirlo habría falseado el registro; aquí sólo
  cambia dónde vive el mismo contenido.

## Archivos afectados

- `AGENTS.md` — el flujo pasa obligatoriamente por rama y PR.
- `docs/00-estado-actual.md` — propiedad, URL pública y protección.
- `docs/02-decisiones.md` — D-063.
- `docs/05-registro-de-cambios.md` — entrada del 2026-08-07.
- README y documentación — 33 referencias actualizadas en la PR #37.

## Siguiente paso

Transferencia y protección cerradas. Vuelta al desarrollo del proyecto.

Sigue abierto, de sesiones anteriores: el riesgo residual **SEG-PREF-001**
—cierres de sesión desde otra pestaña o por invalidación del servidor—, el
soporte completo de Confirm Email en la interfaz, estabilizar `search.spec.ts:342`
y la migración a React Router 8.
