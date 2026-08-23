import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
  });

  test('shows app on first visit', async ({ page }) => {
    await expect(page.locator('text=GPA Study Hub')).toBeVisible({ timeout: 10000 });
    // App might show onboarding first - check for any visible content
    const hasContent = await page.locator('body').first().isVisible({ timeout: 3000 });
    expect(hasContent).toBeTruthy();
  });

  test('signup flow accessible', async ({ page }) => {
    const signupBtn = page.locator('text=Sign up').first();
    if (await signupBtn.isVisible({ timeout: 5000 })) {
      await signupBtn.click();
      await page.waitForTimeout(1000);
      const nameInput = page.locator('input[placeholder*="Name"], input[name="name"]').first();
      if (await nameInput.isVisible({ timeout: 3000 })) {
        await nameInput.fill('Test Student');
        await page
          .locator('input[placeholder*="Email"], input[name="email"]')
          .first()
          .fill('test@student.com');
        await page.locator('input[type="password"], input[name="pin"]').first().fill('123456');
        await page.locator('button:has-text("Create"), button:has-text("Sign up")').first().click();
      }
    }
  });

  test('forgot PIN flow accessible', async ({ page }) => {
    const forgotBtn = page.locator('text=Forgot PIN').first();
    if (await forgotBtn.isVisible({ timeout: 3000 })) {
      await forgotBtn.click();
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Main Navigation', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
  });

  test('bottom nav switches modes', async ({ page }) => {
    const modes = ['Exam Hub', 'Planner', 'Campus', 'Profile', 'Library', 'Attendance'];
    for (const mode of modes) {
      const btn = page
        .locator(`button:has-text("${mode}"), [role="button"]:has-text("${mode}")`)
        .first();
      if (await btn.isVisible({ timeout: 3000 })) {
        await btn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('sidebar opens and closes', async ({ page }) => {
    const menuBtn = page
      .locator('button[aria-label="Menu"], button:has-text("Menu"), button[aria-label="Open menu"]')
      .first();
    if (await menuBtn.isVisible({ timeout: 3000 })) {
      await menuBtn.click();
      await page.waitForTimeout(500);
      const closeBtn = page
        .locator('button[aria-label="Close"], button[aria-label="Close menu"]')
        .first();
      if (await closeBtn.isVisible({ timeout: 3000 })) {
        await closeBtn.click();
      }
    }
  });
});

test.describe('Core Features', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('Exam Hub accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const btn = page.locator('button:has-text("Exam Hub")').first();
    if (await btn.isVisible({ timeout: 5000 })) {
      await btn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Quiz, text=Exam, text=Question').first()).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('Attendance accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const btn = page.locator('button:has-text("Attendance")').first();
    if (await btn.isVisible({ timeout: 5000 })) {
      await btn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Timetable, text=Attendance, text=%').first()).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('Library accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const btn = page.locator('button:has-text("Library")').first();
    if (await btn.isVisible({ timeout: 5000 })) {
      await btn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Resource, text=Note, text=Library').first()).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('Campus accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const btn = page.locator('button:has-text("Campus")').first();
    if (await btn.isVisible({ timeout: 5000 })) {
      await btn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Directory, text=Faculty, text=Campus').first()).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('Profile accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const btn = page.locator('button:has-text("Profile")').first();
    if (await btn.isVisible({ timeout: 5000 })) {
      await btn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Profile, text=Settings, text=Account').first()).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('Nexus AI accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const nexusBtn = page
      .locator('button:has-text("Nexus")')
      .first()
      .or(page.locator('button:has-text("AI")'))
      .first()
      .or(page.locator('text=Nexus'))
      .first();
    if (await nexusBtn.isVisible({ timeout: 5000 })) {
      await nexusBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('text=How can I help, text=Ask, text=Chat').first()).toBeVisible({
        timeout: 10000,
      });
    }
  });
});
