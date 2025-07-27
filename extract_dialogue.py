#!/usr/bin/env python3

import re
import json
import hashlib

def extract_dialogue_from_js(file_path):
    """Extract all dialogue from the JavaScript game file."""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all speak() method calls
    speak_pattern = r"await\s+this\.speak\s*\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)"
    
    matches = re.findall(speak_pattern, content)
    
    dialogue_entries = []
    
    for text, character in matches:
        # Clean up the text
        clean_text = text.replace('\\\'', "'").replace('\\"', '"')
        
        # Create a unique ID for this dialogue
        dialogue_id = hashlib.md5(f"{clean_text}_{character}".encode()).hexdigest()[:8]
        
        dialogue_entries.append({
            "id": dialogue_id,
            "text": clean_text,
            "character": character,
            "clean_text": clean_dialogue_for_speech(clean_text)
        })
    
    return dialogue_entries

def clean_dialogue_for_speech(text):
    """Clean dialogue text for speech synthesis."""
    
    # Remove emojis but keep the text natural
    clean_text = re.sub(r'[🚀👨‍🚀👩‍🚀🐕‍🦺🧊😢💖👨‍🍳👩‍🍳🥕🥬🌽🍅🥒🥔🌙🏠🚪😋🎉🎆✨🎈❤️🌉🏙️🗽🏢🏬🏘️🏡🚋]', '', text)
    
    # Remove character names from the beginning since we're using different voices
    clean_text = re.sub(r'^(George|Matilda|Moon Dog):\s*', '', clean_text, flags=re.IGNORECASE)
    
    # Clean up any remaining artifacts
    clean_text = clean_text.strip()
    
    return clean_text

def main():
    print("🎙️ Extracting dialogue from game...")
    
    dialogue_entries = extract_dialogue_from_js('script.js')
    
    print(f"📝 Found {len(dialogue_entries)} dialogue entries")
    
    # Group by character
    characters = {}
    for entry in dialogue_entries:
        char = entry['character']
        if char not in characters:
            characters[char] = []
        characters[char].append(entry)
    
    print("\n📊 Dialogue breakdown by character:")
    for char, entries in characters.items():
        print(f"  {char}: {len(entries)} lines")
    
    # Save to JSON file
    output_data = {
        "total_entries": len(dialogue_entries),
        "characters": list(characters.keys()),
        "dialogue": dialogue_entries
    }
    
    with open('dialogue_data.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Saved dialogue data to dialogue_data.json")
    
    # Show some examples
    print("\n📜 Sample dialogue entries:")
    for i, entry in enumerate(dialogue_entries[:5]):
        print(f"  {i+1}. [{entry['character']}] {entry['clean_text'][:50]}...")
    
    return dialogue_entries

if __name__ == "__main__":
    main()