#!/usr/bin/env python3
"""
Fix the clean_text entries to properly remove character names
The current cleaning function isn't working correctly
"""
import json
import re

def clean_text_for_speech_fixed(text):
    """Clean text for speech synthesis - remove ALL character prefixes properly"""
    # Remove emojis first
    emoji_pattern = r'[🚀👨‍🚀👩‍🚀🐕‍🦺🧊😢💖👨‍🍳👩‍🍳🥕🥬🌽🍅🥒🥔🌙🏠🚪😋🎉🎆✨🎈❤️🌉🏙️🗽🏢🏬🏘️🏡🚋🤵👰🌅]'
    text = re.sub(emoji_pattern, '', text)
    
    # Remove character prefixes - be more aggressive and specific
    # Handle "George:", "Matilda:", "Moon Dog:", "Narrator:"
    text = re.sub(r'^George:\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'^Matilda:\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'^Moon\s*Dog:\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'^Narrator:\s*', '', text, flags=re.IGNORECASE)
    
    # Double-check for any remaining patterns
    text = re.sub(r'^(George|Matilda|Moon\s*Dog|Narrator)\s*[:]\s*', '', text, flags=re.IGNORECASE)
    
    return text.strip()

def main():
    # Load existing manifest
    with open('audio/manifest.json', 'r') as f:
        manifest = json.load(f)
    
    # Find and fix ALL files that have character names in clean_text
    fixed_count = 0
    
    for file_entry in manifest['files']:
        old_clean_text = file_entry['clean_text']
        
        # Apply the fixed cleaning function
        new_clean_text = clean_text_for_speech_fixed(old_clean_text)
        
        # Check if there was actually a change
        if old_clean_text != new_clean_text:
            print(f"Fixing: {file_entry['filename']}")
            print(f"  Old: {old_clean_text}")
            print(f"  New: {new_clean_text}")
            print()
            
            file_entry['clean_text'] = new_clean_text
            fixed_count += 1
    
    print(f"✅ Fixed {fixed_count} clean_text entries")
    
    # Update manifest timestamp
    import time
    manifest['generated_at'] = time.strftime('%Y-%m-%d %H:%M:%S')
    
    # Save updated manifest
    with open('audio/manifest.json', 'w') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"📄 Updated manifest.json")
    print(f"📊 Total audio files: {manifest['total_files']}")
    
    # Show some examples of what should now be clean
    print(f"\n📝 Sample clean text entries:")
    for i, file_entry in enumerate(manifest['files'][:10]):
        if file_entry['character'] in ['george', 'matilda', 'moondog']:
            print(f"  {file_entry['character']}: {file_entry['clean_text']}")

if __name__ == '__main__':
    main()