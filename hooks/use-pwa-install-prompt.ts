"use client"

import * as React from "react"

import { PWA_PROMPT_DELAY_MS } from "@/lib/pwa/constants"
import { isIOS, isMobileUserAgent, isStandalone } from "@/lib/pwa/detect"
import { isWithinCooldown, setDismissedNow } from "@/lib/pwa/dismiss-storage"
import { shouldSuppressInstallPrompt } from "@/lib/pwa/suppress-prompt"
import type { BeforeInstallPromptEvent } from "@/lib/pwa/types"
import { useIsMobile } from "@/hooks/use-mobile"

export type PwaInstallVariant = "none" | "android" | "ios"

type UsePwaInstallPromptOptions = {
  pathname: string
  searchParams: URLSearchParams | null
}

export function usePwaInstallPrompt({ pathname, searchParams }: UsePwaInstallPromptOptions) {
  const isMobileViewport = useIsMobile()
  const [variant, setVariant] = React.useState<PwaInstallVariant>("none")
  const [isVisible, setIsVisible] = React.useState(false)
  const deferredPromptRef = React.useRef<BeforeInstallPromptEvent | null>(null)
  const showTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearShowTimer = React.useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }
  }, [])

  const hidePrompt = React.useCallback(() => {
    clearShowTimer()
    setIsVisible(false)
    setVariant("none")
  }, [clearShowTimer])

  const dismiss = React.useCallback(() => {
    setDismissedNow()
    hidePrompt()
  }, [hidePrompt])

  const scheduleShow = React.useCallback(
    (nextVariant: Exclude<PwaInstallVariant, "none">) => {
      clearShowTimer()
      showTimerRef.current = setTimeout(() => {
        setVariant(nextVariant)
        setIsVisible(true)
      }, PWA_PROMPT_DELAY_MS)
    },
    [clearShowTimer],
  )

  const isEligibleContext = isMobileViewport || isMobileUserAgent()

  React.useEffect(() => {
    hidePrompt()
    deferredPromptRef.current = null

    if (!isEligibleContext) return
    if (isStandalone()) return
    if (isWithinCooldown()) return
    if (shouldSuppressInstallPrompt(pathname, searchParams)) return

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      deferredPromptRef.current = event as BeforeInstallPromptEvent
      scheduleShow("android")
    }

    const onAppInstalled = () => {
      deferredPromptRef.current = null
      hidePrompt()
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)

    if (isIOS() && isMobileUserAgent()) {
      showTimerRef.current = setTimeout(() => {
        if (deferredPromptRef.current) return
        setVariant("ios")
        setIsVisible(true)
      }, PWA_PROMPT_DELAY_MS)
    }

    return () => {
      clearShowTimer()
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
  }, [pathname, searchParams, isEligibleContext, hidePrompt, scheduleShow, clearShowTimer])

  const promptInstall = React.useCallback(async () => {
    const deferred = deferredPromptRef.current
    if (!deferred) return

    try {
      await deferred.prompt()
      await deferred.userChoice
    } catch {
      // Browser blocked or prompt already consumed.
    } finally {
      deferredPromptRef.current = null
      hidePrompt()
    }
  }, [hidePrompt])

  return {
    variant,
    isVisible,
    promptInstall,
    dismiss,
  }
}
