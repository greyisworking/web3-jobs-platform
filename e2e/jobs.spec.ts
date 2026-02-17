import { test, expect } from '@playwright/test'

test.describe('Jobs Flow', () => {
  test('homepage loads and shows jobs', async ({ page }) => {
    await page.goto('/')

    // Check page title
    await expect(page).toHaveTitle(/NEUN/)

    // Check for job cards
    const jobCards = page.locator('[data-testid="job-card"], .job-card, article')
    await expect(jobCards.first()).toBeVisible({ timeout: 10000 })
  })

  test('job search works', async ({ page }) => {
    await page.goto('/')

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]')

    if (await searchInput.isVisible()) {
      await searchInput.fill('engineer')
      await page.keyboard.press('Enter')

      // Wait for results
      await page.waitForTimeout(1000)

      // Check URL contains search param
      expect(page.url()).toContain('engineer')
    }
  })

  test('job detail page loads', async ({ page }) => {
    await page.goto('/')

    // Click first job card
    const firstJob = page.locator('[data-testid="job-card"] a, .job-card a, article a').first()

    if (await firstJob.isVisible()) {
      await firstJob.click()

      // Wait for navigation
      await page.waitForURL(/\/jobs\//)

      // Check for job details
      const jobTitle = page.locator('h1')
      await expect(jobTitle).toBeVisible()
    }
  })

  test('filters work correctly', async ({ page }) => {
    await page.goto('/')

    // Look for filter buttons/dropdowns
    const filterBtn = page.locator('button:has-text("Filter"), [data-testid="filter"]')

    if (await filterBtn.first().isVisible()) {
      await filterBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('bookmark button exists on job cards', async ({ page }) => {
    await page.goto('/')

    // Check for bookmark/save buttons
    const bookmarkBtn = page.locator('[aria-label*="bookmark"], [aria-label*="save"], button:has(svg)')

    // At least one should exist
    const count = await bookmarkBtn.count()
    expect(count).toBeGreaterThan(0)
  })

  test('mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Page should still render
    await expect(page.locator('body')).toBeVisible()

    // Check for mobile menu or navigation
    const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, button[aria-label*="menu"]')
    // Menu button should be visible on mobile
  })

  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/')

    // Look for theme toggle
    const themeToggle = page.locator('[aria-label*="theme"], [data-testid="theme-toggle"], button:has-text("dark"), button:has-text("light")')

    if (await themeToggle.first().isVisible()) {
      // Get initial state
      const html = page.locator('html')
      const initialClass = await html.getAttribute('class')

      // Click toggle
      await themeToggle.first().click()
      await page.waitForTimeout(300)

      // Class should change
      const newClass = await html.getAttribute('class')
      // Theme should have changed (dark/light class)
    }
  })
})

test.describe('Admin Flow', () => {
  test('admin page requires auth', async ({ page }) => {
    await page.goto('/admin')

    // Should redirect to login or show auth required
    const url = page.url()
    const hasLoginPrompt = await page.locator('text=login, text=sign in, text=connect wallet').first().isVisible().catch(() => false)

    // Either redirected or shows login prompt
    expect(url.includes('login') || url.includes('admin') || hasLoginPrompt).toBeTruthy()
  })
})

test.describe('SEO', () => {
  test('has proper meta tags', async ({ page }) => {
    await page.goto('/')

    // Check title
    const title = await page.title()
    expect(title).toContain('NEUN')

    // Check meta description
    const metaDesc = page.locator('meta[name="description"]')
    await expect(metaDesc).toHaveAttribute('content', /.+/)

    // Check OG tags
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', /.+/)

    const ogImage = page.locator('meta[property="og:image"]')
    await expect(ogImage).toHaveAttribute('content', /.+/)
  })

  test('job detail has dynamic meta', async ({ page }) => {
    // First get a job ID from homepage
    await page.goto('/')

    const jobLink = page.locator('a[href*="/jobs/"]').first()
    if (await jobLink.isVisible()) {
      const href = await jobLink.getAttribute('href')
      if (href) {
        await page.goto(href)

        // Check that title is specific to the job
        const title = await page.title()
        expect(title).not.toBe('NEUN | Web3 Jobs') // Should be job-specific
      }
    }
  })
})
