import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// base './' = relativní cesty, takže web funguje i v podsložce (GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
