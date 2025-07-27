#!/usr/bin/env python3

import asyncio
from playwright.async_api import async_playwright

async def test_cooking_movement_simple():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        page = await browser.new_page()
        
        # Listen to console messages
        def handle_console(msg):
            print(f"CONSOLE: {msg.text}")
        
        page.on("console", handle_console)
        
        # Navigate to the game
        await page.goto(f"file:///Users/lbiewald/space-jumping-game/matilda-space-game/index.html")
        
        print("🎮 Starting simplified cooking test...")
        
        # Wait for game to load
        await page.wait_for_selector("#startBtn")
        await page.wait_for_timeout(2000)
        
        # Directly set up cooking game state for testing
        print("🍳 Setting up cooking game state directly...")
        
        setup_result = await page.evaluate("""
            (() => {
                // Set up some collected vegetables for testing
                window.game.collectedVegetables = ['🥕', '🥬', '🌽', '🍅', '🥒', '🥔'];
                window.game.cookingStarted = false;
                
                // Manually trigger cooking
                try {
                    window.game.initCookingKitchen();
                    return 'Cooking kitchen initialized successfully';
                } catch (error) {
                    return 'Error: ' + error.message;
                }
            })()
        """)
        
        print(f"Setup result: {setup_result}")
        await page.wait_for_timeout(2000)
        
        # Check game state
        game_info = await page.evaluate("""
            (() => {
                return {
                    gameState: window.game.gameState,
                    gameRunning: window.game.gameRunning,
                    cookingStep: window.game.currentCookingStep,
                    hasGeorge: !!window.game.george,
                    hasMatilda: !!window.game.matilda,
                    currentPlayer: window.game.currentPlayer
                }
            })()
        """)
        
        print(f"Game info: {game_info}")
        
        # Get initial character positions
        char_positions = await page.evaluate("""
            (() => {
                const george = document.getElementById('george');
                const matilda = document.getElementById('matilda');
                return {
                    george: george ? {
                        left: george.style.left,
                        bottom: george.style.bottom,
                        visible: window.getComputedStyle(george).display !== 'none'
                    } : null,
                    matilda: matilda ? {
                        left: matilda.style.left,
                        bottom: matilda.style.bottom,
                        visible: window.getComputedStyle(matilda).display !== 'none'
                    } : null
                }
            })()
        """)
        
        print(f"Initial character positions: {char_positions}")
        
        # Test movement
        print("⬅️ Testing ArrowLeft movement...")
        await page.keyboard.press("ArrowLeft")
        await page.wait_for_timeout(500)
        
        # Get positions after movement
        char_positions_after = await page.evaluate("""
            (() => {
                const george = document.getElementById('george');
                const matilda = document.getElementById('matilda');
                return {
                    george: george ? {
                        left: george.style.left,
                        bottom: george.style.bottom
                    } : null,
                    matilda: matilda ? {
                        left: matilda.style.left,
                        bottom: matilda.style.bottom
                    } : null
                }
            })()
        """)
        
        print(f"Character positions after ArrowLeft: {char_positions_after}")
        
        # Test a few more movements
        movements = ["ArrowRight", "ArrowUp", "ArrowDown"]
        for movement in movements:
            print(f"Testing {movement}...")
            await page.keyboard.press(movement)
            await page.wait_for_timeout(300)
            
            pos = await page.evaluate(f"""
                (() => {{
                    const george = document.getElementById('george');
                    return george ? {{left: george.style.left, bottom: george.style.bottom}} : null
                }})()
            """)
            print(f"George position after {movement}: {pos}")
        
        # Test character switching
        print("Testing character switch (Space)...")
        await page.keyboard.press("Space")
        await page.wait_for_timeout(300)
        
        current_player = await page.evaluate("(() => window.game.currentPlayer)()")
        print(f"Current player after Space: {current_player}")
        
        # Test movement with switched character
        print("Testing movement with switched character...")
        await page.keyboard.press("ArrowLeft")
        await page.wait_for_timeout(300)
        
        both_positions = await page.evaluate("""
            (() => {
                const george = document.getElementById('george');
                const matilda = document.getElementById('matilda');
                return {
                    george: george ? {left: george.style.left, bottom: george.style.bottom} : null,
                    matilda: matilda ? {left: matilda.style.left, bottom: matilda.style.bottom} : null,
                    currentPlayer: window.game.currentPlayer
                }
            })()
        """)
        
        print(f"Both character positions after switch and movement: {both_positions}")
        
        print("✅ Cooking movement test complete!")
        await page.wait_for_timeout(3000)
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_cooking_movement_simple())