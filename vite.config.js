import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // atau plugin framework lain yang Anda gunakan

export default defineConfig({
  plugins: [react()],
  base: '/', // Pastikan base path diatur ke '/'
})