import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Structured data so Google names the site "AgroPass" next to its icon in
// search results. It needs the absolute home page URL, so it is only added
// when VITE_SITE_URL is set (e.g. https://agropass.example.com/).
function siteStructuredData(siteUrl: string | undefined): Plugin {
  return {
    name: 'agropass-site-structured-data',
    transformIndexHtml() {
      if (!siteUrl) return []
      const home = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`
      const data = [
        { '@context': 'https://schema.org', '@type': 'WebSite', name: 'AgroPass', url: home },
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'AgroPass',
          url: home,
          logo: new URL('favicon-192x192.png', home).href,
        },
      ]
      return [
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          children: JSON.stringify(data).replace(/</g, '\\u003c'),
          injectTo: 'head',
        },
      ]
    },
  }
}

// .env files plus the real environment (CI sets these directly).
const env = { ...loadEnv('', process.cwd()), ...process.env }

export default defineConfig({
  // Sub-path deploys (GitHub Pages serves the demo at /agro-pass/).
  base: env.VITE_BASE_PATH || '/',
  plugins: [react(), tailwindcss(), siteStructuredData(env.VITE_SITE_URL)],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
