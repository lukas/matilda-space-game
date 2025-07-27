# 🎙️ Mobile Audio Setup with ElevenLabs

This guide explains how to set up high-quality audio for mobile devices using ElevenLabs text-to-speech API.

## 📋 Prerequisites

1. **ElevenLabs Account**: Sign up at [elevenlabs.io](https://elevenlabs.io)
2. **API Key**: Get your API key from the ElevenLabs dashboard
3. **Python 3.7+**: Required for the audio generation scripts

## 🚀 Quick Setup

### Step 1: Set Environment Variable
```bash
export ELEVENLABS_API_KEY='your_api_key_here'
```

### Step 2: Extract Dialogue
```bash
python3 extract_dialogue.py
```
This creates `dialogue_data.json` with all game dialogue.

### Step 3: Generate Audio Files
```bash
python3 generate_audio.py
```
This creates the `audio/` directory with MP3 files for each dialogue line.

### Step 4: Deploy to Netlify
The audio files need to be uploaded to your Netlify site in the `audio/` directory.

## 📁 File Structure
```
matilda-space-game/
├── audio/                    # Generated audio files
│   ├── manifest.json        # Audio file index
│   ├── narrator_12345678.mp3
│   ├── george_87654321.mp3
│   ├── matilda_11223344.mp3
│   └── moondog_44332211.mp3
├── audio-system.js          # Mobile audio player
├── extract_dialogue.py      # Dialogue extraction script
├── generate_audio.py        # Audio generation script
└── dialogue_data.json       # Extracted dialogue data
```

## 🎭 Voice Assignments

The system uses different ElevenLabs voices for each character:

- **Narrator**: Adam (pNInz6obpgDQGcFmaJgB) - Clear, friendly narrator
- **George**: Josh (VR6AewLTigWG4xSOukaG) - Young, energetic male
- **Matilda**: Jessica (jsCqWAovK2LkecY7zXl4) - Young, cheerful female  
- **Moon Dog**: Brian (cgSgspJ2msm6clMCkdW9) - Warm, friendly character

## 🔧 How It Works

1. **Mobile Detection**: Automatically detects mobile devices
2. **Audio Fallback**: Uses ElevenLabs audio files on mobile, text-to-speech on desktop
3. **Smart Matching**: Matches dialogue text to pre-generated audio files
4. **Graceful Degradation**: Falls back to text-to-speech if audio files are missing

## 📊 Stats

- **Total Dialogue Lines**: 34
- **Characters**: 4 (narrator, george, matilda, moondog)
- **Audio Quality**: ElevenLabs high-quality synthesis
- **File Format**: MP3 (optimal for web)
- **Mobile Compatibility**: iOS Safari, Android Chrome

## 🔊 Audio System Features

- **Preloading**: Audio files are cached for smooth playback
- **Interruption Handling**: New dialogue stops previous audio
- **Mute Support**: Integrates with game's mute button
- **Error Handling**: Gracefully falls back to text-to-speech on errors

## 🚀 Deployment

1. Generate audio files locally using the scripts above
2. Upload the entire `audio/` directory to your web server
3. The game will automatically detect and use the audio files on mobile devices

## 💡 Tips

- **API Limits**: ElevenLabs has monthly character limits
- **Voice Selection**: You can change voice IDs in `generate_audio.py`
- **Quality Settings**: Adjust stability/similarity in the generation script
- **File Size**: MP3 files are optimized for web delivery

## 🐛 Troubleshooting

**Audio not playing on mobile?**
- Check that `audio/manifest.json` exists and is accessible
- Verify audio files are in the correct directory
- Check browser console for loading errors

**Text-to-speech still being used?**
- Ensure mobile device is detected correctly
- Check that audio files match the expected naming convention
- Verify the audio system is initialized properly

The mobile audio system provides a much better user experience than browser text-to-speech, especially on iOS devices where TTS is often problematic.