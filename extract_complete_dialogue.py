#!/usr/bin/env python3
"""
Complete Dialogue Extractor - finds ALL speak calls including dynamic ones
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

def extract_all_speak_calls(filename):
    """Extract ALL speak calls from the game file"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    dialogue_entries = []
    found_texts = set()
    
    # Find all lines with .speak(
    speak_lines = []
    for i, line in enumerate(content.split('\n')):
        if '.speak(' in line and 'this.speak(' in line:
            speak_lines.append((i+1, line.strip()))
    
    print(f"Found {len(speak_lines)} lines with .speak() calls")
    
    # Process each speak line
    for line_num, line in speak_lines:
        print(f"\nLine {line_num}: {line}")
        
        # Try to extract static strings
        # Pattern: this.speak('static text', 'character')
        pattern1 = r"this\.speak\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)"
        match1 = re.search(pattern1, line)
        
        if match1:
            text, character = match1.groups()
            text = text.replace("\\'", "'").replace('\\"', '"')
            print(f"  -> Static: [{character}] {text}")
            
            if text not in found_texts:
                found_texts.add(text)
                dialogue_entries.append({
                    'id': generate_dialogue_id(text, character),
                    'character': character,
                    'text': text,
                    'clean_text': clean_text_for_speech(text),
                    'line_number': line_num,
                    'type': 'static'
                })
            continue
        
        # Pattern: this.speak('static text') - default narrator
        pattern2 = r"this\.speak\(\s*['\"]([^'\"]+)['\"]\s*\)"
        match2 = re.search(pattern2, line)
        
        if match2:
            text = match2.group(1)
            text = text.replace("\\'", "'").replace('\\"', '"')
            character = 'narrator'
            print(f"  -> Static narrator: {text}")
            
            if text not in found_texts:
                found_texts.add(text)
                dialogue_entries.append({
                    'id': generate_dialogue_id(text, character),
                    'character': character,
                    'text': text,
                    'clean_text': clean_text_for_speech(text),
                    'line_number': line_num,
                    'type': 'static'
                })
            continue
        
        # Dynamic cases - try to identify the variable/template
        if 'enterText' in line or 'returnText' in line or 'cookingText' in line:
            print(f"  -> Dynamic variable call (need to find definition)")
        elif '${' in line or '`' in line:
            print(f"  -> Template literal (dynamic)")
        else:
            print(f"  -> Complex expression (dynamic)")
    
    return dialogue_entries

def find_variable_definitions(filename, var_names):
    """Find where variables like enterText, returnText are defined"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    definitions = {}
    
    for var_name in var_names:
        # Look for variable assignments
        patterns = [
            rf"const\s+{var_name}\s*=\s*['\"]([^'\"]+)['\"]",
            rf"let\s+{var_name}\s*=\s*['\"]([^'\"]+)['\"]",
            rf"{var_name}\s*=\s*['\"]([^'\"]+)['\"]"
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, content)
            if matches:
                definitions[var_name] = matches
                break
    
    return definitions

def main():
    print("🎭 Extracting ALL speak calls from current game...")
    
    # Extract all speak calls
    dialogue_entries = extract_all_speak_calls('script.js')
    
    # Look for dynamic variable definitions
    dynamic_vars = ['enterText', 'returnText', 'cookingText', 'finalText', 'emptyText', 'moondogText', 'matildaText', 'georgeText']
    var_definitions = find_variable_definitions('script.js', dynamic_vars)
    
    print(f"\n📊 Found variable definitions:")
    for var_name, values in var_definitions.items():
        print(f"  • {var_name}: {len(values)} definitions")
        for value in values:
            print(f"    - {value}")
    
    # Group by character
    by_character = defaultdict(list)
    for entry in dialogue_entries:
        by_character[entry['character']].append(entry)
    
    # Print summary
    print(f"\n📊 Found {len(dialogue_entries)} static dialogue entries:")
    for character, entries in by_character.items():
        print(f"  • {character}: {len(entries)} entries")
    
    # Save to file
    output_data = {
        'total_static_entries': len(dialogue_entries),
        'variable_definitions': var_definitions,
        'by_character': {char: len(entries) for char, entries in by_character.items()},
        'entries': dialogue_entries
    }
    
    with open('complete_speak_analysis.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Saved analysis to complete_speak_analysis.json")

if __name__ == '__main__':
    main()