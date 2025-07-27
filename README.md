# 🚀 Try to Pick Vegetables - George and Matilda's Moon Adventure

An interactive space adventure game where George and Matilda travel to the moon, meet Moon Dog, and embark on a 3-day adventure filled with cooking, games, and friendship!

## 🎮 How to Play

1. **Start the Adventure**: Click "Start Game" to begin the space journey
2. **Space Flight**: Watch as George and Matilda pilot their spaceship to the moon
3. **Meet Moon Dog**: Walk to Moon Dog's house and meet your new furry friend
4. **Collect Vegetables**: Explore the moon's vegetable garden and collect 6 vegetables
5. **Interactive Cooking**: Return to the house and cook dinner together by:
   - Washing vegetables at the sink (🛁)
   - Chopping vegetables on the cutting board (🔪)
   - Plating the food (🍽️)
   - Eating together at the table
6. **3-Day Adventure**: Spend 3 amazing days with Moon Dog choosing from activities like:
   - 🥕 Pick more vegetables in the garden
   - 🍳 Cook breakfast together
   - 🛝 Play games at the playground
   - 🍽️ Make dinner
   - 🍽️ Visit fancy restaurants (days 2 & 3)
   - 🧊 Stock the refrigerator
7. **Return Journey**: After 3 days, return to Earth with emotional goodbyes
8. **Home Sweet Home**: George gets dropped off in New York City, Matilda continues to San Francisco

## 🎯 Game Features

- **Character Control**: Use arrow keys to move characters, spacebar to switch between George and Matilda
- **Interactive Dialogue**: Characters speak using text-to-speech (can be muted)
- **Multiple Game Phases**: Space flight, moon exploration, cooking mini-game, activity selection, and return journey
- **Progress Tracking**: Complete all 4 daily activities to advance each day
- **Beautiful Scenes**: Detailed visual environments for the moon, NYC, and San Francisco

## 🎨 Visual Elements

- **Moon Surface**: Detailed lunar landscape with craters and Moon Dog's house
- **Vegetable Garden**: Interactive vegetables that float and animate when collected
- **Kitchen Scenes**: Fully interactive cooking stations with realistic workflow
- **Space Scenes**: Animated spaceship with stars, planets, and asteroids
- **Earth Cities**: Iconic landmarks like Statue of Liberty and Golden Gate Bridge

## 🎵 Audio

- **ElevenLabs AI voices** for realistic character dialogue (120+ audio files)
- **Character-specific voices**: George (Josh), Matilda (Jessica), Moon Dog (Brian), Narrator (Adam)
- **Clean dialogue**: Automatic emoji and character name removal from spoken text
- **Fallback system**: Browser text-to-speech if audio files aren't available
- **Mute controls**: Audio can be toggled on/off

## 🛠️ Technical Details

- **Frontend**: Pure HTML5, CSS3, and JavaScript (ES6+)
- **No external dependencies** - runs entirely in browser
- **Cross-platform**: Desktop and mobile browsers supported
- **Mobile controls**: Touch-based directional pad for smartphones
- **Audio system**: Dual system supporting both AI-generated and browser TTS
- **File structure**: `script.js` (3000+ lines), `audio-system.js`, `style.css`
- **Testing**: Playwright test suite with <3 second execution time
- **Performance**: CSS animations and async/await for smooth 60fps gameplay

## 🎪 Game Flow

1. **Space Flight** → 2. **Moon Landing** → 3. **Meet Moon Dog** → 4. **Vegetable Collection** → 5. **Interactive Cooking** → 6. **3-Day Adventure** → 7. **Return to Earth** → 8. **The End**

Each phase includes multiple interactive elements, character dialogue, and beautiful visual animations to create an engaging adventure experience!

## 🚀 Getting Started

### For Players
Simply open `index.html` in any modern web browser and click "Start Space Journey!" to begin your moon adventure!

### For Developers  
```bash
# Run tests (must complete in <3 seconds)
npm test

# Run specific test file
npm test tests/basic.spec.js

# Syntax check
node -c script.js

# Start local server for development
python3 -m http.server 3000
```

### For LLMs/AI Assistants
- See `CLAUDE.md` for development guidelines and testing requirements
- See `llms.txt` for codebase structure and architecture overview
- Audio files are in `audio/` with manifest at `audio/manifest.json` 
- Critical files: `script.js` (main game), `audio-system.js` (audio handling), `tests/` (test suite)