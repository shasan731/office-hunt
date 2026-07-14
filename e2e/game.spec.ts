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
  await expect(page).toHaveTitle(/Office Hunt/); await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Office Hunt');
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', 'Office Hunt');
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

test('Level 1 requires five stair flights and attendance before coding unlocks', async ({ page }) => {
  test.setTimeout(60_000);
  await startGame(page, 'Level Gate QA');
  await page.evaluate(() => window.__salaryChase?.scene.start('LobbyScene'));
  await waitForScene(page, 'LobbyScene');
  for (let flight = 0; flight < 5; flight += 1) {
    await page.evaluate(() => {
      const scene = window.__salaryChase?.scene.getScene('LobbyScene') as unknown as {
        flight: number;
        player: { x: number; y: number };
        stairs: Array<{ x: number; y: number }>;
        interact: () => void;
      };
      const stair = scene.stairs[scene.flight];
      scene.player.x = stair.x; scene.player.y = stair.y; scene.interact();
    });
    await page.keyboard.press('e');
  }
  expect(await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('LobbyScene') as unknown as { flight: number };
    return scene.flight;
  })).toBe(5);
  await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('LobbyScene') as unknown as {
      player: { x: number; y: number };
      device: { x: number; y: number };
      interact: () => void;
    };
    scene.player.x = scene.device.x; scene.player.y = scene.device.y; scene.interact();
  });
  await page.keyboard.press('e');
  await waitForScene(page, 'CodingScene');
});

test('new level scenes initialize and lunch and tea timeouts still unlock the next level', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await startGame(page, 'Maze QA');
  await page.evaluate(() => window.__salaryChase?.scene.start('WorkGauntletScene'));
  await waitForScene(page, 'WorkGauntletScene');
  expect(await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('WorkGauntletScene') as unknown as { managers: unknown[]; hideSpots: unknown[]; keycard: unknown; officeChair: unknown; meetingButton: unknown };
    return { managers: scene.managers.length, hideSpots: scene.hideSpots.length, hasKeycardQuest: Boolean(scene.keycard), hasChairBoost: Boolean(scene.officeChair), hasManagerTrap: Boolean(scene.meetingButton) };
  })).toEqual({ managers: 2, hideSpots: 3, hasKeycardQuest: true, hasChairBoost: true, hasManagerTrap: true });
  await page.screenshot({ path: 'test-results/level-2-gauntlet.png' });

  await page.evaluate(() => window.__salaryChase?.scene.start('LunchScene'));
  await waitForScene(page, 'LunchScene');
  expect(await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('LunchScene') as unknown as { walls: unknown[]; plates: unknown[]; shortcutButton: unknown; intern: unknown; goldenSpoon: unknown };
    return { walls: scene.walls.length, plates: scene.plates.length, shortcut: Boolean(scene.shortcutButton), rescue: Boolean(scene.intern), secret: Boolean(scene.goldenSpoon) };
  })).toEqual({ walls: 10, plates: 4, shortcut: true, rescue: true, secret: true });
  await page.screenshot({ path: 'test-results/level-3-lunch-maze.png' });
  await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('LunchScene') as unknown as { failLunch: () => void };
    scene.failLunch();
  });
  await page.keyboard.press('e');
  await waitForScene(page, 'FightScene');

  await page.evaluate(() => window.__salaryChase?.scene.start('TeaBreakScene'));
  await waitForScene(page, 'TeaBreakScene');
  expect(await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('TeaBreakScene') as unknown as { walls: unknown[]; fuseButton: unknown; teaSage: unknown; trolley: unknown; secretCoffee: unknown };
    return { walls: scene.walls.length, fuse: Boolean(scene.fuseButton), sage: Boolean(scene.teaSage), boost: Boolean(scene.trolley), secret: Boolean(scene.secretCoffee) };
  })).toEqual({ walls: 10, fuse: true, sage: true, boost: true, secret: true });
  await page.screenshot({ path: 'test-results/level-5-tea-maze.png' });
  await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('TeaBreakScene') as unknown as { failTea: () => void };
    scene.failTea();
  });
  await page.keyboard.press('e');
  await waitForScene(page, 'HRSearchScene');
  expect(errors).toEqual([]);
});

