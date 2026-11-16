// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { showToast } from '../toast'
import { FlagRain } from './FlagRain'
import { Toast } from './Toast'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function mount(node: React.ReactElement) {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  act(() => root.render(node))
  return { host, unmount: () => act(() => root.unmount()) }
}

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('Toast', () => {
  it('ukáže zprávu z showToast a po čase zmizí', () => {
    vi.useFakeTimers()
    const { host, unmount } = mount(<Toast />)
    expect(host.querySelector('.toast')).toBeNull()
    act(() => showToast({ title: 'Wakanda', lines: ['Na mapě není.'] }))
    expect(host.querySelector('.toast')?.textContent).toContain('Wakanda')
    expect(host.querySelector('.toast')?.textContent).toContain('Na mapě není.')
    act(() => vi.advanceTimersByTime(6000))
    expect(host.querySelector('.toast')).toBeNull()
    unmount()
  })
})

describe('FlagRain', () => {
  const press = (key: string) => act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key })))
  const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

  it('Konami kód pustí déšť vlajek a ten po čase zmizí', () => {
    vi.useFakeTimers()
    window.matchMedia = ((query: string) => ({ matches: false, media: query })) as unknown as typeof window.matchMedia
    const { host, unmount } = mount(<FlagRain />)
    code.slice(0, 9).forEach(press)
    expect(host.querySelector('.flag-rain')).toBeNull()
    press('a')
    expect(host.querySelectorAll('.flag-rain__drop').length).toBeGreaterThan(10)
    act(() => vi.advanceTimersByTime(7000))
    expect(host.querySelector('.flag-rain')).toBeNull()
    unmount()
  })

  it('při omezeném pohybu déšť nespustí', () => {
    window.matchMedia = ((query: string) => ({ matches: true, media: query })) as unknown as typeof window.matchMedia
    const { host, unmount } = mount(<FlagRain />)
    code.forEach(press)
    expect(host.querySelector('.flag-rain')).toBeNull()
    unmount()
  })
})
