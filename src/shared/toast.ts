// Krátká zpráva dole na obrazovce (komponenta Toast). Používají ji easter eggy.
export const TOAST_EVENT = 'geohry:toast'

export interface ToastMessage {
  title?: string
  lines: string[]
}

export function showToast(message: ToastMessage): void {
  window.dispatchEvent(new CustomEvent<ToastMessage>(TOAST_EVENT, { detail: message }))
}
