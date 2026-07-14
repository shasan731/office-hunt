import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'salary-chase-office-adventure';

const waitForScene = async (page: Page, key: string): Promise<void> => {
  await page.waitForFunction((sceneKey) => window.__salaryChase?.scene.isActive(sceneKey), key);
};

const clickGame = async (page: Page, x: number, y: number): Promise<void> => {
  const canvas = page.locator('canvas'); const box = await canvas.boundingBox();
  if (!box) throw new Error('Game canvas missing');
  await page.mouse.click(box.x + x * box.width / 1280, box.y + y * box.height / 720);
};

const startGame = async (page: Page, name = 'Test Developer'): Promise<void> => {
  await clickGame(page, 920, 390);
  await waitForScene(page, 'NameEntryScene');
  await page.getByLabel('YOUR OFFICE NAME').fill(name);
  await page.getByRole('button', { name: 'START THE WORKDAY' }).click();
  await waitForScene(page, 'CommuteScene');
};

test.beforeEach(async ({ page }) => { await page.goto('/'); await waitForScene(page, 'MainMenuScene'); });

test('main menu loads without browser errors', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await expect(page).toHaveTitle(/Salary Chase/); await expect(page.locator('canvas')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Play starts game and keyboard moves the employee', async ({ page }) => {
  await startGame(page);
  const before = await page.evaluate(() => (window.__salaryChase?.scene.getScene('CommuteScene') as unknown as { player: { x: number } }).player.x);
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(250); await page.keyboard.up('ArrowRight');
  const after = await page.evaluate(() => (window.__salaryChase?.scene.getScene('CommuteScene') as unknown as { player: { x: number } }).player.x);
  expect(after).toBeGreaterThan(before);
  expect(await page.evaluate((key) => localStorage.getItem(key)?.includes('Test Developer') ?? false, SAVE_KEY)).toBe(false);
});

test('pause menu opens', async ({ page }) => {
  await startGame(page); await page.keyboard.press('Escape');
  await waitForScene(page, 'PauseScene'); expect(await page.evaluate(() => window.__salaryChase?.scene.isPaused('CommuteScene'))).toBe(true);
});

test('settings persist after reload', async ({ page }) => {
  await clickGame(page, 1030, 465); await clickGame(page, 430, 310);
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').settings?.muted, SAVE_KEY)).toBe(false);
  await page.reload(); await waitForScene(page, 'MainMenuScene');
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').settings.muted, SAVE_KEY)).toBe(false);
});

for (const mode of [
  { name: 'casual', x: 410, codingCount: 3 },
  { name: 'normal', x: 640, codingCount: 4 },
  { name: 'corporate', x: 870, codingCount: 5 },
] as const) {
  test(`${mode.name} difficulty persists and starts with the correct coding workload`, async ({ page }) => {
    await clickGame(page, 1030, 465);
    await clickGame(page, mode.x, 210);
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').settings?.difficulty, SAVE_KEY)).toBe(mode.name);
    await startGame(page, `${mode.name} QA`);
    await page.evaluate(() => window.__salaryChase?.scene.start('CodingScene'));
    await waitForScene(page, 'CodingScene');
    expect(await page.evaluate(() => (window.__salaryChase?.scene.getScene('CodingScene') as unknown as { targetCount: number }).targetCount)).toBe(mode.codingCount);
  });
}

test('high-score screen opens and canvas fits viewport', async ({ page }) => {
  await clickGame(page, 810, 535); await page.waitForTimeout(100);
  const canvas = page.locator('canvas'); const box = await canvas.boundingBox(); const viewport = page.viewportSize();
  expect(box).not.toBeNull(); expect(viewport).not.toBeNull(); expect(box!.width).toBeLessThanOrEqual(viewport!.width); expect(box!.height).toBeLessThanOrEqual(viewport!.height);
});

test('pixel office escape and support-zombie attack initialize safely', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await startGame(page, 'Pixel QA');
  await page.evaluate(() => window.__salaryChase?.scene.start('EscapeScene'));
  await waitForScene(page, 'EscapeScene');
  await page.waitForTimeout(1400);
  await page.screenshot({ path: 'test-results/escape-pixel-qa.png' });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__salaryChase?.scene.isActive('EscapeScene'))).toBe(true);
});

test('restarting reused scenes does not retain stale gameplay objects', async ({ page }) => {
  test.setTimeout(60_000);
  await startGame(page, 'Restart QA');
  await page.evaluate(() => window.__salaryChase?.scene.start('EscapeScene'));
  await waitForScene(page, 'EscapeScene');
  const before = await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('EscapeScene') as unknown as { traps: unknown[]; hideSpots: unknown[] };
    return { traps: scene.traps.length, hideSpots: scene.hideSpots.length };
  });
  await page.evaluate(() => window.__salaryChase?.scene.getScene('EscapeScene').scene.restart());
  await page.waitForTimeout(250);
  await waitForScene(page, 'EscapeScene');
  const after = await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('EscapeScene') as unknown as { traps: unknown[]; hideSpots: unknown[] };
    return { traps: scene.traps.length, hideSpots: scene.hideSpots.length };
  });
  expect(before).toEqual({ traps: 8, hideSpots: 3 });
  expect(after).toEqual(before);
});
