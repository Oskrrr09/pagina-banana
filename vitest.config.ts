import { defineConfig } from 'vitest/config'

// Pruebas unitarias de las funciones puras.
//
// Playwright cubre lo que se ve; esto cubre lo que se calcula. Son cosas
// distintas y se separan a propósito: `tests/e2e` necesita navegador y
// servidor, y estas se ejecutan en milisegundos, así que pueden correr antes
// del build y cortar el pipeline mucho antes.
export default defineConfig({
  test: {
    // `tests/e2e` y `tests/rls` son de Playwright; incluirlas aquí haría que
    // Vitest intentara ejecutarlas y fallara con errores confusos.
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
})
