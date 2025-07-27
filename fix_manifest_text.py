#!/usr/bin/env python3
"""
Fix the manifest clean_text entries to remove character names without regenerating audio
"""
import json
import re

def clean_text_for_speech(text):
    """Clean text for speech synthesis - remove ALL character prefixes"""
    # Remove emojis first
    emoji_pattern = r'[🚀👨‍🚀👩‍🚀🐕‍🦺🧊😢💖👨‍🍳👩‍🍳🥕🥬🌽🍅🥒🥔🌙🏠🚪😋🎉🎆✨🎈❤️🌉🏙️🗽🏢🏬🏘️🏡🚋🤵👰🌅]'
    text = re.sub(emoji_pattern, '', text)
    
    # Remove ALL character prefixes - be more aggressive
    text = re.sub(r'^(George|Matilda|Moon\s*Dog|Narrator):\s*', '', text, flags=re.IGNORECASE)
    
    # Double-check for any remaining character names at the start
    text = re.sub(r'^(George|Matilda|Moon\s*Dog|Narrator)\s*[:\-]\s*', '', text, flags=re.IGNORECASE)
    
    return text.strip()

def main():
    # Load existing manifest
    with open('audio/manifest.json', 'r') as f:
        manifest = json.load(f)
    
    # Find and fix files that still have character names in clean_text
    fixed_count = 0
    
    for file_entry in manifest['files']:
        clean_text = file_entry['clean_text']
        
        # Check if clean_text starts with character name
        if re.match(r'^(George|Matilda|Moon Dog|Narrator):\s*', clean_text, re.IGNORECASE):
            # Clean the text
            new_clean_text = clean_text_for_speech(clean_text)
            
            print(f"Fixing: {file_entry['filename']}")
            print(f"  Old: {clean_text}")
            print(f"  New: {new_clean_text}")
            
            file_entry['clean_text'] = new_clean_text
            fixed_count += 1
    
    print(f"\n✅ Fixed {fixed_count} clean_text entries")
    
    # Update manifest timestamp
    import time
    manifest['generated_at'] = time.strftime('%Y-%m-%d %H:%M:%S')
    
    # Save updated manifest
    with open('audio/manifest.json', 'w') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"📄 Updated manifest.json")
    print(f"📊 Total audio files: {manifest['total_files']}")
    print(f"\nNote: The audio files themselves still contain character names.")
    print(f"To fully fix this, the ElevenLabs API would need to regenerate 37 files.")

if __name__ == '__main__':
    main()