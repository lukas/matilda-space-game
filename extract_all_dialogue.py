#!/usr/bin/env python3
"""
Complete Dialogue Extractor for Moon Adventure Game
Extracts ALL dialogue from script.js including current version
"""
import re
import json
import hashlib
from collections import defaultdict

def generate_dialogue_id(text, character):
    """Generate unique ID for dialogue"""
    combined = f"{text}_{character}"
    return hashlib.md5(combined.encode()).hexdigest()[:8]

def clean_text_for_speech(text):
    """Clean text for speech synthesis (remove emojis, etc.)"""
    # Remove emoji characters
    emoji_pattern = r'[🚀👨‍🚀👩‍🚀🐕‍🦺🧊😢💖👨‍🍳👩‍🍳🥕🥬🌽🍅🥒🥔🌙🏠🚪😋🎉🎆✨🎈❤️🌉🏙️🗽🏢🏬🏘️🏡🚋🤵👰]'
    text = re.sub(emoji_pattern, '', text)
    
    # Remove character prefixes
    text = re.sub(r'^(George|Matilda|Moon Dog):\s*', '', text, flags=re.IGNORECASE)
    
    return text.strip()

def extract_dialogue_from_file(filename):
    """Extract all dialogue from the game file"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    dialogue_entries = []
    
    # Pattern 1: this.speak('text', 'character')
    pattern1 = r"this\.speak\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)"
    matches1 = re.findall(pattern1, content)
    
    # Pattern 2: this.speak('text') with default narrator
    pattern2 = r"this\.speak\(\s*['\"]([^'\"]+)['\"]\s*\)"
    matches2 = re.findall(pattern2, content)
    
    # Pattern 3: await this.speak('text', 'character')
    pattern3 = r"await\s+this\.speak\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)"
    matches3 = re.findall(pattern3, content)
    
    # Pattern 4: await this.speak('text') with default narrator
    pattern4 = r"await\s+this\.speak\(\s*['\"]([^'\"]+)['\"]\s*\)"
    matches4 = re.findall(pattern4, content)
    
    # Collect all matches
    all_matches = []
    
    # Add pattern 1 & 3 matches (with character)
    for text, character in matches1 + matches3:
        # Unescape quotes
        text = text.replace("\\'", "'").replace('\\"', '"')
        all_matches.append((text, character))
    
    # Add pattern 2 & 4 matches (default narrator)
    for text in matches2 + matches4:
        # Skip if this was already caught by patterns 1&3
        if text not in [m[0] for m in all_matches]:
            text = text.replace("\\'", "'").replace('\\"', '"')
            all_matches.append((text, 'narrator'))
    
    # Create dialogue entries
    seen_combinations = set()
    
    for text, character in all_matches:
        # Skip duplicates
        combo = (text, character)
        if combo in seen_combinations:
            continue
        seen_combinations.add(combo)
        
        # Clean text
        clean_text = clean_text_for_speech(text)
        if not clean_text:
            continue
            
        dialogue_id = generate_dialogue_id(text, character)
        
        entry = {
            'id': dialogue_id,
            'character': character,
            'text': text,
            'clean_text': clean_text
        }
        
        dialogue_entries.append(entry)
    
    return dialogue_entries

def main():
    print("🎭 Extracting ALL dialogue from current game...")
    
    # Extract dialogue
    dialogue_entries = extract_dialogue_from_file('script.js')
    
    # Group by character
    by_character = defaultdict(list)
    for entry in dialogue_entries:
        by_character[entry['character']].append(entry)
    
    # Print summary
    print(f"\n📊 Found {len(dialogue_entries)} total dialogue entries:")
    for character, entries in by_character.items():
        print(f"  • {character}: {len(entries)} entries")
    
    # Save to file
    output_data = {
        'total_entries': len(dialogue_entries),
        'by_character': {char: len(entries) for char, entries in by_character.items()},
        'entries': dialogue_entries
    }
    
    with open('complete_dialogue_data.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Saved complete dialogue to complete_dialogue_data.json")
    
    # Show first few entries for verification
    print(f"\n🔍 First 5 entries:")
    for i, entry in enumerate(dialogue_entries[:5]):
        print(f"  {i+1}. [{entry['character']}] {entry['text'][:50]}...")

if __name__ == '__main__':
    main()