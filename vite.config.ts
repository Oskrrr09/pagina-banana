import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `base` = subruta donde GitHub Pages sirve el proyecto (usuario.github.io/pagina-banana/).
// En desarrollo Vite usa '/' automáticamente al no aplicar este valor con `vite dev`
// salvo que se fije; lo dejamos fijo y los assets se resuelven vía import.meta.env.BASE_URL.
export default defineConfig({
  base: '/pagina-banana/',
  plugins: [react(), tailwindcss()],
})
