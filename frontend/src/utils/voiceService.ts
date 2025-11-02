// Web Speech API service for voice recording
export class VoiceService {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  startListening(
    onResult: (transcript: string) => void,
    onError?: (error: string) => void
  ): void {
    if (!this.recognition) {
      onError?.('Speech recognition not supported in this browser');
      return;
    }

    if (this.isListening) {
      return;
    }

    this.isListening = true;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      this.isListening = false;
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      onError?.(event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      this.isListening = false;
      onError?.('Failed to start voice recognition');
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

// Audio playback service
export class AudioPlayerService {
  private audio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;

  playAudio(audioUrl: string, onEnd?: () => void): void {
    // Stop any currently playing audio
    this.stopAudio();

    this.audio = new Audio(audioUrl);
    this.isPlaying = true;

    this.audio.onended = () => {
      this.isPlaying = false;
      onEnd?.();
    };

    this.audio.onerror = (error) => {
      console.error('Audio playback error:', error);
      this.isPlaying = false;
    };

    this.audio.play().catch((error) => {
      console.error('Error playing audio:', error);
      this.isPlaying = false;
    });
  }

  stopAudio(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
      this.isPlaying = false;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
