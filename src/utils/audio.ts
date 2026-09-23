/**
 * Web Audio Synthesizer & Speech Pipeline for Gatekeeper
 * Implements FSM Audio/Haptic feedback according to spec:
 * - IDLE: Muted ambient hum
 * - LISTENING: Continuous haptic tick & pulsing audio
 * - EVALUATING: Low-frequency pitch loop
 * - DENIED: Deep bass burst haptic
 * - APPROVED: Soft chime entrance sound
 * - COOLDOWN: Lock sound
 * - AUDIT: Double chime notification
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private evalOsc: OscillatorNode | null = null;
  private evalGain: GainNode | null = null;
  private currentAudioSource: AudioBufferSourceNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopContinuousSounds();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // IDLE: Muted ambient hum
  public startAmbientHum() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    if (this.ambientOsc) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note deep drone

      // Gentle LFO filter
      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.015, this.ctx.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();

      this.ambientOsc = osc;
      this.ambientGain = gain;
    } catch (e) {
      console.warn("AudioContext error", e);
    }
  }

  public stopAmbientHum() {
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
        setTimeout(() => {
          this.ambientOsc?.stop();
          this.ambientOsc?.disconnect();
          this.ambientOsc = null;
          this.ambientGain = null;
        }, 500);
      } catch {
        this.ambientOsc = null;
        this.ambientGain = null;
      }
    }
  }

  // LISTENING: Light continuous haptic tick
  public playHapticTick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);

      // Trigger navigator haptic if supported on mobile
      if (navigator.vibrate) {
        navigator.vibrate(15);
      }
    } catch (e) {
      // Ignored
    }
  }

  // EVALUATING: Low-frequency pitch loop
  public startEvaluatingLoop() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    if (this.evalOsc) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(110, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 2.0);

      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();

      this.evalOsc = osc;
      this.evalGain = gain;
    } catch (e) {
      // Ignored
    }
  }

  public stopEvaluatingLoop() {
    if (this.evalGain && this.ctx) {
      try {
        this.evalGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);
        setTimeout(() => {
          this.evalOsc?.stop();
          this.evalOsc?.disconnect();
          this.evalOsc = null;
          this.evalGain = null;
        }, 200);
      } catch {
        this.evalOsc = null;
        this.evalGain = null;
      }
    }
  }

  // DENIED: Deep bass burst haptic
  public playDeniedBurst() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(90, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, this.ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.55);

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (e) {
      // Ignored
    }
  }

  // APPROVED: Soft chime / entrance sound
  public playApprovedChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Harmonic Zen chime)
      frequencies.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.001, this.ctx!.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.08, this.ctx!.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + idx * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + idx * 0.08);
        osc.stop(this.ctx!.currentTime + idx * 0.08 + 1.25);
      });

      if (navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }
    } catch (e) {
      // Ignored
    }
  }

  public playApprovedSound() {
    this.playApprovedChime();
  }

  // COOLDOWN: Lock sound
  public playLockSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      // Ignored
    }
  }

  // AUDIT: Double chime notification
  public playAuditChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      [880, 1174.66].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.16);

        gain.gain.setValueAtTime(0.001, this.ctx!.currentTime + idx * 0.16);
        gain.gain.linearRampToValueAtTime(0.09, this.ctx!.currentTime + idx * 0.16 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + idx * 0.16 + 0.9);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + idx * 0.16);
        osc.stop(this.ctx!.currentTime + idx * 0.16 + 0.95);
      });
    } catch (e) {
      // Ignored
    }
  }

  public stopContinuousSounds() {
    this.stopAmbientHum();
    this.stopEvaluatingLoop();
    this.stopDialogue();
  }

  // Stop any active spoken audio (speech synthesis or neural audio stream)
  public stopDialogue() {
    try {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (this.currentAudioSource) {
        this.currentAudioSource.stop();
        this.currentAudioSource.disconnect();
        this.currentAudioSource = null;
      }
    } catch {}
  }

  // Decode and play high-fidelity neural audio with custom baritone acoustic resonance
  private async playBase64Audio(base64Data: string, sampleRate = 24000, characterId = "satoshi") {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      this.stopDialogue();

      const binaryStr = atob(base64Data);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      let audioBuffer: AudioBuffer;

      // Check if RIFF header (standard WAV)
      if (bytes.length > 4 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
        audioBuffer = await this.ctx.decodeAudioData(bytes.buffer.slice(0));
      } else {
        // Raw 16-bit PCM (signed int16, single channel)
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }
        audioBuffer = this.ctx.createBuffer(1, float32Array.length, sampleRate);
        audioBuffer.copyToChannel(float32Array, 0);
      }

      const source = this.ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Acoustic Resonance Chain for Master Satoshi: Deep Bass Boost & Rich Harmonic Presence
      if (characterId === "satoshi") {
        // Deep low-shelf filter for chest resonance & power
        const bassFilter = this.ctx.createBiquadFilter();
        bassFilter.type = "lowshelf";
        bassFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
        bassFilter.gain.setValueAtTime(4.5, this.ctx.currentTime); // +4.5dB deep baritone body

        // Gentle articulation presence filter for crisp, natural clarity
        const presenceFilter = this.ctx.createBiquadFilter();
        presenceFilter.type = "peaking";
        presenceFilter.frequency.setValueAtTime(2600, this.ctx.currentTime);
        presenceFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
        presenceFilter.gain.setValueAtTime(1.5, this.ctx.currentTime);

        // Warm master compressor for strong, un-clipped vocal delivery
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
        compressor.knee.setValueAtTime(18, this.ctx.currentTime);
        compressor.ratio.setValueAtTime(3.5, this.ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(1.25, this.ctx.currentTime);

        source.connect(bassFilter);
        bassFilter.connect(presenceFilter);
        presenceFilter.connect(compressor);
        compressor.connect(gainNode);
        gainNode.connect(this.ctx.destination);
      } else {
        source.connect(this.ctx.destination);
      }

      this.currentAudioSource = source;
      source.onended = () => {
        if (this.currentAudioSource === source) {
          this.currentAudioSource = null;
        }
      };

      source.start();
    } catch (err) {
      console.warn("Base64 audio playback failed, falling back to Web Speech:", err);
      // Fall back to browser speech synthesis
      this.speakViaSpeechSynthesis(base64Data, characterId);
    }
  }

  // Browser speech synthesis fallback with slow, deep, strong parameters
  private speakViaSpeechSynthesis(text: string, characterId: string = "satoshi") {
    if (this.isMuted || typeof window === "undefined" || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      if (characterId === "satoshi") {
        // Deep and strong, slow and natural delivery
        utterance.rate = 0.76; // Slow, deliberate, dignified pacing (natural cadence)
        utterance.pitch = 0.58; // Deep, commanding, masculine baritone register
        utterance.volume = 1.0; // Strong, authoritative presence
      } else if (characterId === "vance") {
        utterance.rate = 1.15;
        utterance.pitch = 0.9;
        utterance.volume = 1.0;
      } else if (characterId === "marcus") {
        utterance.rate = 0.85;
        utterance.pitch = 0.8;
        utterance.volume = 1.0;
      } else if (characterId === "cyber") {
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
      }

      // Intelligent voice selector: choose the deepest, natural male voice on the platform
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        if (characterId === "satoshi") {
          // Find natural deep male voices, strictly avoiding high-pitched or female identifiers
          const preferredVoice = voices.find(
            v =>
              v.lang.startsWith("en") &&
              (v.name.includes("Natural") ||
                v.name.includes("Guy") ||
                v.name.includes("Male") ||
                v.name.includes("David") ||
                v.name.includes("Daniel") ||
                v.name.includes("Oliver") ||
                v.name.includes("Google UK English Male") ||
                v.name.includes("Google US English")) &&
              !v.name.includes("Female") &&
              !v.name.includes("Zira") &&
              !v.name.includes("Hazel") &&
              !v.name.includes("Samantha")
          ) || voices.find(v => v.lang.startsWith("en") && !v.name.includes("Female") && !v.name.includes("Zira"));

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        } else {
          const englishVoice = voices.find(v => v.lang.startsWith("en"));
          if (englishVoice) utterance.voice = englishVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error", e);
    }
  }

  // Primary Text-To-Speech pipeline - Voice completely removed for all characters
  public async speakDialogue(_text: string, _characterId: string = "satoshi") {
    // Voice removed for all characters as requested
    return;
  }
}

export const soundEngine = new SoundEngine();