test('pixel office escape and support-zombie attack initialize safely', async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await startGame(page, 'Pixel QA');
  await page.evaluate(() => window.__salaryChase?.scene.start('EscapeScene'));
  await waitForScene(page, 'EscapeScene');
  await page.waitForTimeout(1400);
  await page.screenshot({ path: 'test-results/escape-pixel-qa.png' });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__salaryChase?.scene.isActive('EscapeScene'))).toBe(true);
  expect(await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('EscapeScene') as unknown as { overrideSwitch: unknown; trappedIntern: unknown };
    return { override: Boolean(scene.overrideSwitch), rescue: Boolean(scene.trappedIntern) };
  })).toEqual({ override: true, rescue: true });
});

test('retro Bug Bash plays three rounds and continues to tea break after the match', async ({ page }) => {
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

  const knockOutTester = async (): Promise<void> => {
    await page.evaluate(() => {
      const scene = window.__salaryChase?.scene.getScene('FightScene') as unknown as {
        developer: { x: number };
        tester: { x: number };
        testerHealth: number;
        testerActionUntil: number;
        playerActionUntil: number;
        introLocked: boolean;
        playerAttack: (kind: 'punch' | 'kick') => void;
      };
      scene.introLocked = false;
      scene.developer.x = scene.tester.x - 100;
      scene.testerHealth = 1;
      scene.testerActionUntil = Number.MAX_SAFE_INTEGER;
      scene.playerActionUntil = 0;
      scene.playerAttack('punch');
    });
    await expect.poll(() => page.evaluate(() => {
      const scene = window.__salaryChase?.scene.getScene('FightScene') as unknown as { ended: boolean };
      return scene.ended;
    })).toBe(true);
  };

  await knockOutTester();
  await expect.poll(() => page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('FightScene') as unknown as { round: number; developerRoundWins: number };
    return `${scene.round}:${scene.developerRoundWins}`;
  })).toBe('1:1');
  await clickGame(page, 640, 475);
  await expect.poll(() => page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('FightScene') as unknown as { round: number; ended: boolean };
    return `${scene.round}:${scene.ended}`;
  })).toBe('2:false');

  await knockOutTester();
  await expect.poll(() => page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('FightScene') as unknown as { round: number; developerRoundWins: number };
    return `${scene.round}:${scene.developerRoundWins}`;
  })).toBe('2:2');
  await clickGame(page, 640, 475);
  await expect.poll(() => page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('FightScene') as unknown as { round: number; ended: boolean };
    return `${scene.round}:${scene.ended}`;
  })).toBe('3:false');

  await knockOutTester();
  const victory = await page.evaluate(() => {
    const scene = window.__salaryChase?.scene.getScene('FightScene') as unknown as {
      ended: boolean;
      testerHealth: number;
      round: number;
      developerRoundWins: number;
      testerRoundWins: number;
    };
    return {
      ended: scene.ended,
      testerHealth: scene.testerHealth,
      round: scene.round,
      score: `${scene.developerRoundWins}-${scene.testerRoundWins}`,
    };
  });
  expect(victory).toEqual({ ended: true, testerHealth: 0, round: 3, score: '3-0' });
  expect(errors).toEqual([]);
  await expect.poll(() => page.evaluate(() => {
    const items = window.__salaryChase?.scene.getScene('FightScene').children.list as Array<{ type: string; text?: string }>;
    return items.filter((item) => item.type === 'Text').map((item) => item.text ?? '');
  })).toContain('DEVELOPER WINS MATCH');
  await page.screenshot({ path: 'test-results/bug-bash-victory.png' });
  await clickGame(page, 640, 485);
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
