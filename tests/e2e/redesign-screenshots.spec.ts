import { test, expect } from "@playwright/test"
import path from "node:path"

const outDir = path.join(process.cwd(), "docs", "redesign", "screenshots")

async function assertNonBlank(page: import("@playwright/test").Page) {
  const blankRatio = await page.evaluate(() => {
    const canvas = document.querySelector("canvas")
    if (!canvas) return 0
    const ctx = canvas.getContext("2d")
    if (!ctx) return 0
    const { width, height } = canvas
    if (width < 2 || height < 2) return 1
    const data = ctx.getImageData(0, 0, Math.min(width, 64), Math.min(height, 64)).data
    let dark = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] + data[i + 1] + data[i + 2] < 24) dark++
    }
    return dark / (data.length / 4)
  })
  expect(blankRatio).toBeLessThan(0.98)
}

test.describe("redesign handoff screenshots desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test("capture key routes", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(2000)
    await assertNonBlank(page)
    await page.screenshot({ path: path.join(outDir, "home-desktop.png"), fullPage: true })

    await page.goto("/events")
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(outDir, "events-desktop.png"), fullPage: true })

    await page.goto("/dashboard")
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(outDir, "dashboard-desktop.png"), fullPage: true })
  })
})

test.describe("redesign handoff screenshots mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test("capture home and events", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(outDir, "home-mobile.png"), fullPage: true })

    await page.goto("/events")
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(outDir, "events-mobile.png"), fullPage: true })
  })
})
