import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/** Prints a clickable login URL after the dev server starts */
function loginLinkPlugin() {
  return {
    name: 'login-link',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const { port } = server.config.server
        const host = 'localhost'
        const reset  = '\x1b[0m'
        const bold   = '\x1b[1m'
        const cyan   = '\x1b[36m'
        const green  = '\x1b[32m'
        const yellow = '\x1b[33m'

        console.log('')
        console.log(`  ${bold}${green}Tool-114 Residual Risk Calculator${reset}`)
        console.log(`  ${yellow}─────────────────────────────────────${reset}`)
        console.log(`  ${bold}Login:${reset}  ${cyan}http://${host}:${port}/login${reset}`)
        console.log(`  ${bold}App:${reset}    ${cyan}http://${host}:${port}/${reset}`)
        console.log(`  ${bold}Swagger:${reset} ${cyan}http://localhost:8080/swagger-ui.html${reset}`)
        console.log(`  ${bold}AI Health:${reset} ${cyan}http://localhost:5000/health${reset}`)
        console.log('')
        console.log(`  ${bold}Demo credentials${reset}`)
        console.log(`  Admin   ${cyan}admin${reset} / ${cyan}Admin@123456${reset}`)
        console.log(`  Analyst ${cyan}analyst${reset} / ${cyan}User@123456${reset}`)
        console.log(`  ${yellow}─────────────────────────────────────${reset}`)
        console.log('')
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), loginLinkPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
      '/auth': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
      '/export': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
})
