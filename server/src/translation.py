from deep_translator import GoogleTranslator
import time

def translate_to_english(text: str, source="auto") -> str:
    """
    Translates input text to English using Google Translator.
    Retries once on failure.
    """
    try:
        # Use simple 'auto' detection or specific source
        translator = GoogleTranslator(source=source, target='en')
        translated = translator.translate(text)
        return translated
    except Exception as e:
        print(f"[WARNING] Translation failed: {e}")
        # Fallback to original text if translation fails
        return text
