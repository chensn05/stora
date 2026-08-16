/** Detect mobile screen */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 768
}

export function isSmallMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 480
}

/** Get responsive font size for title */
export function titleFontSize(): string {
  if (typeof window === 'undefined') return '56px'
  const w = window.innerWidth
  if (w <= 480) return '32px'
  if (w <= 768) return '40px'
  return '56px'
}

/** Get responsive letter spacing */
export function titleLetterSpacing(): string {
  if (typeof window === 'undefined') return '8px'
  const w = window.innerWidth
  if (w <= 480) return '4px'
  if (w <= 768) return '6px'
  return '8px'
}

/** Get guardian size */
export function guardianSize(): number {
  if (typeof window === 'undefined') return 140
  const w = window.innerWidth
  if (w <= 480) return 90
  if (w <= 768) return 110
  return 140
}

/** Get chat panel width */
export function chatPanelWidth(): string {
  if (typeof window === 'undefined') return '320px'
  const w = window.innerWidth
  if (w <= 480) return 'calc(100vw - 120px)'
  if (w <= 768) return '280px'
  return '320px'
}

/** Get chat panel height */
export function chatPanelHeight(): string {
  if (typeof window === 'undefined') return '420px'
  const w = window.innerWidth
  if (w <= 480) return '320px'
  return '420px'
}

/** Should use stacked (column) layout */
export function useStackedLayout(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 768
}
