from playwright.sync_api import sync_playwright
import time

def test_mobile_audio():
    with sync_playwright() as p:
        # Launch browser in mobile mode
        browser = p.chromium.launch(headless=False, devtools=True)
        context = browser.new_context(
            viewport={'width': 393, 'height': 852},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        )
        
        page = context.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'Console: {msg.text}'))
        
        try:
            # Navigate to localhost or file
            page.goto('file:///Users/lbiewald/space-jumping-game/matilda-space-game/index.html')
            
            # Wait for page load
            time.sleep(3)
            
            # Check if mobile audio system is detected
            is_mobile = page.evaluate('window.MobileAudioSystem && new window.MobileAudioSystem().isMobile')
            print(f'Mobile detected: {is_mobile}')
            
            # Check if audio files are accessible
            audio_result = page.evaluate('''
                async function checkAudio() {
                    try {
                        const response = await fetch('./audio/manifest.json');
                        const data = await response.json();
                        console.log('Manifest loaded:', data.total_files, 'files');
                        return data.total_files;
                    } catch (e) {
                        console.error('Manifest load failed:', e);
                        return 0;
                    }
                }
                checkAudio();
            ''')
            
            time.sleep(2)
            
            # Try to start the game and trigger first speech
            page.click('.game-area')  # Click to start
            time.sleep(1)
            
            # Check game state
            game_state = page.evaluate('window.game ? window.game.gameState : "no game"')
            print(f'Game state: {game_state}')
            
            time.sleep(5)
            
        except Exception as e:
            print(f'Error: {e}')
        finally:
            browser.close()

if __name__ == '__main__':
    test_mobile_audio()