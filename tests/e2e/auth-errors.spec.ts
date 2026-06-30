import { test, expect } from "@playwright/test"

async function fillSignupForm(
  page: import("@playwright/test").Page,
  opts: { email: string; displayName?: string; password?: string; phone?: string },
) {
  await page.getByLabel(/display name/i).fill(opts.displayName ?? "Jordan")
  await page.getByLabel(/^email$/i).fill(opts.email)
  await page.getByLabel(/^password$/i).fill(opts.password ?? "secret12")
  await page.getByLabel(/^phone/i).fill(opts.phone ?? "7575550123")
}

async function waitForAuthForm(page: import("@playwright/test").Page) {
  await expect(page.getByTestId("auth-form")).toHaveAttribute("data-auth-ready", "true")
}

test.describe("Auth error UX (mocked Supabase)", () => {
  test("signup with existing email shows AuthAlert and sign-in action", async ({ page }) => {
    await page.route("**/auth/v1/signup**", async (route) => {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          error_code: "user_already_exists",
          msg: "User already registered",
        }),
      })
    })

    await page.goto("/signup")
    await waitForAuthForm(page)
    await fillSignupForm(page, { email: "taken@example.com", displayName: "Jordan" })
    await page.getByRole("button", { name: /create account/i }).click()

    const alert = page.getByTestId("auth-alert")
    await expect(alert).toBeVisible()
    await expect(alert).toContainText(/account already exists/i)
    await expect(page.getByRole("link", { name: /go to sign in/i })).toBeVisible()
  })

  test("login with wrong password shows friendly copy", async ({ page }) => {
    await page.route("**/auth/v1/token**", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: "invalid_grant",
          error_description: "Invalid login credentials",
        }),
      })
    })

    await page.goto("/login")
    await waitForAuthForm(page)
    await page.getByLabel(/^email$/i).fill("user@example.com")
    await page.getByLabel(/^password$/i).fill("wrong-pass")
    await page.getByRole("button", { name: /sign in/i }).click()

    const alert = page.getByTestId("auth-alert")
    await expect(alert).toBeVisible()
    await expect(alert).toContainText(/wrong email or password/i)
    await expect(page.getByRole("link", { name: /reset password/i })).toBeVisible()
  })

  test("rate limit mapping (unit-style signal via API copy)", async ({ page }) => {
    await page.route("**/auth/v1/signup**", async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ message: "email rate limit exceeded" }),
      })
    })

    await page.goto("/signup")
    await waitForAuthForm(page)
    await fillSignupForm(page, { email: "new@example.com", displayName: "Alex" })
    await page.getByRole("button", { name: /create account/i }).click()

    await expect(page.getByTestId("auth-alert")).toContainText(/slow down/i)
  })
})

test.describe("Auth error screenshots", () => {
  test("capture signup and login desktop alerts for docs", async ({ page }) => {
    await page.route("**/auth/v1/signup**", async (route) => {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ msg: "User already registered" }),
      })
    })
    await page.route("**/auth/v1/token**", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error_description: "Invalid login credentials" }),
      })
    })

    await page.goto("/signup")
    await waitForAuthForm(page)
    await fillSignupForm(page, { email: "taken@example.com", displayName: "Jordan" })
    await page.getByRole("button", { name: /create account/i }).click()
    await expect(page.getByTestId("auth-alert")).toBeVisible()
    await page.screenshot({
      path: "docs/plans/auth-error-ux/signup-desktop.png",
      fullPage: true,
    })

    await page.goto("/login")
    await waitForAuthForm(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByLabel(/^email$/i).fill("user@example.com")
    await page.getByLabel(/^password$/i).fill("bad")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page.getByTestId("auth-alert")).toBeVisible()
    await page.screenshot({
      path: "docs/plans/auth-error-ux/login-mobile.png",
      fullPage: true,
    })
  })
})
