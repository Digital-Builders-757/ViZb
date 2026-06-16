type NavigatorWithStandalone = Navigator & { standalone?: boolean }

function getNavigator(): Navigator | undefined {
  if (typeof navigator === "undefined") return undefined
  return navigator
}

function getWindow(): Window | undefined {
  if (typeof window === "undefined") return undefined
  return window
}

export function isStandalone(): boolean {
  const win = getWindow()
  if (!win) return false

  if (win.matchMedia("(display-mode: standalone)").matches) return true

  const nav = getNavigator() as NavigatorWithStandalone | undefined
  return nav?.standalone === true
}

export function isIOS(): boolean {
  const nav = getNavigator()
  if (!nav) return false

  const ua = nav.userAgent
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua)
  const win = getWindow()
  const isMsStream = win ? "MSStream" in win : false

  return isAppleMobile && !isMsStream
}

export function isSafari(): boolean {
  const nav = getNavigator()
  if (!nav) return false

  const ua = nav.userAgent
  const isSafariUa = /Safari/.test(ua)
  const isOtherBrowser = /CriOS|FxiOS|EdgiOS|Chrome|Chromium|Edg|OPR|Opera/.test(ua)

  return isSafariUa && !isOtherBrowser
}

export function isMobileUserAgent(): boolean {
  const nav = getNavigator()
  if (!nav) return false

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(nav.userAgent)
}
