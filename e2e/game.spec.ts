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
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Salary Chase');
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', 'Salary Chase');
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

test('pixel commute vehicles are fatal and show the late-to-office screen', async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await startGame(page, 'Traffic QA');
  const traffic = await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('CommuteScene') as unknown as {
      vehicles: Array<{ object: { getData: (key: string) => unknown } }>;
    };
    return scene.vehicles.map((vehicle) => vehicle.object.getData('vehicleType'));
  });
  expect(traffic).toEqual(['car', 'bus', 'rickshaw', 'car', 'bus', 'car']);
  await page.screenshot({ path: 'test-results/commute-pixel-qa.png' });
  await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('CommuteScene') as unknown as {
      player: { x: number; y: number };
      vehicles: Array<{ object: { x: number; y: number } }>;
    };
    scene.player.x = scene.vehicles[0].object.x;
    scene.player.y = scene.vehicles[0].object.y;
  });
  await waitForScene(page, 'GameOverScene');
  await page.screenshot({ path: 'test-results/game-over-pixel-qa.png' });
  const copy = await page.evaluate(() => {
    const items = window.__salaryChase?.scene.getScene('GameOverScene').children.list as Array<{ type: string; text?: string }>;
    return items.filter((item) => item.type === 'Text').map((item) => item.text ?? '');
  });
  expect(copy).toContain('YOU ARE LATE TO THE OFFICE');
  expect(errors).toEqual([]);
  await clickGame(page, 500, 575);
  await waitForScene(page, 'CommuteScene');
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

test('retro Bug Bash damages the tester, records a KO, and continues to tea break', async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await startGame(page, 'Fight QA');
  await page.evaluate(() => window.__salaryChase?.scene.start('FightScene'));
  await waitForScene(page, 'FightScene');
  await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('FightScene') as unknown as {
      developer: { x: number };
      tester: { x: number };
      testerActionUntil: number;
      playerActionUntil: number;
      introLocked: boolean;
      playerAttack: (kind: 'punch' | 'kick') => void;
    };
    scene.introLocked = false;
    scene.developer.x = scene.tester.x - 100;
    scene.testerActionUntil = Number.MAX_SAFE_INTEGER;
    scene.playerActionUntil = 0;
    scene.playerAttack('punch');
  });
  await expect.poll(() => page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('FightScene') as unknown as { testerHealth: number };
    return scene.testerHealth;
  })).toBeLessThan(100);
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('FightScene') as unknown as {
      developer: { x: number };
      tester: { x: number };
      testerHealth: number;
      playerActionUntil: number;
      playerAttack: (kind: 'punch' | 'kick') => void;
    };
    scene.developer.x = scene.tester.x - 100;
    scene.testerHealth = 1;
    scene.playerActionUntil = 0;
    scene.playerAttack('punch');
  });
  await expect.poll(() => page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('FightScene') as unknown as { ended: boolean };
    return scene.ended;
  })).toBe(true);
  await page.waitForTimeout(500);
  const victory = await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('FightScene') as unknown as { ended: boolean; testerHealth: number };
    return { ended: scene.ended, testerHealth: scene.testerHealth };
  });
  expect(victory.ended).toBe(true);
  expect(victory.testerHealth).toBe(0);
  expect(errors).toEqual([]);
  await expect.poll(() => page.evaluate(() => {
    const items = window.__salaryChase?.scene.getScene('FightScene').children.list as Array<{ type: string; text?: string }>;
    return items.filter((item) => item.type === 'Text').map((item) => item.text ?? '');
  })).toContain('DEVELOPER WINS');
  await page.screenshot({ path: 'test-results/bug-bash-victory.png' });
  await clickGame(page, 640, 480);
  await waitForScene(page, 'TeaBreakScene');
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
