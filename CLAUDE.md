# Claude Code Agent Instructions

## Project Overview
This is a web-based interactive game called "Try to Pick Vegetables - George and Matilda's Moon Adventure". It's built with pure HTML5, CSS3, and JavaScript (ES6+) with no external dependencies.

## Testing Requirements
� **CRITICAL**: All tests must complete in under 3 seconds to ensure rapid development cycles.

## Available Test Commands
- **Syntax Check**: `node -c script.js` (< 0.1s)
- **Manual Browser Test**: `open index.html` (< 1s to launch)

## Test Strategy for Speed
1. **Use Playwright with minimal waits**: Maximum 1000ms timeout for any single operation
2. **Skip full game playthrough**: Use JavaScript evaluation to set game state directly
3. **Test specific functions**: Focus on critical game state transitions
4. **Disable animations**: Set `slow_mo=0` in Playwright
5. **Use headless mode**: Set `headless=True` for faster execution

## Quick Test Templates

### Syntax Validation (< 0.1s)
```bash
node -c script.js
```

### Game State Test (< 2s)
```python
# Set game state directly via JavaScript evaluation
page.evaluate("window.game.gameState = 'cookingGame'; window.game.currentCookingStep = 'washing'")
```

### Character Movement Test (< 1s)
```python
# Test movement without full game initialization
page.evaluate("window.game.moveCharacter('george', 'left', 10)")
```

## Performance Guidelines
- **NO full game playthroughs** in automated tests
- **NO waiting for animations** to complete naturally
- **USE direct state manipulation** via JavaScript evaluation
- **SKIP speech synthesis** in tests (set muted=true)
- **AVOID setTimeout/setInterval** dependencies in tests

## Critical Game Components to Test
1. **Game State Management**: Verify state transitions work
2. **Character Movement**: Test arrow key handling and collision detection
3. **Cooking Game Logic**: Test station interactions and progress tracking
4. **Activity Selection**: Test 3-day adventure choice system
5. **Return Journey**: Test final sequence triggers correctly

## File Structure
- `index.html` - Main game HTML (minimal changes needed)
- `script.js` - All game logic (3000+ lines, main focus for testing)
- `style.css` - Game styling and animations
- `README.md` - Human documentation
- `CLAUDE.md` - This file (agent instructions)
- `llms.txt` - Codebase overview for LLMs

## Code Quality Standards
- **Always run syntax check** before committing changes
- **Maintain ES6+ compatibility** (async/await, classes, arrow functions)
- **Keep functions pure** where possible for easier testing
- **Use semantic variable names** for debugging

## Debugging Tips
- Game state is tracked in `window.game.gameState`
- Character positions stored in `window.game.george` and `window.game.matilda`
- All major game phases have corresponding methods in the `MoonVegetableGame` class
- Text-to-speech can be disabled via `window.game.muted = true`

## Development Workflow
1. Make code changes
2. Run `node -c script.js` (< 0.1s)
3. Test specific functionality with targeted Playwright scripts (< 2s)
4. Manual verification with `open index.html` if needed
5. Total development cycle: < 3s per iteration

� **Remember**: If any test takes longer than 3 seconds, refactor it to use direct state manipulation instead of full game simulation.

## Updated Testing Guidelines (2025)

### Strict Performance Requirements
- **Global test timeout**: 3000ms (enforced in playwright.config.js)
- **Action timeout**: 1000ms (clicks, taps, etc.)
- **Navigation timeout**: 2000ms (page loads)

### FORBIDDEN Test Patterns ❌
- `await page.waitForTimeout(X)` where X > 100ms
- `{ timeout: X }` where X > 1000ms
- Testing character movement positions/distances
- Testing game state transitions (cooking steps, day progression)
- Testing audio playback or speech synthesis
- Full game playthroughs or complex user journeys
- Animation completion testing

### ALLOWED Test Patterns ✅
- `await expect(element).toBeVisible()` - DOM element visibility
- `await expect(element).toBeAttached()` - DOM element existence
- `await button.click()` - Event handlers fire without errors
- `await element.tap()` - Touch event handlers work
- Testing CSS classes are applied/removed
- Testing DOM structure and element attributes
- Basic syntax validation with `node -c script.js`

### Mobile Testing Focus
Test that mobile controls:
1. Appear on mobile devices (DOM visibility)
2. Respond to touch events without errors
3. Have proper CSS touch properties applied
4. Don't throw JavaScript errors when tapped

**Do NOT test**: Character movement, continuous movement timing, visual feedback animations, or complex game logic.

## Lessons Learned for Faster Development

### Audio System Debugging (Critical)
**Problem**: Audio files missing or not playing due to text cleaning issues
**Fast Solution**:
1. Always check `audio/manifest.json` first - grep for actual text strings
2. Test text cleaning logic immediately: `console.log(cleanTextForSpeech(originalText))`
3. Use simplified audio test checking 4-5 critical files instead of full game audio
4. When adding audio files, verify clean_text in manifest matches expected hash generation

### Test Performance Issues  
**Problem**: Tests taking 17+ seconds instead of required 3 seconds
**Root Causes**:
- Playwright default timeout (5000ms) > global timeout (3000ms) 
- Complex mobile touch event testing with dispatchEvent()
- Testing elements that don't exist at page load (created by JavaScript)

**Fast Solutions**:
- Always specify `{ timeout: 1000 }` for DOM expectations
- Use simple `.tap()` instead of complex touch event simulation
- Check HTML source vs JavaScript-generated content before writing tests
- Test button text expectations against actual runtime values, not HTML static values

### Character Name Regression Pattern
**Problem**: Character names reappearing in audio after fixes
**Fast Debug**: 
1. Check `audio-system.js` cleanTextForSpeech() - must trim() BEFORE regex replacement
2. Test single problematic string: `cleanTextForSpeech("🐕‍🦺 Moon Dog: Hello")`
3. Always verify emoji removal happens before character name removal

### Testing Strategy That Actually Works
- **Structure tests**: DOM visibility, element existence, click handlers
- **NOT game logic**: movement, state transitions, animations, audio playback  
- **Mobile tests**: Simple taps, not complex touch coordinates
- **Audio tests**: Manifest validation, not playback testing

### Documentation Update Patterns
When code structure changes:
1. Update `llms.txt` with new file purposes and relationships
2. Update `README.md` with user-facing changes
3. Update `CLAUDE.md` with development lessons immediately after major debugging sessions
4. Commit documentation changes separately for cleaner git history

### Git Workflow Efficiency  
- Run tests BEFORE committing (saves push/revert cycles)
- Use descriptive commit messages mentioning specific issues fixed
- Include co-author attribution for AI-assisted work
- Push only after ALL tests pass to avoid broken main branch
