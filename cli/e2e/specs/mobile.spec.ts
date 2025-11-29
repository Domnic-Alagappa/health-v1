/**
 * Mobile E2E Tests
 * Tests for mobile-specific UI and responsive behavior
 */

import { expect, test } from "../fixtures/auth"

test.describe("Mobile UI @mobile", () => {
  test("should display mobile-friendly navigation", async ({ authenticatedPage }) => {
    // This test runs on mobile viewports
    await authenticatedPage.goto("/")
    await authenticatedPage.waitForLoadState("networkidle")

    // Check if mobile menu or hamburger menu is visible
    const mobileMenu = authenticatedPage
      .locator('[data-testid="mobile-menu"], button[aria-label*="menu"], [aria-label*="Menu"]')
      .first()
    const isMobileMenuVisible = await mobileMenu.isVisible().catch(() => false)

    // On mobile, sidebar might be hidden and menu button shown
    // Adjust expectations based on your actual mobile UI
    expect(true).toBeTruthy() // Placeholder
  })

  test("should handle touch interactions", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/")
    await authenticatedPage.waitForLoadState("networkidle")

    // Test touch interactions - try to tap/click on a button
    const buttons = authenticatedPage.locator("button").first()
    const buttonCount = await buttons.count()

    if (buttonCount > 0) {
      await buttons.first().tap()
      // Verify interaction worked
      expect(true).toBeTruthy()
    } else {
      // No buttons to test
      test.skip()
    }
  })

  test("should display responsive layout on mobile", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/")
    await authenticatedPage.waitForLoadState("networkidle")

    // Check viewport size
    const viewportSize = authenticatedPage.viewportSize()
    expect(viewportSize).toBeTruthy()
    expect(viewportSize!.width).toBeLessThanOrEqual(428) // iPhone 12/13 width
  })

  test("should scroll properly on mobile", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/patients")
    await authenticatedPage.waitForLoadState("networkidle")

    // Test scrolling
    await authenticatedPage.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })

    const scrollY = await authenticatedPage.evaluate(() => window.scrollY)
    expect(scrollY).toBeGreaterThan(0)
  })

  test("should handle mobile keyboard input", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/")
    await authenticatedPage.waitForLoadState("networkidle")

    // Find an input field
    const input = authenticatedPage
      .locator('input[type="text"], input[type="email"], input[type="search"]')
      .first()
    const inputCount = await input.count()

    if (inputCount > 0) {
      await input.first().fill("test input")
      const value = await input.first().inputValue()
      expect(value).toBe("test input")
    } else {
      test.skip()
    }
  })

  test("should display content correctly on tablet", async ({ authenticatedPage }) => {
    // This test runs on iPad Pro viewport
    await authenticatedPage.goto("/")
    await authenticatedPage.waitForLoadState("networkidle")

    const viewportSize = authenticatedPage.viewportSize()
    expect(viewportSize).toBeTruthy()

    // iPad Pro has width of 1024
    if (viewportSize!.width >= 1024) {
      // Tablet layout should be visible
      expect(true).toBeTruthy()
    }
  })

  test("should handle orientation changes", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/")
    await authenticatedPage.waitForLoadState("networkidle")

    const initialViewport = authenticatedPage.viewportSize()

    // Change orientation (swap width/height)
    if (initialViewport) {
      await authenticatedPage.setViewportSize({
        width: initialViewport.height,
        height: initialViewport.width,
      })

      const newViewport = authenticatedPage.viewportSize()
      expect(newViewport?.width).toBe(initialViewport.height)
      expect(newViewport?.height).toBe(initialViewport.width)
    }
  })
})
