#!/usr/bin/env python3

import asyncio
from playwright.async_api import async_playwright

async def test_mobile_positioning():
    async with async_playwright() as p:
        # Launch browser with iPhone viewport
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        
        # Create iPhone 14 context (393x852)
        context = await browser.new_context(
            viewport={'width': 393, 'height': 852},
            device_scale_factor=3,
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        )
        
        page = await context.new_page()
        
        print("🔧 Testing mobile positioning on iPhone 14 viewport (393x852)...")
        
        # Navigate to the test page first
        await page.goto('file:///Users/lbiewald/space-jumping-game/matilda-space-game/mobile-test.html')
        
        # Wait for page to load and debug info to update
        await page.wait_for_timeout(2000)
        
        # Get debug information
        debug_info = await page.evaluate("""
            () => {
                const gameArea = document.getElementById('gameArea');
                const rect = gameArea.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(gameArea);
                
                return {
                    viewport: { width: window.innerWidth, height: window.innerHeight },
                    gameArea: {
                        left: Math.round(rect.left),
                        top: Math.round(rect.top),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        right: Math.round(rect.right)
                    },
                    transform: computedStyle.transform,
                    isOffScreen: rect.left < 0 || rect.right > window.innerWidth,
                    centering: {
                        expectedLeft: Math.round((window.innerWidth - rect.width) / 2),
                        actualLeft: Math.round(rect.left),
                        offset: Math.round(rect.left - (window.innerWidth - rect.width) / 2)
                    }
                }
            }
        """)
        
        print(f"📱 Viewport: {debug_info['viewport']['width']}x{debug_info['viewport']['height']}")
        print(f"🎮 Game Area Position: {debug_info['gameArea']['left']}, {debug_info['gameArea']['top']}")
        print(f"📏 Game Area Size: {debug_info['gameArea']['width']}x{debug_info['gameArea']['height']}")
        print(f"🔄 Transform: {debug_info['transform']}")
        print(f"❌ Off-screen: {debug_info['isOffScreen']}")
        print(f"📐 Expected left position: {debug_info['centering']['expectedLeft']}")
        print(f"📐 Actual left position: {debug_info['centering']['actualLeft']}")
        print(f"📐 Centering offset: {debug_info['centering']['offset']}px")
        
        if debug_info['isOffScreen']:
            print("🚨 PROBLEM: Game area is off-screen!")
        else:            
            print("✅ Game area is on-screen")
            
        if abs(debug_info['centering']['offset']) > 10:
            print(f"🚨 PROBLEM: Game area is not centered (off by {debug_info['centering']['offset']}px)")
        else:
            print("✅ Game area is properly centered")
        
        # Now test the actual game page
        print("\n🎮 Testing actual game page...")
        await page.goto('file:///Users/lbiewald/space-jumping-game/matilda-space-game/index.html')
        await page.wait_for_timeout(2000)
        
        # Get game positioning
        game_info = await page.evaluate("""
            () => {
                const gameArea = document.getElementById('gameArea');
                const rect = gameArea.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(gameArea);
                
                return {
                    gameArea: {
                        left: Math.round(rect.left),
                        top: Math.round(rect.top),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        right: Math.round(rect.right)
                    },
                    transform: computedStyle.transform,
                    isOffScreen: rect.left < 0 || rect.right > window.innerWidth,
                    centering: {
                        expectedLeft: Math.round((window.innerWidth - rect.width) / 2),
                        actualLeft: Math.round(rect.left),
                        offset: Math.round(rect.left - (window.innerWidth - rect.width) / 2)
                    }
                }
            }
        """)
        
        print(f"🎮 Game Area Position: {game_info['gameArea']['left']}, {game_info['gameArea']['top']}")
        print(f"📏 Game Area Size: {game_info['gameArea']['width']}x{game_info['gameArea']['height']}")
        print(f"🔄 Transform: {game_info['transform']}")
        print(f"❌ Off-screen: {game_info['isOffScreen']}")
        print(f"📐 Centering offset: {game_info['centering']['offset']}px")
        
        if game_info['isOffScreen']:
            print("🚨 MAIN GAME: Game area is off-screen!")
        else:            
            print("✅ MAIN GAME: Game area is on-screen")
            
        if abs(game_info['centering']['offset']) > 10:
            print(f"🚨 MAIN GAME: Game area is not centered (off by {game_info['centering']['offset']}px)")
            
            # Calculate correct scale
            viewport_width = debug_info['viewport']['width']
            original_width = 800
            recommended_scale = (viewport_width * 0.9) / original_width
            
            print(f"\n💡 SOLUTION:")
            print(f"   Current viewport: {viewport_width}px")
            print(f"   Recommended scale: {recommended_scale:.3f}")
            print(f"   Expected width after scale: {original_width * recommended_scale:.0f}px")
            print(f"   Expected left position: {(viewport_width - (original_width * recommended_scale)) / 2:.0f}px")
        else:
            print("✅ MAIN GAME: Game area is properly centered")
        
        print("\n⏳ Keeping browser open for 5 seconds...")
        await page.wait_for_timeout(5000)
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_mobile_positioning())