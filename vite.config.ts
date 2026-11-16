import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Do náhledu odkazu (og:image) patří celá adresa webu, relativní cesta v chatech nefunguje.
 * Adresu čte z proměnné SITE_URL, kterou nastavuje nasazení na GitHub Pages (.github/workflows/deploy.yml),
 * např. https://uzivatel.github.io/geohry/. Když chybí (běžný vývoj), zůstane relativní cesta.
 */
function siteUrl(): Plugin {
  return {
    name: 'geohry-site-url',
    transformIndexHtml: (html) => {
      const url = (process.env.SITE_URL ?? '').trim()
      return html.replaceAll('__SITE_URL__', url ? url.replace(/\/?$/, '/') : './')
    },
  }
}

// base './' = relativní cesty, takže web funguje i v podsložce (GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react(), siteUrl()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
