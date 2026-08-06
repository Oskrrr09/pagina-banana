import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import importX from 'eslint-plugin-import-x'
import promise from 'eslint-plugin-promise'

// Configuración deliberadamente corta.
//
// El proyecto ya tiene TypeScript en modo estricto y una suite E2E amplia, así
// que ESLint no está para repetir lo que esos dos ya cubren. Está para lo que
// ninguno de los dos ve: reglas de los hooks —que en este repo ya causaron un
// fallo real (`HOOKS-001`)— y variables muertas que se acumulan al mover
// código de sitio.
//
// El formato queda en Prettier. JSX a11y se cubre con axe hasta que su plugin
// declare compatibilidad con ESLint 10; no se fuerza un peer incompatible.
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist-app/**',
      'ios/**',
      'android/**',
      'playwright-report/**',
      'test-results/**',
      'public/**',
      'scripts/**',
      '.claude/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'import-x': importX,
      promise,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // TypeScript ya resuelve los módulos; ESLint vigila aquí estructura,
      // duplicados y exports sin exigir un segundo resolver divergente.
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-mutable-exports': 'error',

      // Errores de promesa inequívocos. Los flujos `void` intencionados del
      // proyecto siguen siendo válidos y los casos dudosos quedan en warning.
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/no-return-in-finally': 'error',
      'promise/valid-params': 'warn',

      // El proyecto usa `_` como convención para lo que se recibe y no se usa
      // (índices de `map`, capturas de error vacías).
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // `any` explícito avisa pero no rompe el build: hay puntos de contacto
      // con Supabase donde el tipo generado no llega.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Regla nueva del plugin, de rendimiento y no de corrección: avisa de
      // efectos que llaman a setState en su cuerpo. Hay 20 en el repo, la
      // mayoría sincronizando estado con props, que es un patrón legítimo
      // aunque mejorable. Queda en aviso: convertirla en error obligaría a
      // reescribir veinte efectos a ciegas, y eso arriesga romper cosas que
      // hoy funcionan por arreglar algo que no falla.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Las pruebas hablan con APIs sin tipar y usan aserciones no nulas a
    // propósito, que dentro de una prueba son legibles y seguras.
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
)
