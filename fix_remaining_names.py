#!/usr/bin/env python3
"""
Fix the remaining character name prefixes in clean_text
Only target lines that start with "Character:" pattern
"""
import json
import re

def main():
    # Load existing manifest
    with open('audio/manifest.json', 'r') as f:
        manifest = json.load(f)
    
    # Find and fix files that have character names at the START of clean_text
    fixed_count = 0
    
    for file_entry in manifest['files']:
        old_clean_text = file_entry['clean_text']
        
        # Only fix lines that start with "Character:" pattern
        new_clean_text = old_clean_text
        
        # Check for character names at the beginning followed by colon
        if re.match(r'^George:\s*', old_clean_text, re.IGNORECASE):
            new_clean_text = re.sub(r'^George:\s*', '', old_clean_text, flags=re.IGNORECASE)
        elif re.match(r'^Matilda:\s*', old_clean_text, re.IGNORECASE):
            new_clean_text = re.sub(r'^Matilda:\s*', '', old_clean_text, flags=re.IGNORECASE)
        elif re.match(r'^Moon\s*Dog:\s*', old_clean_text, re.IGNORECASE):
            new_clean_text = re.sub(r'^Moon\s*Dog:\s*', '', old_clean_text, flags=re.IGNORECASE)
        elif re.match(r'^Narrator:\s*', old_clean_text, re.IGNORECASE):
            new_clean_text = re.sub(r'^Narrator:\s*', '', old_clean_text, flags=re.IGNORECASE)
        
        # Check if there was actually a change
        if old_clean_text != new_clean_text:
            print(f"Fixing: {file_entry['filename']}")
            print(f"  Old: {old_clean_text}")
            print(f"  New: {new_clean_text}")
            print()
            
            file_entry['clean_text'] = new_clean_text
            fixed_count += 1
    
    if fixed_count > 0:
        print(f"✅ Fixed {fixed_count} clean_text entries")
        
        # Update manifest timestamp
        import time
        manifest['generated_at'] = time.strftime('%Y-%m-%d %H:%M:%S')
        
        # Save updated manifest
        with open('audio/manifest.json', 'w') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        print(f"📄 Updated manifest.json")
    else:
        print("✅ No character name prefixes found to fix!")
    
    print(f"📊 Total audio files: {manifest['total_files']}")

if __name__ == '__main__':
    main()