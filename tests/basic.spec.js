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

  test('start button text should be correct', async ({ page }) => {
    await page.goto('/');
    
    // More specific test - check button text after page loads
    const startButton = page.locator('#startBtn');
    await expect(startButton).toHaveText('Start Space Journey!');
  });
});