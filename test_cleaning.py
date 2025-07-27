#!/usr/bin/env python3
import re

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

# Test cases
test_cases = [
    "🐕‍🦺 Moon Dog: This breakfast smells amazing! Thank you for cooking with me!",
    "👨‍🚀 George: Cooking together is so much fun!",
    "👩‍🚀 Matilda: The best part is sharing it with friends!",
    "🤵 George: I feel so fancy in this tuxedo!",
    "👰 Matilda: This restaurant is absolutely beautiful!"
]

for test in test_cases:
    cleaned = clean_text_for_speech(test)
    print(f"Original: {test}")
    print(f"Cleaned:  {cleaned}")
    print()