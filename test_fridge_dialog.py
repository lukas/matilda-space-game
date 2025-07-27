#!/usr/bin/env python3
"""
Quick test to check if dialogue triggers after walking to refrigerator
"""
import asyncio
from playwright.async_api import async_playwright
import time

async def test_fridge_dialogue():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        # Enable console logging
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        
        print("🎮 Loading game from localhost...")
        await page.goto("http://localhost:8000")
        
        await page.wait_for_timeout(2000)  # Wait for game to load
        
        print("🚀 Starting game...")
        # Click start button
        start_btn = page.locator("#startBtn")
        await start_btn.wait_for(state="visible")
        await start_btn.click()
        
        print("⏳ Waiting for space flight...")
        await page.wait_for_timeout(8000)  # Wait for space sequence
        
        # Click button to progress to moon surface
        print("🌙 Clicking button to go to moon surface...")
        await start_btn.click()
        await page.wait_for_timeout(2000)
        
        print("🚶 Moving to Moon Dog's house...")
        # Move characters to house position (650, 150) from start position (100-200, 170)
        # Need to move both characters RIGHT to reach x=650 and UP to reach y=150
        
        print("🚶 Moving RIGHT toward house...")
        for _ in range(45):  # Move far right to reach x=650 area
            await page.keyboard.press("ArrowRight")
            await page.wait_for_timeout(50)
        
        print("🚶 Moving UP toward house...")  
        for _ in range(5):   # Move slightly up to reach y=150 area
            await page.keyboard.press("ArrowUp")
            await page.wait_for_timeout(50)
        
        print("🏠 Waiting for house collision detection...")
        await page.wait_for_timeout(3000)  # Wait for house entry
        
        # Check if we're actually in the house
        game_state = await page.evaluate("window.game ? window.game.gameState : 'unknown'")
        print(f"🎮 Game state after movement: {game_state}")
        
        if game_state != 'moonDogHouse':
            print("🏠 Not in house yet, checking character positions...")
            # Check character positions
            positions = await page.evaluate("""
                const george = document.getElementById('george');
                const matilda = document.getElementById('matilda');
                const georgeLeft = parseInt(george.style.left) || 100;
                const georgeBottom = parseInt(george.style.bottom) || 170;
                const matildaLeft = parseInt(matilda.style.left) || 200;
                const matildaBottom = parseInt(matilda.style.bottom) || 170;
                return {georgeLeft, georgeBottom, matildaLeft, matildaBottom};
            """)
            print(f"📍 Character positions: {positions}")
            print("🏠 House is at (650, 150), need both within 100 pixels")
            
            # Try moving to exact position
            for _ in range(10):
                await page.keyboard.press("ArrowRight")
                await page.wait_for_timeout(100)
            await page.wait_for_timeout(3000)
        
        print("🗣️ Waiting for initial dialogue to complete...")
        await page.wait_for_timeout(10000)  # Wait for initial house dialogue
        
        print("🧊 Moving to refrigerator...")
        # Move toward refrigerator (right side of house)
        for _ in range(10):
            await page.keyboard.press("ArrowRight")
            await page.wait_for_timeout(200)
        
        for _ in range(3):
            await page.keyboard.press("ArrowDown")
            await page.wait_for_timeout(200)
        
        print("❄️ Should be near refrigerator, checking for dialogue...")
        await page.wait_for_timeout(5000)  # Wait for refrigerator dialogue
        
        # Check if dialogue box exists and has content
        dialogue_box = page.locator("#dialogue-box")
        if await dialogue_box.count() > 0:
            dialogue_text = await dialogue_box.text_content()
            print(f"📝 Dialogue text: {dialogue_text}")
        else:
            print("❌ No dialogue box found!")
        
        # Check game state
        game_state = await page.evaluate("window.game ? window.game.gameState : 'unknown'")
        print(f"🎮 Game state: {game_state}")
        
        await page.wait_for_timeout(10000)  # Wait to see what happens
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_fridge_dialogue())