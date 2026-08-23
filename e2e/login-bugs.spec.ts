import { test, expect, type Page } from '@playwright/test';

const uniqueId = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function openLogin(page: Page) {
  await page.route('**/api/**', route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('gpa_hub_onboarded_v1', '1');
    localStorage.setItem('GPA_HUB_API_URL', 'http://127.0.0.1:9');
    if (!sessionStorage.getItem('login-test-initialized')) {
      localStorage.removeItem('gpa_rbac_session_v1');
      localStorage.removeItem('gpa_rbac_users_v1');
      localStorage.removeItem('gpa_hub_rate_limits');
      sessionStorage.setItem('login-test-initialized', '1');
    }
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
}

async function fillStudentPin(page: Page, pin: string) {
  const digits = page.locator('input.auth-pin-digit');
  expect(pin).toHaveLength(4);
  for (let i = 0; i < pin.length; i += 1) {
    await digits.nth(i).fill(pin.charAt(i));
  }
}

async function registerStudentThroughUi(page: Page, enrollment: string, pin = '2468') {
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByLabel('Full name').fill('Playwright Student');
  await page.getByLabel('Enrollment number').fill(enrollment);
  await page.getByLabel('Set four digit PIN').fill(pin);
  await page.getByLabel('Confirm four digit PIN').fill(pin);
  await page.getByRole('button', { name: 'Create student account' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeHidden();
}

test.describe('Login page bug coverage', () => {
  test.beforeEach(async ({ page }) => {
    await openLogin(page);
  });

  test('student registration accepts all fields and creates a session', async ({ page }) => {
    await registerStudentThroughUi(page, `PW${uniqueId()}`);
    const session = await page.evaluate(() => localStorage.getItem('gpa_rbac_session_v1'));
    expect(session).toBeTruthy();
  });

  test('student login succeeds with enrollment and four individual PIN digits', async ({
    page,
  }) => {
    const enrollment = `236080${uniqueId().slice(-6)}`;
    await registerStudentThroughUi(page, enrollment);
    await page.evaluate(() => localStorage.removeItem('gpa_rbac_session_v1'));
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();

    await page.getByLabel('Enrollment number').fill(enrollment);
    await fillStudentPin(page, '2468');
    await page.getByRole('button', { name: 'Enter campus' }).click();

    await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('gpa_rbac_session_v1')))
      .toBeTruthy();
  });

  test('empty student enrollment shows a validation message instead of silently blocking submit', async ({
    page,
  }) => {
    await fillStudentPin(page, '2468');
    await page.getByRole('button', { name: 'Enter campus' }).click();
    await expect(page.getByText('Enter enrollment number', { exact: true })).toBeVisible();
  });

  test('incomplete student PIN shows a validation message', async ({ page }) => {
    await page.getByLabel('Enrollment number').fill(`PW${uniqueId()}`);
    await page.locator('input.auth-pin-digit').nth(0).fill('2');
    await page.locator('input.auth-pin-digit').nth(1).fill('4');
    await page.locator('input.auth-pin-digit').nth(2).fill('6');
    await page.getByRole('button', { name: 'Enter campus' }).click();
    await expect(page.getByText('Enter your 4-digit PIN', { exact: true })).toBeVisible();
  });

  test('forgot PIN opens the reset access flow and can return to login', async ({ page }) => {
    await page.getByRole('button', { name: /Forgot your PIN\?/ }).click();
    await expect(page.getByText('Reset PIN', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Your Enrollment Number')).toBeVisible();
    await page.getByRole('button', { name: 'Back to sign in' }).click();
    await expect(page.getByRole('button', { name: /Forgot your PIN\?/ })).toBeVisible();
  });

  test('role tabs switch to faculty and admin forms', async ({ page }) => {
    await page.getByRole('tab', { name: 'Faculty' }).click();
    await expect(page.getByLabel('Work email')).toBeVisible();
    await expect(page.locator('input[aria-label="Password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Access faculty workspace' })).toBeVisible();

    await page.getByRole('tab', { name: 'Admin' }).click();
    await expect(page.getByLabel('Admin access code')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enter admin workspace' })).toBeVisible();

    await page.getByRole('tab', { name: 'Student' }).click();
    await expect(page.getByLabel('Enrollment number')).toBeVisible();
  });

  test('faculty registration and login work through the browser flow', async ({ page }) => {
    const email = `pw-${uniqueId()}@example.com`;
    await page.getByRole('tab', { name: 'Faculty' }).click();
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.getByLabel('Full name').fill('Playwright Faculty');
    await page.getByLabel('Work email').fill(email);
    await page.locator('input[aria-label="Password"]').fill('faculty-password');
    await page.getByRole('button', { name: 'Create faculty account' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeHidden();

    await page.evaluate(() => localStorage.removeItem('gpa_rbac_session_v1'));
    await page.reload();
    await page.getByRole('tab', { name: 'Faculty' }).click();
    await page.getByLabel('Work email').fill(email);
    await page.locator('input[aria-label="Password"]').fill('faculty-password');
    await page.getByRole('button', { name: 'Access faculty workspace' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeHidden();
  });

  test('admin login accepts the configured bootstrap code', async ({ page }) => {
    const code = 'CHANGE_THIS_TO_SECURE_ADMIN_CODE';
    await page.getByRole('tab', { name: 'Admin' }).click();
    await page.getByLabel('Admin access code').fill(code);
    await page.getByRole('button', { name: 'Enter admin workspace' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeHidden();
  });

  test('auth form remains usable without horizontal overflow on a mobile viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
    await expect(page.getByLabel('Enrollment number')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enter campus' })).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasHorizontalOverflow).toBeFalsy();
  });
});

test.describe('Strict interaction audit', () => {
  test.beforeEach(async ({ page }) => {
    await openLogin(page);
  });

  test('student PIN entry advances focus across the four digit controls', async ({ page }) => {
    const digits = page.locator('input.auth-pin-digit');
    await digits.nth(0).pressSequentially('2');
    await expect(digits.nth(1)).toBeFocused();
    await digits.nth(1).pressSequentially('4');
    await expect(digits.nth(2)).toBeFocused();
    await digits.nth(2).pressSequentially('6');
    await expect(digits.nth(3)).toBeFocused();
  });

  test('student registration exposes matching PIN feedback and show/hide control', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.getByLabel('Full name').fill('Playwright Student');
    await page.getByLabel('Enrollment number').fill(`236080${uniqueId().slice(-6)}`);
    await page.getByLabel('Set four digit PIN').fill('2468');
    await page.getByLabel('Confirm four digit PIN').fill('2468');
    await expect(page.getByText('PINs match', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Show PIN' }).click();
    await expect(page.getByLabel('Set four digit PIN')).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: 'Hide PIN' })).toBeVisible();
  });

  test('faculty password visibility toggle changes the actual input type', async ({ page }) => {
    await page.getByRole('tab', { name: 'Faculty' }).click();
    const password = page.locator('input[aria-label="Password"]');
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('admin code visibility toggle changes the actual input type', async ({ page }) => {
    await page.getByRole('tab', { name: 'Admin' }).click();
    const code = page.getByLabel('Admin access code');
    await expect(code).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Show access code' }).click();
    await expect(code).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Hide access code' }).click();
    await expect(code).toHaveAttribute('type', 'password');
  });

  test('role tabs expose one selected workspace at a time', async ({ page }) => {
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(3);
    await expect(page.getByRole('tab', { name: 'Student' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(page.getByRole('tab', { name: 'Faculty' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
    await page.getByRole('tab', { name: 'Faculty' }).click();
    await expect(page.getByRole('tab', { name: 'Student' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
    await expect(page.getByRole('tab', { name: 'Faculty' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });
});
