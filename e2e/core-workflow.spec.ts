import { test, expect, type Page } from '@playwright/test';

const uniqueId = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function openLogin(page: Page) {
  await page.route('**/api/**', route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('gpa_hub_onboarded_v1', '1');
    localStorage.setItem('GPA_HUB_API_URL', 'http://127.0.0.1:9');
    if (!sessionStorage.getItem('core-workflow-initialized')) {
      localStorage.removeItem('gpa_rbac_session_v1');
      localStorage.removeItem('gpa_rbac_users_v1');
      localStorage.removeItem('gpa_hub_rate_limits');
      sessionStorage.setItem('core-workflow-initialized', '1');
    }
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
}

async function registerStudent(page: Page, enrollment: string, pin = '2468') {
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByLabel('Full name').fill('Core Workflow Student');
  await page.getByLabel('Enrollment number').fill(enrollment);
  await page.getByLabel('Set four digit PIN').fill(pin);
  await page.getByLabel('Confirm four digit PIN').fill(pin);
  await page.getByRole('button', { name: 'Create student account' }).click();
  await expect(page.getByText('Your academic command center', { exact: true })).toBeVisible({
    timeout: 60000,
  });
}

async function registerFaculty(page: Page, email: string) {
  await page.getByRole('tab', { name: 'Faculty' }).click();
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByLabel('Full name').fill('Core Workflow Faculty');
  await page.getByLabel('Work email').fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('Faculty123');
  await page.getByLabel('Department').selectOption('EC');
  await page.getByRole('button', { name: 'Create faculty account' }).click();
  await expect(page.getByRole('heading', { name: 'Control Center' })).toBeVisible({
    timeout: 60000,
  });
}

async function openAttendanceWorkspace(page: Page) {
  if ((page.viewportSize()?.width ?? 1280) < 768) {
    await page.getByRole('button', { name: 'View details' }).click();
    return;
  }
  const item = page.locator('.ui-sidebar nav button').filter({ hasText: 'Attendance' }).first();
  await expect(item).toBeVisible();
  await item.click();
}

test.describe('Core academic workflow', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await openLogin(page);
  });

  test('student signs in, reviews attendance history, and opens the weekly timetable', async ({
    page,
  }) => {
    const enrollment = `CW${uniqueId()}`;
    await registerStudent(page, enrollment);
    await page.evaluate(() => localStorage.removeItem('gpa_rbac_session_v1'));
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
    await page.getByLabel('Enrollment number').fill(enrollment);
    const digits = page.locator('input.auth-pin-digit');
    for (const [index, digit] of ['2', '4', '6', '8'].entries())
      await digits.nth(index).fill(digit);
    await page.getByRole('button', { name: 'Enter campus' }).click();
    await expect(page.getByText('Your academic command center', { exact: true })).toBeVisible({
      timeout: 60000,
    });

    await openAttendanceWorkspace(page);
    await expect(page.getByRole('heading', { name: 'Attendance' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Stats' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Subject Breakdown', { exact: true })).toBeVisible();
    await expect(page.getByText('Aggregate', { exact: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Schedule' }).click();
    await expect(page.getByRole('tab', { name: 'Schedule' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(page.getByRole('tab', { name: 'MON' })).toBeVisible();
    await page.getByRole('tab', { name: 'TUE' }).click();
    await expect(page.getByRole('tab', { name: 'TUE' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[role="tabpanel"]')).toContainText(/AD PYTHON|No classes scheduled/);
  });

  test('faculty can open a class roster, mark statuses, and save attendance', async ({ page }) => {
    await registerFaculty(page, `faculty-${uniqueId()}@gtu.edu`);
    await page.getByRole('button', { name: 'Classroom' }).click();
    await expect(page.getByRole('heading', { name: 'CLASSROOM' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Attendance roster/i })).toBeVisible();
    await expect(page.getByText(/students in this session/i)).toBeVisible();

    const roster = page.getByRole('region', { name: /Attendance roster/i });
    await expect(roster.getByRole('checkbox')).toHaveCount(5);
    await expect(page.getByRole('button', { name: /Mark all present/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Mark all absent/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save attendance' })).toBeVisible();

    await page.getByRole('button', { name: /Mark all present/i }).click();
    await expect(roster.getByRole('checkbox', { checked: true })).toHaveCount(5);
    await page.getByRole('checkbox').nth(0).uncheck();
    await expect(roster.getByRole('checkbox', { checked: false })).toHaveCount(1);
    await page.getByRole('button', { name: 'Save attendance' }).click();
    await expect(page.getByText('Attendance saved', { exact: true })).toBeVisible();
    await expect(page.getByText(/Present 4.*Absent 1/)).toBeVisible();
  });

  test('mobile student attendance keeps tabs and schedule inside the viewport', async ({
    page,
  }) => {
    await registerStudent(page, `MW${uniqueId()}`);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.getByText('Your academic command center', { exact: true })).toBeVisible({
      timeout: 60000,
    });
    await page.getByRole('button', { name: 'View details' }).click();
    await expect(page.getByRole('heading', { name: 'Attendance' })).toBeVisible();
    await page.getByRole('tab', { name: 'Schedule' }).click();
    await expect(page.getByRole('tab', { name: 'Schedule' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    const viewport = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(viewport.width).toBeLessThanOrEqual(viewport.client + 1);
  });
});
