from elevenlabs import generate, Voice, VoiceSettings
from app.core.config import settings
import os


class VoiceService:
    def __init__(self):
        """Initialize ElevenLabs Voice Service"""
        self.api_key = settings.ELEVENLABS_API_KEY
        if self.api_key and self.api_key != "your_elevenlabs_api_key_here":
            os.environ["ELEVEN_API_KEY"] = self.api_key

    def text_to_speech(
        self,
        text: str,
        voice_id: str = "EXAVITQu4vr4xnSDxMaL",  # Sarah - friendly, warm voice
        stability: float = 0.5,
        similarity_boost: float = 0.75,
        style: float = 0.0,
        use_speaker_boost: bool = True
    ) -> bytes:
        """
        Convert text to speech with emotion control

        Args:
            text: Text to convert to speech
            voice_id: ElevenLabs voice ID
                - EXAVITQu4vr4xnSDxMaL: Sarah (friendly, warm - default)
                - 21m00Tcm4TlvDq8ikWAM: Rachel (calm, professional)
                - AZnzlk1XvdvUeBnXmlld: Domi (strong, confident)
                - ErXwobaYiN019PkySvjV: Antoni (well-rounded, pleasant)
            stability: Voice stability (0.0 to 1.0)
                - Lower = more expressive/emotional
                - Higher = more stable/consistent
            similarity_boost: Voice clarity (0.0 to 1.0)
            style: Speaking style exaggeration (0.0 to 1.0)
            use_speaker_boost: Enhance voice clarity

        Returns:
            Audio bytes (MP3 format)
        """

        if not self.api_key or self.api_key == "your_elevenlabs_api_key_here":
            raise ValueError("ElevenLabs API key not configured")

        try:
            audio = generate(
                text=text,
                voice=Voice(
                    voice_id=voice_id,
                    settings=VoiceSettings(
                        stability=stability,
                        similarity_boost=similarity_boost,
                        style=style,
                        use_speaker_boost=use_speaker_boost
                    )
                ),
                model="eleven_multilingual_v2"
            )

            return audio

        except Exception as e:
            raise Exception(f"Error generating speech: {str(e)}")

    def get_emotional_voice_settings(self, emotion: str = "neutral"):
        """
        Get voice settings based on desired emotion

        Args:
            emotion: One of: neutral, encouraging, excited, patient, serious

        Returns:
            Dict with voice settings
        """
        emotion_settings = {
            "neutral": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.0,
            },
            "encouraging": {
                "stability": 0.3,  # Very expressive
                "similarity_boost": 0.85,
                "style": 0.6,  # Highly stylized for warmth
            },
            "excited": {
                "stability": 0.2,  # Extremely expressive
                "similarity_boost": 0.8,
                "style": 0.75,  # Maximum style for enthusiasm
            },
            "supportive": {
                "stability": 0.35,  # Expressive but gentle
                "similarity_boost": 0.85,
                "style": 0.4,
            },
            "empathetic": {
                "stability": 0.4,  # Warm and caring
                "similarity_boost": 0.85,
                "style": 0.35,
            },
            "patient": {
                "stability": 0.7,  # Very stable
                "similarity_boost": 0.8,
                "style": 0.1,  # Minimal style
            },
            "serious": {
                "stability": 0.8,  # Very stable
                "similarity_boost": 0.7,
                "style": 0.0,  # No style exaggeration
            },
            "congratulatory": {
                "stability": 0.35,
                "similarity_boost": 0.85,
                "style": 0.4,
            }
        }

        return emotion_settings.get(emotion, emotion_settings["neutral"])


# Create singleton instance
voice_service = VoiceService()
