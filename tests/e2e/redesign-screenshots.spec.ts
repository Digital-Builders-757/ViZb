import { test } from "@playwright/test"
import path from "node:path"

const outDir = path.join(process.cwd(), "docs", "redesign", "screenshots")

test.describe("redesign handoff screenshots", () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test("capture home and events", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1500)
    await page.screenshot({
      path: path.join(outDir, "home-desktop.png"),
      fullPage: true,
    })

    await page.goto("/events")
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1500)
    await page.screenshot({
      path: path.join(outDir, "events-desktop.png"),
      fullPage: true,
    })
  })
})
