const { test, expect } = require('@playwright/test');

test.describe('Basic Game Functionality', () => {
  test('game should load and start button should be visible', async ({ page }) => {
    await page.goto('/');
    
    // Check if the start button is visible
    const startButton = page.locator('#startBtn');
    await expect(startButton).toBeVisible();
    await expect(startButton).toHaveText('Start Space Journey!');
  });

  test('game area should be visible', async ({ page }) => {
    await page.goto('/');
    
    // Game area should always be visible
    const gameArea = page.locator('#gameArea');
    await expect(gameArea).toBeVisible();
  });

  test('characters should exist in DOM', async ({ page }) => {
    await page.goto('/');
    
    // Characters should exist in DOM (they're in the HTML)
    const george = page.locator('#george');
    const matilda = page.locator('#matilda');
    
    await expect(george).toBeAttached();
    await expect(matilda).toBeAttached();
  });
});