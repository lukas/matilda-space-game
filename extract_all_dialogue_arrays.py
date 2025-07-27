#!/usr/bin/env python3
"""
Extract all dialogue array entries manually from script.js
"""
import json
import requests
import hashlib
import time
import os

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

def generate_dialogue_id(text, character):
    """Generate unique ID for dialogue"""
    combined = f"{text}_{character}"
    return hashlib.md5(combined.encode()).hexdigest()[:8]

def clean_text_for_speech(text):
    """Clean text for speech synthesis"""
    import re
    # Remove emojis
    emoji_pattern = r'[🚀👨‍🚀👩‍🚀🐕‍🦺🧊😢💖👨‍🍳👩‍🍳🥕🥬🌽🍅🥒🥔🌙🏠🚪😋🎉🎆✨🎈❤️🌉🏙️🗽🏢🏬🏘️🏡🚋🤵👰🌅]'
    text = re.sub(emoji_pattern, '', text)
    
    # Remove character prefixes
    text = re.sub(r'^(George|Matilda|Moon Dog):\s*', '', text, flags=re.IGNORECASE)
    
    return text.strip()

def get_manual_dialogue_entries():
    """Manually extract the dialogue arrays we found"""
    
    dialogue_entries = [
        # First dialogue array (showNextDialogue)
        {'text': "🐕‍🦺 Moon Dog: Woof! George and Matilda! Welcome to my moon house!", 'character': 'moondog'},
        {'text': "👨‍🚀 George: Hi Moon Dog! We're so happy to visit you!", 'character': 'george'},
        {'text': "👩‍🚀 Matilda: Your house looks amazing! We brought our appetites!", 'character': 'matilda'},
        {'text': "🐕‍🦺 Moon Dog: Oh no... I'm so embarrassed. I don't have any food to offer you...", 'character': 'moondog'},
        {'text': "👨‍🚀 George: Don't worry! Maybe we can help somehow?", 'character': 'george'},
        {'text': "👩‍🚀 Matilda: Let's check your refrigerator! Walk close to it to see what's inside.", 'character': 'matilda'},
        
        # Second dialogue array (showReturnDialogue) 
        {'text': "👨‍🚀 George: We're back, Moon Dog! Look at all the vegetables we found!", 'character': 'george'},
        {'text': "👩‍🚀 Matilda: We collected 6 fresh vegetables for you!", 'character': 'matilda'},  # Using fixed number since template
        {'text': "🐕‍🦺 Moon Dog: Wow! You two are amazing! Thank you so much!", 'character': 'moondog'},
        {'text': "👨‍🚀 George: Let's put them in your refrigerator and cook a delicious dinner!", 'character': 'george'},
        {'text': "👩‍🚀 Matilda: Walk close to the refrigerator to start cooking!", 'character': 'matilda'},
    ]
    
    return dialogue_entries

def generate_audio_file(text, character, voice_id, api_key, output_dir='audio'):
    """Generate a single audio file using ElevenLabs API"""
    
    # Clean text for API
    clean_text = clean_text_for_speech(text)
    if not clean_text:
        return None
    
    # Generate ID and filename
    dialogue_id = generate_dialogue_id(text, character)
    filename = f"{character}_{dialogue_id}.mp3"
    output_path = os.path.join(output_dir, filename)
    
    # Skip if file already exists
    if os.path.exists(output_path):
        print(f"✅ File already exists: {filename}")
        return {
            'id': dialogue_id,
            'character': character,
            'filename': filename,
            'text': text,
            'clean_text': clean_text
        }
    
    print(f"🎵 Generating: {filename}")
    print(f"   Text: {clean_text}")
    
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
            
            print(f"✅ Generated: {filename}")
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
        print(f"❌ Error generating {filename}: {e}")
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
    
    # Get manual dialogue entries
    dialogue_entries = get_manual_dialogue_entries()
    
    print(f"\n🎭 Found {len(dialogue_entries)} manual dialogue entries")
    
    # Load existing manifest to check what we already have
    try:
        with open('audio/manifest.json', 'r') as f:
            manifest = json.load(f)
        existing_texts = {f['text'] for f in manifest['files']}
    except FileNotFoundError:
        existing_texts = set()
    
    # Filter out existing entries
    new_dialogues = [d for d in dialogue_entries if d['text'] not in existing_texts]
    
    print(f"📝 Found {len(new_dialogues)} new dialogue entries to generate")
    
    # Show what we're generating
    for i, dialogue in enumerate(new_dialogues):
        print(f"  {i+1}. [{dialogue['character']}] {dialogue['text'][:60]}...")
    
    # Generate audio files
    generated_files = []
    
    for i, dialogue in enumerate(new_dialogues):
        print(f"\n--- {i+1}/{len(new_dialogues)} ---")
        
        character = dialogue['character']
        text = dialogue['text']
        voice_id = voice_mappings.get(character)
        
        if not voice_id:
            print(f"❌ No voice mapping for character: {character}")
            continue
        
        # Generate audio file
        result = generate_audio_file(text, character, voice_id, api_key)
        if result:
            generated_files.append(result)
        
        # Rate limiting
        time.sleep(1)
    
    print(f"\n✅ Successfully generated {len(generated_files)} new dialogue audio files")
    
    # Load existing manifest and add new files
    try:
        with open('audio/manifest.json', 'r') as f:
            manifest = json.load(f)
    except FileNotFoundError:
        manifest = {
            'version': '1.0',
            'voice_mappings': voice_mappings,
            'files': []
        }
    
    # Add new files to manifest
    existing_ids = {f['id'] for f in manifest['files']}
    new_files = [f for f in generated_files if f['id'] not in existing_ids]
    
    manifest['files'].extend(new_files)
    manifest['total_files'] = len(manifest['files'])
    manifest['generated_at'] = time.strftime('%Y-%m-%d %H:%M:%S')
    
    # Save updated manifest
    with open('audio/manifest.json', 'w') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"📄 Updated manifest with {len(new_files)} new files")
    print(f"📊 Total audio files: {manifest['total_files']}")

if __name__ == '__main__':
    main()