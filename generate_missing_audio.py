#!/usr/bin/env python3
"""
Generate missing audio files from the complete dialogue analysis
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
    emoji_pattern = r'[🚀👨‍🚀👩‍🚀🐕‍🦺🧊😢💖👨‍🍳👩‍🍳🥕🥬🌽🍅🥒🥔🌙🏠🚪😋🎉🎆✨🎈❤️🌉🏙️🗽🏢🏬🏘️🏡🚋🤵👰]'
    text = re.sub(emoji_pattern, '', text)
    
    # Remove character prefixes
    text = re.sub(r'^(George|Matilda|Moon Dog):\s*', '', text, flags=re.IGNORECASE)
    
    return text.strip()

def extract_missing_static_dialogue():
    """Extract the missing static dialogue from script.js"""
    
    missing_dialogues = [
        # From the analysis - these are the ones we missed
        {'text': "We have landed on the moon! Now let's walk to Moon Dog's house!", 'character': 'narrator', 'line': 665},
        {'text': "Great! Now let's chop the vegetables on the cutting board!", 'character': 'narrator', 'line': 1991},
        {'text': "Perfect! Now let's arrange the chopped vegetables on the plate!", 'character': 'narrator', 'line': 1998},
        {'text': "🐕‍🦺 Moon Dog: This is the most delicious meal I've ever had! Thank you both!", 'character': 'moondog', 'line': 2024},
        {'text': "👨‍🍳 George: We're so happy to cook for you, Moon Dog!", 'character': 'george', 'line': 2025},
        {'text': "👩‍🍳 Matilda: It's wonderful to share a meal with friends!", 'character': 'matilda', 'line': 2026},
        {'text': "👩‍🚀 Matilda: These moon vegetables are the most colorful I've ever seen!", 'character': 'matilda', 'line': 2417},
        {'text': "👨‍🚀 George: Let's pick some for later! Fresh vegetables taste the best!", 'character': 'george', 'line': 2418},
        {'text': "🐕‍🦺 Moon Dog: I've never had such a wonderful feast! You two are amazing chefs!", 'character': 'moondog', 'line': 2520},
        {'text': "Moon Dog's fridge is now fully stocked with delicious food!", 'character': 'narrator', 'line': 2584},
        {'text': "Now let's go to the fanciest restaurant on the moon!", 'character': 'narrator', 'line': 2591},
        {'text': "👩‍🚀 Matilda: We'll never forget our amazing moon adventure with you!", 'character': 'matilda', 'line': 2771},
        {'text': "🐕‍🦺 Moon Dog: Come back and visit me again soon! I'll miss you both so much!", 'character': 'moondog', 'line': 2773},
        {'text': "Now it's time to return to Earth! The spaceship is flying back home!", 'character': 'narrator', 'line': 2813},
        {'text': "Look! Earth is getting bigger! We're almost home!", 'character': 'narrator', 'line': 2826},
        {'text': "👨‍🚀 George: Wow! It feels so good to be back in New York! I can't wait to tell everyone about our moon adventure!", 'character': 'george', 'line': 2909},
        {'text': "👩‍🚀 Matilda: I'm going to miss you so much, George! This was the best adventure ever!", 'character': 'matilda', 'line': 2911},
        {'text': "👨‍🚀 George: I'll miss you too, Matilda! Let's plan another adventure soon!", 'character': 'george', 'line': 2913},
        {'text': "Welcome to beautiful San Francisco! This is Matilda's home!", 'character': 'narrator', 'line': 3002},
        {'text': "👩‍🚀 Matilda: Home sweet home! I love San Francisco, but I'll always remember our incredible moon adventure!", 'character': 'matilda', 'line': 3004},
        {'text': "👩‍🚀 Matilda: I can't wait to tell my family about Moon Dog, the vegetable garden, the playground, and all our fun activities!", 'character': 'matilda', 'line': 3006},
    ]
    
    return missing_dialogues

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
    
    # Get missing dialogues
    missing_dialogues = extract_missing_static_dialogue()
    
    print(f"\n🎭 Found {len(missing_dialogues)} missing dialogue entries")
    
    # Generate audio files
    generated_files = []
    
    for i, dialogue in enumerate(missing_dialogues):
        print(f"\n--- {i+1}/{len(missing_dialogues)} ---")
        
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
    
    print(f"\n✅ Successfully generated {len(generated_files)} new audio files")
    
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