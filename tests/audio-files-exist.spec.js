const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Helper function to clean text for speech (matches audio-system.js)
function cleanTextForSpeech(text) {
    // Remove emojis first
    const emojiPattern = /[🚀👨‍🚀👩‍🚀🐕‍🦺🧊😢💖👨‍🍳👩‍🍳🥕🥬🌽🍅🥒🥔🌙🏠🚪😋🎉🎆✨🎈❤️🌉🏙️🗽🏢🏬🏘️🏡🚋🤵👰🌅]/g;
    let cleanText = text.replace(emojiPattern, '');
    
    // Trim whitespace first
    cleanText = cleanText.trim();
    
    // Remove character prefixes
    cleanText = cleanText.replace(/^George:\s*/i, '');
    cleanText = cleanText.replace(/^Matilda:\s*/i, '');
    cleanText = cleanText.replace(/^Moon\s*Dog:\s*/i, '');
    cleanText = cleanText.replace(/^Narrator:\s*/i, '');
    
    return cleanText.trim();
}

// Helper function to generate file ID (matches audio generation logic)
function generateFileId(text, character) {
    const combined = `${character}_${text}`;
    return crypto.createHash('md5').update(combined).digest('hex').slice(0, 8);
}

test('all required audio files exist in manifest', async () => {
    // Load manifest
    const manifestPath = path.join(__dirname, '..', 'audio', 'manifest.json');
    expect(fs.existsSync(manifestPath), 'Audio manifest should exist').toBe(true);
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.files).toBeDefined();
    expect(Array.isArray(manifest.files)).toBe(true);
    
    // Create lookup map by clean text and character
    const existingFiles = new Map();
    manifest.files.forEach(file => {
        const key = `${file.character}:${file.clean_text}`;
        existingFiles.set(key, file);
    });
    
    // Define key dialogue texts that must exist (simplified list)
    const requiredAudio = [
        { text: "We have landed on the moon! Now let's walk to Moon Dog's house!", character: 'narrator' },
        { text: "Oh no! The refrigerator is completely empty!", character: 'narrator' },
        { text: "I'm so sorry! I haven't been to the garden in days...", character: 'moondog' },
        { text: "Don't worry! Let's go to your vegetable garden and pick some fresh food!", character: 'matilda' },
    ];
    
    const missingFiles = [];
    const foundFiles = [];
    
    // Check each required audio file by clean text
    for (const audio of requiredAudio) {
        const cleanText = cleanTextForSpeech(audio.text);
        const key = `${audio.character}:${cleanText}`;
        
        if (existingFiles.has(key)) {
            foundFiles.push({
                character: audio.character,
                cleanText: cleanText,
                filename: existingFiles.get(key).filename
            });
        } else {
            missingFiles.push({
                character: audio.character,
                cleanText: cleanText,
                expectedText: audio.text
            });
        }
    }
    
    // Report results
    console.log(`\n📊 Audio File Analysis:`);
    console.log(`✅ Found: ${foundFiles.length}/${requiredAudio.length} critical files`);
    console.log(`📄 Total in manifest: ${manifest.files.length} files`);
    
    if (missingFiles.length > 0) {
        console.log('\n❌ Missing critical audio files:');
        missingFiles.forEach(file => {
            console.log(`  - ${file.character}: "${file.cleanText}"`);
        });
    }
    
    // Just verify we have a reasonable number of audio files
    expect(manifest.files.length).toBeGreaterThan(100);
    expect(missingFiles.length).toBe(0);
});

test('all manifest audio files physically exist', async () => {
    // Load manifest
    const manifestPath = path.join(__dirname, '..', 'audio', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    const audioDir = path.join(__dirname, '..', 'audio');
    const missingPhysicalFiles = [];
    
    // Check each file in manifest physically exists
    for (const file of manifest.files) {
        const filePath = path.join(audioDir, file.filename);
        if (!fs.existsSync(filePath)) {
            missingPhysicalFiles.push(file.filename);
        }
    }
    
    if (missingPhysicalFiles.length > 0) {
        console.log('\n❌ Files in manifest but missing from disk:');
        missingPhysicalFiles.forEach(filename => {
            console.log(`  - ${filename}`);
        });
    }
    
    expect(missingPhysicalFiles.length).toBe(0);
});