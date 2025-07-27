#!/usr/bin/env python3

import asyncio
from playwright.async_api import async_playwright
import time

async def test_cooking_movement():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        page = await browser.new_page()
        
        # Listen to console messages
        def handle_console(msg):
            print(f"CONSOLE: {msg.text}")
        
        page.on("console", handle_console)
        
        # Navigate to the game
        await page.goto(f"file:///Users/lbiewald/space-jumping-game/matilda-space-game/index.html")
        
        print("🎮 Starting game test...")
        
        # Wait for game to load
        await page.wait_for_selector("#startBtn")
        
        # Start the game (space journey)
        print("🚀 Starting space journey...")
        await page.click("#startBtn")
        
        # Wait for flight to complete (this takes time)
        print("⏳ Waiting for space flight to complete...")
        await page.wait_for_function("document.querySelector('#startBtn').textContent.includes('Walk')", timeout=30000)
        
        # Walk to Moon Dog's house
        print("🚶 Walking to Moon Dog's house...")
        await page.click("#startBtn")
        
        # Wait for house scene and move characters to house
        await page.wait_for_timeout(3000)
        
        # Move George and Matilda to the house using arrow keys
        print("🏠 Moving characters to house...")
        for _ in range(20):
            await page.keyboard.press("ArrowRight")
            await page.wait_for_timeout(100)
        
        # Wait for house entry
        await page.wait_for_timeout(3000)
        
        # Move to refrigerator in house
        print("🧊 Moving to refrigerator...")
        for _ in range(10):
            await page.keyboard.press("ArrowRight")
            await page.wait_for_timeout(100)
            
        # Wait for refrigerator interaction
        await page.wait_for_timeout(3000)
        
        # Click to go to garden
        print("🌱 Going to vegetable garden...")
        await page.click("#startBtn")
        
        # Collect vegetables (simplified - just wait and collect some)
        print("🥕 Collecting vegetables...")
        await page.wait_for_timeout(2000)
        
        # Move around to collect vegetables
        for i in range(30):
            if i % 4 == 0:
                await page.keyboard.press("ArrowLeft")
            elif i % 4 == 1:
                await page.keyboard.press("ArrowRight")
            elif i % 4 == 2:
                await page.keyboard.press("ArrowUp")
            else:
                await page.keyboard.press("ArrowDown")
            await page.wait_for_timeout(200)
        
        # Wait for return to house option
        print("⏳ Waiting for return to house option...")
        try:
            await page.wait_for_function("document.querySelector('#startBtn').textContent.includes('Return')", timeout=10000)
            print("🏡 Returning to house with vegetables...")
            await page.click("#startBtn")
        except:
            print("❌ Didn't collect enough vegetables, continuing anyway...")
        
        # Wait for cooking to start
        await page.wait_for_timeout(3000)
        
        # Move to refrigerator to start cooking
        print("🍳 Moving to refrigerator to start cooking...")
        for _ in range(5):
            await page.keyboard.press("ArrowRight")
            await page.wait_for_timeout(200)
        
        # Now test if we can move in cooking mode
        print("🎯 Testing character movement in cooking mode...")
        await page.wait_for_timeout(2000)
        
        # Get character positions before movement
        george_before = await page.evaluate("""
            const george = document.getElementById('george');
            george ? {left: george.style.left, bottom: george.style.bottom} : null
        """)
        
        print(f"George position before movement: {george_before}")
        
        # Try to move George
        print("⬅️ Pressing ArrowLeft...")
        await page.keyboard.press("ArrowLeft")
        await page.wait_for_timeout(500)
        
        # Get character positions after movement
        george_after = await page.evaluate("""
            const george = document.getElementById('george');
            george ? {left: george.style.left, bottom: george.style.bottom} : null
        """)
        
        print(f"George position after ArrowLeft: {george_after}")
        
        # Test more movements
        print("➡️ Pressing ArrowRight...")
        await page.keyboard.press("ArrowRight")
        await page.wait_for_timeout(500)
        
        george_after2 = await page.evaluate("""
            const george = document.getElementById('george');
            george ? {left: george.style.left, bottom: george.style.bottom} : null
        """)
        
        print(f"George position after ArrowRight: {george_after2}")
        
        # Check game state
        game_state = await page.evaluate("window.game ? window.game.gameState : 'no game object'")
        game_running = await page.evaluate("window.game ? window.game.gameRunning : 'no game object'")
        
        print(f"Game state: {game_state}")
        print(f"Game running: {game_running}")
        
        # Check if we have character references
        char_refs = await page.evaluate("""
            if (window.game) {
                return {
                    george: !!window.game.george,
                    matilda: !!window.game.matilda,
                    currentPlayer: window.game.currentPlayer
                }
            }
            return 'no game object'
        """)
        
        print(f"Character references: {char_refs}")
        
        # Keep browser open to see final state
        print("✅ Test complete. Check console output above for issues.")
        await page.wait_for_timeout(5000)
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_cooking_movement())