#!/usr/bin/env python3
"""
Regenerate audio files that have character names in the spoken audio content
This targets the 37 files that were identified earlier but couldn't be regenerated due to quota
"""
import json
import requests
import hashlib
import time
import os
import re

def get_api_key():
    """Get ElevenLabs API key from .zshrc"""
    zshrc_path = os.path.expanduser('~/.zshrc')
    try:
        with open(zshrc_path, 'r') as f:
            content = f.read()
        
        # Look for ELEVENLABS_API_KEY
        import re
        match = re.search(r'export ELEVENLABS_API_KEY="([^"]+)"', content)
        if match:
            return match.group(1)
        
        match = re.search(r'ELEVENLABS_API_KEY=([^\s\n]+)', content)
        if match:
            return match.group(1).strip('"\'')
            
    except FileNotFoundError:
        pass
    
    # Try environment variable
    return os.environ.get('ELEVENLABS_API_KEY')

def clean_text_for_speech(text):
    """Clean text for speech synthesis - remove ALL character prefixes"""
    import re
    # Remove emojis first
    emoji_pattern = r'[🚀👨‍🚀👩‍🚀🐕‍🦺🧊😢💖👨‍🍳👩‍🍳🥕🥬🌽🍅🥒🥔🌙🏠🚪😋🎉🎆✨🎈❤️🌉🏙️🗽🏢🏬🏘️🏡🚋🤵👰🌅]'
    text = re.sub(emoji_pattern, '', text)
    
    # Remove ALL character prefixes - be more aggressive
    text = re.sub(r'^(George|Matilda|Moon\s*Dog|Narrator):\s*', '', text, flags=re.IGNORECASE)
    
    # Double-check for any remaining character names at the start
    text = re.sub(r'^(George|Matilda|Moon\s*Dog|Narrator)\s*[:\-]\s*', '', text, flags=re.IGNORECASE)
    
    return text.strip()

def generate_audio_file(text, character, voice_id, api_key, output_dir='audio'):
    """Generate a single audio file using ElevenLabs API"""
    
    # Clean text for API
    clean_text = clean_text_for_speech(text)
    if not clean_text:
        return None
    
    # Generate ID and filename (same as original)
    dialogue_id = hashlib.md5(f"{text}_{character}".encode()).hexdigest()[:8]
    filename = f"{character}_{dialogue_id}.mp3"
    output_path = os.path.join(output_dir, filename)
    
    print(f"🎵 Regenerating: {filename}")
    print(f"   Original: {text[:60]}...")
    print(f"   Clean: {clean_text}")
    
    # API request
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    
    data = {
        "text": clean_text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            os.makedirs(output_dir, exist_ok=True)
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ Regenerated: {filename}")
            return {
                'id': dialogue_id,
                'character': character,
                'filename': filename,
                'text': text,
                'clean_text': clean_text
            }
        else:
            print(f"❌ API Error {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error regenerating {filename}: {e}")
        return None

def main():
    # Get API key
    api_key = get_api_key()
    if not api_key:
        print("❌ No ElevenLabs API key found!")
        return
    
    print(f"🔑 Using API key: {api_key[:10]}...")
    
    # Voice mappings
    voice_mappings = {
        'narrator': 'pNInz6obpgDQGcFmaJgB',  # Adam
        'george': 'VR6AewLTigWG4xSOukaG',    # Josh  
        'matilda': 'jsCqWAovK2LkecY7zXl4',  # Jessica
        'moondog': 'cgSgspJ2msm6clMCkdW9'   # Brian
    }
    
    # Load existing manifest
    with open('audio/manifest.json', 'r') as f:
        manifest = json.load(f)
    
    # Find files that originally had character names (these are the 37 files we need to regenerate)
    # These files will have character names in the "text" field but clean text in "clean_text" field
    files_to_regenerate = []
    
    target_file_ids = [
        '5f6cfe01', '2fe0ba20', 'f9f7c43a', '991b002b', '8b8f15fa', '59140622', '520f1bea',
        '6caf54e0', '0fc7c496', '4e4ff699', '8f2c521d', 'df11e06f', '8dc414df', 'fe18af6c',
        'f97d6150', 'f4546d4f', '774e6c9d', '151c2c42', '8af5f20f', '6904d32f', 'dfe227bc',
        '241a4b2d', 'd38744d7', 'd3d2c2c1', 'f4414700', 'f5136875', '1e523fbd', '72fdd034',
        '1d329a7e', '8a5c0493', 'aae08e4b', '3b8ac9c6', 'fb09bc82', '1a7081e3', '01804f41',
        'a7e290b6', 'b188107a'
    ]
    
    for file_entry in manifest['files']:
        if file_entry['id'] in target_file_ids:
            files_to_regenerate.append(file_entry)
    
    print(f"\n🔍 Regenerating {len(files_to_regenerate)} files to remove character names from audio")
    
    # Also add the missing "Great idea! Let's help our friend Moon Dog!" line
    great_idea_text = "👨‍🚀 George: Great idea! Let's help our friend Moon Dog!"
    great_idea_entry = {
        'character': 'george',
        'text': great_idea_text,
        'clean_text': clean_text_for_speech(great_idea_text)
    }
    files_to_regenerate.append(great_idea_entry)
    print(f"➕ Also adding missing line: {great_idea_entry['clean_text']}")
    
    # Show what we're regenerating
    for i, file_entry in enumerate(files_to_regenerate[:10]):
        print(f"  {i+1}. [{file_entry['character']}] {file_entry.get('clean_text', clean_text_for_speech(file_entry['text']))[:60]}...")
    
    if len(files_to_regenerate) > 10:
        print(f"  ... and {len(files_to_regenerate) - 10} more")
    
    # Regenerate audio files
    regenerated_files = []
    
    for i, file_entry in enumerate(files_to_regenerate):
        print(f"\n--- {i+1}/{len(files_to_regenerate)} ---")
        
        character = file_entry['character']
        text = file_entry['text']
        voice_id = voice_mappings.get(character)
        
        if not voice_id:
            print(f"❌ No voice mapping for character: {character}")
            continue
        
        # Generate audio file
        result = generate_audio_file(text, character, voice_id, api_key)
        if result:
            regenerated_files.append(result)
            
            # Update or add the manifest entry
            found = False
            for j, manifest_file in enumerate(manifest['files']):
                if manifest_file.get('id') == file_entry.get('id'):
                    manifest['files'][j]['clean_text'] = result['clean_text']
                    found = True
                    break
            
            # If not found, add new entry for missing dialogue
            if not found:
                new_entry = {
                    'id': result['id'],
                    'character': result['character'],
                    'filename': result['filename'],
                    'text': result['text'],
                    'clean_text': result['clean_text']
                }
                manifest['files'].append(new_entry)
                manifest['total_files'] = len(manifest['files'])
                print(f"➕ Added new audio file to manifest: {result['filename']}")
        
        # Rate limiting
        time.sleep(1)
    
    print(f"\n✅ Successfully regenerated {len(regenerated_files)} audio files")
    
    # Update manifest
    manifest['generated_at'] = time.strftime('%Y-%m-%d %H:%M:%S')
    
    # Save updated manifest
    with open('audio/manifest.json', 'w') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"📄 Updated manifest")
    print(f"📊 Total audio files: {manifest['total_files']}")

if __name__ == '__main__':
    main()