import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base = nome do repositório, para funcionar no GitHub Pages
export default defineConfig({
  base: '/Acadamia-em-casa/',
  plugins: [react()],
})
