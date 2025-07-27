#!/usr/bin/env python3

import json
import os
import requests
import time
from pathlib import Path

# ElevenLabs API configuration
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech"

# Voice mappings for different characters
VOICE_IDS = {
    'narrator': 'pNInz6obpgDQGcFmaJgB',  # Adam - clear, friendly narrator voice
    'george': 'VR6AewLTigWG4xSOukaG',    # Josh - young, energetic male voice  
    'matilda': 'jsCqWAovK2LkecY7zXl4',   # Jessica - young, cheerful female voice
    'moondog': 'cgSgspJ2msm6clMCkdW9'    # Brian - warm, friendly character voice
}

def create_audio_directory():
    """Create audio directory if it doesn't exist."""
    audio_dir = Path('audio')
    audio_dir.mkdir(exist_ok=True)
    return audio_dir

def generate_audio_file(text, voice_id, filename, audio_dir):
    """Generate audio file using ElevenLabs API."""
    
    if not ELEVENLABS_API_KEY:
        print("❌ ELEVENLABS_API_KEY environment variable not set")
        return False
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    
    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5,
            "style": 0.0,
            "use_speaker_boost": True
        }
    }
    
    try:
        response = requests.post(
            f"{ELEVENLABS_URL}/{voice_id}",
            json=data,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            file_path = audio_dir / f"{filename}.mp3"
            with open(file_path, 'wb') as f:
                f.write(response.content)
            print(f"✅ Generated: {filename}.mp3")
            return True
        else:
            print(f"❌ Error generating {filename}: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception generating {filename}: {str(e)}")
        return False

def main():
    print("🎙️ Generating audio files with ElevenLabs...")
    
    if not ELEVENLABS_API_KEY:
        print("\n❌ Please set ELEVENLABS_API_KEY environment variable")
        print("   export ELEVENLABS_API_KEY='your_api_key_here'")
        return
    
    # Load dialogue data
    try:
        with open('dialogue_data.json', 'r', encoding='utf-8') as f:
            dialogue_data = json.load(f)
    except FileNotFoundError:
        print("❌ dialogue_data.json not found. Run extract_dialogue.py first.")
        return
    
    audio_dir = create_audio_directory()
    
    print(f"📝 Processing {dialogue_data['total_entries']} dialogue entries...")
    print(f"🎭 Characters: {', '.join(dialogue_data['characters'])}")
    
    successful = 0
    failed = 0
    
    for entry in dialogue_data['dialogue']:
        dialogue_id = entry['id']
        text = entry['clean_text']
        character = entry['character']
        
        # Skip empty text
        if not text.strip():
            print(f"⏭️  Skipping empty dialogue: {dialogue_id}")
            continue
        
        # Get voice ID for character
        voice_id = VOICE_IDS.get(character)
        if not voice_id:
            print(f"❌ No voice ID configured for character: {character}")
            failed += 1
            continue
        
        filename = f"{character}_{dialogue_id}"
        
        # Check if file already exists
        file_path = audio_dir / f"{filename}.mp3"
        if file_path.exists():
            print(f"⏭️  Skipping existing: {filename}.mp3")
            successful += 1
            continue
        
        print(f"🎵 Generating [{character}]: {text[:50]}...")
        
        if generate_audio_file(text, voice_id, filename, audio_dir):
            successful += 1
        else:
            failed += 1
        
        # Rate limiting - wait between requests
        time.sleep(1)
    
    print(f"\n🎉 Audio generation complete!")
    print(f"   ✅ Successful: {successful}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📁 Audio files saved to: {audio_dir.absolute()}")
    
    # Generate audio manifest
    manifest = {
        "version": "1.0",
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_files": successful,
        "voice_mappings": VOICE_IDS,
        "files": []
    }
    
    for entry in dialogue_data['dialogue']:
        if entry['clean_text'].strip():
            filename = f"{entry['character']}_{entry['id']}.mp3"
            file_path = audio_dir / filename
            if file_path.exists():
                manifest["files"].append({
                    "id": entry['id'],
                    "character": entry['character'],
                    "filename": filename,
                    "text": entry['text'],
                    "clean_text": entry['clean_text']
                })
    
    # Save audio manifest
    with open(audio_dir / 'manifest.json', 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"📋 Audio manifest saved to: {audio_dir / 'manifest.json'}")

if __name__ == "__main__":
    main()