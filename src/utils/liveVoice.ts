// Real-time voice interaction with gemini-3.8-live via WebSocket

export function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return output.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export class LiveVoiceSession {
  private ws: WebSocket | null = null;
  private inputCtx: AudioContext | null = null;
  private outputCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private isConnected: boolean = false;
  private scheduledTime: number = 0;
  private onStatusChange?: (status: "connecting" | "connected" | "speaking" | "listening" | "disconnected", err?: string) => void;
  private onAudioLevel?: (level: number) => void;

  constructor(callbacks?: {
    onStatusChange?: (status: "connecting" | "connected" | "speaking" | "listening" | "disconnected", err?: string) => void;
    onAudioLevel?: (level: number) => void;
  }) {
    this.onStatusChange = callbacks?.onStatusChange;
    this.onAudioLevel = callbacks?.onAudioLevel;
  }

  async start(): Promise<void> {
    this.onStatusChange?.("connecting");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/live`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        this.isConnected = true;
        this.onStatusChange?.("connected");
        await this.initAudioCapture();
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            console.warn("Live API message error:", data.error);
            this.onStatusChange?.("disconnected", data.error);
            return;
          }
          if (data.audio) {
            this.onStatusChange?.("speaking");
            await this.playAudioChunk(data.audio);
          }
          if (data.interrupted) {
            this.stopPlayback();
            this.onStatusChange?.("listening");
          }
        } catch (e) {
          console.warn("Live WS message decode error:", e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("Live WebSocket error:", err);
        this.onStatusChange?.("disconnected", "WebSocket connection error");
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.onStatusChange?.("disconnected");
        this.cleanup();
      };
    } catch (err: any) {
      this.onStatusChange?.("disconnected", err.message || "Failed to initialize microphone or connection");
      this.cleanup();
    }
  }

  private async initAudioCapture() {
    try {
      this.inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      this.outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
      this.scheduledTime = this.outputCtx.currentTime;

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const source = this.inputCtx.createMediaStreamSource(this.mediaStream);
      this.processor = this.inputCtx.createScriptProcessor(4096, 1, 1);
      source.connect(this.processor);
      this.processor.connect(this.inputCtx.destination);

      this.processor.onaudioprocess = (e) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const channelData = e.inputBuffer.getChannelData(0);

        // Compute volume level for UI visualizer
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);
        this.onAudioLevel?.(Math.min(1, rms * 5));

        const pcmBuffer = floatTo16BitPCM(channelData);
        const base64Audio = arrayBufferToBase64(pcmBuffer);
        this.ws.send(JSON.stringify({ audio: base64Audio }));
      };

      this.onStatusChange?.("listening");
    } catch (err: any) {
      console.warn("Audio input capture setup failed:", err);
      this.onStatusChange?.("disconnected", "Microphone access denied or unavailable");
    }
  }

  private async playAudioChunk(base64Audio: string) {
    if (!this.outputCtx) return;
    try {
      const buffer = base64ToArrayBuffer(base64Audio);
      const int16Array = new Int16Array(buffer);
      const float32 = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32[i] = int16Array[i] / 32768;
      }

      const audioBuffer = this.outputCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      const source = this.outputCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputCtx.destination);

      const now = this.outputCtx.currentTime;
      if (this.scheduledTime < now) {
        this.scheduledTime = now;
      }
      source.start(this.scheduledTime);
      this.scheduledTime += audioBuffer.duration;
    } catch (e) {
      console.warn("Error decoding audio chunk:", e);
    }
  }

  private stopPlayback() {
    if (this.outputCtx) {
      this.scheduledTime = this.outputCtx.currentTime;
    }
  }

  stop() {
    this.cleanup();
    this.onStatusChange?.("disconnected");
  }

  private cleanup() {
    if (this.processor) {
      try { this.processor.disconnect(); } catch (_) {}
      this.processor = null;
    }
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach(t => t.stop());
      } catch (_) {}
      this.mediaStream = null;
    }
    if (this.inputCtx && this.inputCtx.state !== "closed") {
      try { this.inputCtx.close(); } catch (_) {}
      this.inputCtx = null;
    }
    if (this.outputCtx && this.outputCtx.state !== "closed") {
      try { this.outputCtx.close(); } catch (_) {}
      this.outputCtx = null;
    }
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }
    this.isConnected = false;
  }
}
