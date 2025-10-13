import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.groq.com/openai/v1', // direct URL
        changeOrigin: true,
        secure: true
      }
    }
  }
})
