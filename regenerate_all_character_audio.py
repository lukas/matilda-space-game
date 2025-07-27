#!/usr/bin/env python3
"""
Regenerate ALL audio files that contain character names in the original text
This will ensure no audio file says character names like "George:", "Matilda:", etc.
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
    """Clean text for speech synthesis - remove ALL character prefixes and emojis"""
    # Remove emojis first
    emoji_pattern = r'[🚀👨‍🚀👩‍🚀🐕‍🦺🧊😢💖👨‍🍳👩‍🍳🥕🥬🌽🍅🥒🥔🌙🏠🚪😋🎉🎆✨🎈❤️🌉🏙️🗽🏢🏬🏘️🏡🚋🤵👰🌅]'
    text = re.sub(emoji_pattern, '', text)
    
    # Remove character prefixes - be very aggressive about all variations
    # Handle "Character:" patterns
    text = re.sub(r'George:\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Matilda:\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Moon\s*Dog:\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Narrator:\s*', '', text, flags=re.IGNORECASE)
    
    # Handle any remaining patterns at the start
    text = re.sub(r'^(George|Matilda|Moon\s*Dog|Narrator)\s*:?\s*', '', text, flags=re.IGNORECASE)
    
    # Strip any extra whitespace
    text = text.strip()
    
    return text

def generate_audio_file(clean_text, character, voice_id, api_key, filename, output_dir='audio'):
    """Generate audio file using the clean text (no character names)"""
    
    if not clean_text.strip():
        return None
    
    output_path = os.path.join(output_dir, filename)
    
    print(f"🎵 Regenerating: {filename}")
    print(f"   Clean text: {clean_text}")
    
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
            return True
        else:
            print(f"❌ API Error {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error regenerating {filename}: {e}")
        return False

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
    
    # Find ALL files that have character names in the original text
    files_to_regenerate = []
    
    for file_entry in manifest['files']:
        original_text = file_entry['text']
        
        # Check if the original text contains character name prefixes
        if re.search(r'(George|Matilda|Moon\s*Dog|Narrator):\s*', original_text, re.IGNORECASE):
            # Clean the text and update clean_text field
            clean_text = clean_text_for_speech(original_text)
            file_entry['clean_text'] = clean_text
            files_to_regenerate.append(file_entry)
    
    print(f"\n🔍 Found {len(files_to_regenerate)} audio files with character names to regenerate")
    
    # Show what we're regenerating
    for i, file_entry in enumerate(files_to_regenerate[:10]):
        print(f"  {i+1}. [{file_entry['character']}] {file_entry['text'][:80]}...")
    
    if len(files_to_regenerate) > 10:
        print(f"  ... and {len(files_to_regenerate) - 10} more")
    
    # Proceed automatically
    print(f"\n⚠️  Starting regeneration of {len(files_to_regenerate)} audio files...")
    
    # Regenerate audio files
    regenerated_count = 0
    
    for i, file_entry in enumerate(files_to_regenerate):
        print(f"\n--- {i+1}/{len(files_to_regenerate)} ---")
        
        character = file_entry['character']
        clean_text = file_entry['clean_text']
        filename = file_entry['filename']
        voice_id = voice_mappings.get(character)
        
        if not voice_id:
            print(f"❌ No voice mapping for character: {character}")
            continue
        
        # Generate audio file using clean text
        success = generate_audio_file(clean_text, character, voice_id, api_key, filename)
        if success:
            regenerated_count += 1
        
        # Rate limiting
        time.sleep(1)
    
    print(f"\n✅ Successfully regenerated {regenerated_count} audio files")
    
    # Update manifest timestamp
    manifest['generated_at'] = time.strftime('%Y-%m-%d %H:%M:%S')
    
    # Save updated manifest
    with open('audio/manifest.json', 'w') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"📄 Updated manifest timestamp")
    print(f"📊 Total audio files: {manifest['total_files']}")
    print(f"\n🎉 All audio files should now speak without character name prefixes!")

if __name__ == '__main__':
    main()