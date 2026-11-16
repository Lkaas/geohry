import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque/standard.css'
import './styles/base.css'
import './styles/components.css'
import { App } from './App'
import { initTheme } from './shared/theme'

initTheme()

console.log('%cGeoHry', 'font: 700 28px sans-serif; color: #b5127a')
console.log('Koukáš pod pokličku? Zkus napsat do políčka Wakanda. Nebo si zahraj Konami kód.')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
