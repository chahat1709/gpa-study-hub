import { test, expect, type Page, type TestInfo } from '@playwright/test';

test.describe('Deep feature audit', () => {
  test.setTimeout(120_000);
  const uniqueId = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  async function openApp(page: Page) {
    await page.route('**/api/**', route => route.abort());
    await page.addInitScript(() => {
      localStorage.setItem('gpa_hub_onboarded_v1', '1');
      localStorage.setItem('GPA_HUB_API_URL', 'http://127.0.0.1:9');
      if (!sessionStorage.getItem('deep-audit-initialized')) {
        localStorage.removeItem('gpa_rbac_session_v1');
        localStorage.removeItem('gpa_rbac_users_v1');
        sessionStorage.setItem('deep-audit-initialized', '1');
      }
    });
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.getByLabel('Full name').fill('Deep Audit Student');
    await page.getByLabel('Enrollment number').fill(`236080${uniqueId().slice(-6)}`);
    await page.getByLabel('Set four digit PIN').fill('2468');
    await page.getByLabel('Confirm four digit PIN').fill('2468');
    await page.getByRole('button', { name: 'Create student account' }).click();
    await expect(page.locator('main')).toBeVisible({ timeout: 60000 });
    await expect(page.getByText('Your academic command center', { exact: true })).toBeVisible({
      timeout: 60000,
    });
  }

  async function clickSidebar(page: Page, label: string) {
    const button = page.locator('.ui-sidebar nav button').filter({ hasText: label }).first();
    await expect(button).toBeVisible();
    await button.click();
  }

  function skipMobile(testInfo: TestInfo) {
    test.skip(
      testInfo.project.name === 'mobile-chrome',
      'This journey targets the desktop sidebar/header architecture.'
    );
  }

  function skipDesktop(testInfo: TestInfo) {
    test.skip(
      testInfo.project.name === 'chromium',
      'This journey targets the mobile dock/header architecture.'
    );
  }

  test('authenticated shell exposes every desktop workspace and essential chrome', async ({
    page,
  }, testInfo) => {
    skipMobile(testInfo);
    await openApp(page);
    for (const label of [
      'Overview',
      'Attendance',
      'Planner',
      'Library',
      'Exam Hub',
      'AI Tutor',
      'Scanner',
      'Network',
      'Identity',
    ]) {
      await expect(
        page.locator('.ui-sidebar nav button').filter({ hasText: label }).first()
      ).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'View notifications' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Search or jump to/ })).toBeVisible();
  });

  test('desktop command palette searches and navigates to a workspace', async ({
    page,
  }, testInfo) => {
    skipMobile(testInfo);
    await openApp(page);
    await page.getByRole('button', { name: /Search or jump to/ }).click();
    await expect(page.getByRole('dialog', { name: 'Search and commands' })).toBeVisible();
    const input = page.getByRole('textbox', { name: 'Search features or actions' });
    await input.fill('exam');
    await expect(page.getByRole('button', { name: /Prepare for an exam/ })).toBeVisible();
    await page.getByRole('button', { name: /Prepare for an exam/ }).click();
    await expect(page.getByRole('heading', { name: 'Examinations & Quiz Hub' })).toBeVisible();
  });

  test('notifications popover opens and exposes an empty or populated state', async ({
    page,
  }, testInfo) => {
    skipMobile(testInfo);
    await openApp(page);
    await page.getByRole('button', { name: 'View notifications' }).click();
    await expect(page.getByText('Notifications', { exact: true })).toBeVisible();
    await expect(page.locator('.ui-notification-popover')).toContainText(
      /No notifications yet|View all|Mark all/
    );
  });

  test('desktop workspaces render distinct primary content', async ({ page }, testInfo) => {
    skipMobile(testInfo);
    await openApp(page);
    const cases: Array<[string, RegExp]> = [
      ['Overview', /Your academic command center/],
      ['Attendance', /Aggregate|Total Sessions|No classes scheduled/],
      ['Planner', /My Planner/],
      ['Library', /Library|Search resources|No resources found/],
      ['Exam Hub', /Examinations & Quiz Hub/],
      ['AI Tutor', /AI Tutor Locked|Hello! I am your AI study assistant|Type your message/],
      ['Scanner', /Scanner|Visual|Analyze|Upload/],
      ['Network', /Campus Link|No conversations yet|Search Directory/],
      ['Identity', /Profile|Identity|Account|Settings/],
    ];
    for (const [label, expected] of cases) {
      await clickSidebar(page, label);
      await expect(page.locator('main')).toContainText(expected, { timeout: 15000 });
    }
  });

  test('campus tabs switch between overview, faculty directory, and campus information', async ({
    page,
  }, testInfo) => {
    skipMobile(testInfo);
    await openApp(page);
    await clickSidebar(page, 'Overview');
    await expect(page.getByText('Your academic command center', { exact: true })).toBeVisible();
    const campusTabs = page.locator('.campus-tabs button');
    await expect(campusTabs).toHaveCount(3);
    await campusTabs.nth(1).click();
    await expect(page.locator('main')).toContainText(/Faculty directory|Faculty|Message/);
    await campusTabs.nth(2).click();
    await expect(page.locator('main')).toContainText(
      /Campus info|Secure campus node|Offline-first/
    );
  });

  test('attendance tabs switch between stats and schedule', async ({ page }, testInfo) => {
    skipMobile(testInfo);
    await openApp(page);
    await clickSidebar(page, 'Attendance');
    await expect(page.getByRole('tab', { name: 'Stats' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('main')).toContainText(/Aggregate|Total Sessions/);
    await page.getByRole('tab', { name: 'Schedule' }).click();
    await expect(page.getByRole('tab', { name: 'Schedule' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(page.locator('main')).toContainText(/MON|TUE|No classes scheduled/);
  });

  test('exam hub tabs switch between quizzes, papers, and grader', async ({ page }, testInfo) => {
    skipMobile(testInfo);
    await openApp(page);
    await clickSidebar(page, 'Exam Hub');
    for (const label of ['Timed AI Quizzes', 'GTU Past Papers', 'AI Answer Grader']) {
      await page.getByRole('tab', { name: label }).click();
      await expect(page.getByRole('tab', { name: label })).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('planner creates, completes, and deletes a task', async ({ page }, testInfo) => {
    skipMobile(testInfo);
    await openApp(page);
    await clickSidebar(page, 'Planner');
    const input = page.getByPlaceholder('Add a new task...');
    await expect(input).toBeVisible();
    const task = `Deep audit task ${Date.now()}`;
    await input.fill(task);
    await input.press('Enter');
    await page.waitForTimeout(300);
    await expect(page.getByText(task, { exact: true })).toBeVisible();
    const row = page.getByText(task, { exact: true }).locator('..').locator('..');
    const controls = row.locator('button');
    await expect(controls).toHaveCount(2);
    await controls.nth(0).click();
    await expect(page.getByText(task, { exact: true })).toBeVisible();
    await controls.nth(1).click();
    await expect(page.getByText(task, { exact: true })).toBeHidden();
  });

  test('profile workspace exposes account information and settings controls', async ({
    page,
  }, testInfo) => {
    skipMobile(testInfo);
    await openApp(page);
    await clickSidebar(page, 'Identity');
    await expect(page.locator('main')).toContainText(/Profile|Identity|Account/);
    const profileUpload = page.locator('input[type="file"]').first();
    await expect(profileUpload).toHaveAttribute('accept', 'image/*');
  });

  test('mobile dock navigates every available mobile workspace and preserves active semantics', async ({
    page,
  }) => {
    await openApp(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.locator('main')).toBeVisible({ timeout: 60000 });
    await expect(page.getByText('Your academic command center', { exact: true })).toBeVisible({
      timeout: 60000,
    });
    await expect(
      page.locator('.ui-mobile-dock nav[aria-label="Main navigation"]:visible')
    ).toBeVisible();
    const mobileModes: Array<[string, RegExp]> = [
      ['Navigate to Campus Home', /Your academic command center/],
      ['Navigate to Exam Hub', /Examinations & Quiz Hub/],
      ['Navigate to Profile', /Profile|Identity|Account/],
    ];
    const mobileDock = page.locator('.ui-mobile-dock:visible');
    for (const [ariaLabel, expected] of mobileModes) {
      const button = mobileDock.getByRole('tab', { name: ariaLabel });
      await expect(button).toBeVisible();
      await button.click();
      await expect(button).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('main')).toContainText(expected, { timeout: 15000 });
    }
  });

  test('mobile full-screen Tutor provides an explicit path back to Campus', async ({ page }) => {
    await openApp(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.getByText('Your academic command center', { exact: true })).toBeVisible({
      timeout: 60000,
    });
    await page.getByRole('button', { name: /Ask the AI Tutor/ }).click();
    await expect(page.locator('main')).toContainText(
      /AI Tutor Locked|Hello! I am your AI study assistant|Type your message/,
      { timeout: 15000 }
    );
    await expect(page.locator('.ui-mobile-dock')).toHaveCount(0);
    await page.getByRole('button', { name: 'Go back to Campus Home' }).click();
    await expect(page.getByText('Your academic command center', { exact: true })).toBeVisible();
  });

  test('mobile profile header opens the profile workspace', async ({ page }) => {
    await openApp(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.locator('main')).toBeVisible({ timeout: 60000 });
    await expect(page.getByText('Your academic command center', { exact: true })).toBeVisible({
      timeout: 60000,
    });
    await page.getByRole('button', { name: 'Open profile settings' }).click();
    await expect(page.locator('main')).toContainText(/Profile|Identity|Account/);
  });

  test('logout returns the user to the sign-in page', async ({ page }, testInfo) => {
    skipMobile(testInfo);
    await openApp(page);
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible({
      timeout: 15000,
    });
  });
});
