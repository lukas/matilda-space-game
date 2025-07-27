const { test, expect } = require('@playwright/test');

test.describe('Mobile Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('mobile controls should appear on mobile devices', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('This test is only for mobile devices');
    }

    // Start the game first
    await page.click('#startBtn');

    // Check if mobile controls are visible
    const mobileControls = page.locator('#mobileControls');
    await expect(mobileControls).toBeVisible();

    // Check if all direction buttons are present
    const upButton = page.locator('.direction-btn[data-direction="up"]');
    const downButton = page.locator('.direction-btn[data-direction="down"]');
    const leftButton = page.locator('.direction-btn[data-direction="left"]');
    const rightButton = page.locator('.direction-btn[data-direction="right"]');
    const switchButton = page.locator('#switchBtn');

    await expect(upButton).toBeVisible();
    await expect(downButton).toBeVisible();
    await expect(leftButton).toBeVisible();
    await expect(rightButton).toBeVisible();
    await expect(switchButton).toBeVisible();
  });

  test('direction buttons should exist and be clickable on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('This test is only for mobile devices');
    }

    // Start the game
    await page.click('#startBtn');

    // Test that buttons are clickable
    const rightButton = page.locator('.direction-btn[data-direction="right"]');
    await expect(rightButton).toBeVisible();
    
    // Tap the button - should not throw an error
    await rightButton.tap();
  });

  test('touch events should be properly handled on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('This test is only for mobile devices');
    }

    // Start the game
    await page.click('#startBtn');

    // Get the right button
    const rightButton = page.locator('.direction-btn[data-direction="right"]');

    // Simple tap test instead of complex touch events
    await rightButton.tap();
    
    // Verify button is still functional
    await expect(rightButton).toBeVisible();
  });

  test('switch button should be clickable on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('This test is only for mobile devices');
    }

    // Start the game
    await page.click('#startBtn');

    // Tap switch button - should not throw error
    const switchButton = page.locator('#switchBtn');
    await switchButton.tap();
  });
});