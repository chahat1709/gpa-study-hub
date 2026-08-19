import { test, expect } from '@playwright/test';

test('setup: create authenticated user', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  console.log('Page loaded, errors:', errors);
  console.log('Page title:', await page.title());
  console.log('Page URL:', page.url());

  // Check if already logged in
  const userMenu = page.locator('button[aria-label="User menu"]').first();
  const profileText = page.locator('text=Profile').first();
  if (await userMenu.isVisible({ timeout: 2000 }) || await profileText.isVisible({ timeout: 2000 })) {
    await page.context().storageState({ path: 'e2e/.auth/user.json' });
    return;
  }

  // Try signup
  const signupBtn = page.locator('text=Sign up, button:has-text("Sign up")').first();
  if (await signupBtn.isVisible({ timeout: 5000 })) {
    await signupBtn.click();
    await page.waitForTimeout(1000);
    const nameInput = page.locator('input[placeholder*="Name"], input[name="name"]').first();
    if (await nameInput.isVisible({ timeout: 5000 })) {
      await nameInput.fill('Test Student');
      await page.locator('input[placeholder*="Email"], input[name="email"]').first().fill('test@student.com');
      await page.locator('input[type="password"], input[name="pin"]').first().fill('123456');
      await page.locator('button:has-text("Create"), button:has-text("Sign up")').first().click();
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    }
  } else {
    // Try PIN login
    const pinInput = page.locator('input[type="password"], input[name="pin"]').first();
    if (await pinInput.isVisible({ timeout: 5000 })) {
      await pinInput.fill('123456');
      await page.locator('button:has-text("Login")').first().click();
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    }
  }

  await page.context().storageState({ path: 'e2e/.auth/user.json' });
  console.log('Auth state saved');
});