/**
 * 90s Arcade Sound Synthesizer using pure Web Audio API.
 * Synthesizes vintage 16-bit sound effects, taiko drums, cute meows, and height-scaled impact bonks.
 */
export class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return !this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Boing / Spring sound for jumping
   */
  public playJump(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.16);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Height-scaled BONK / THWACK!
   * deltaY: difference in height at impact (larger deltaY = heavier thwack & lower punchy bass)
   */
  public playBonk(deltaY: number): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const severity = Math.min(Math.max((deltaY - 10) / 70, 0), 1); // 0 (light) to 1 (massive)

    // 1. Tonal low-end punch
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = severity > 0.4 ? 'sawtooth' : 'triangle';
    const baseFreq = 220 - severity * 90; // Drops from 220Hz down to 130Hz for heavy slams
    osc.frequency.setValueAtTime(baseFreq * 2.2, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.15 + severity * 0.1);

    const volume = 0.3 + severity * 0.35;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + severity * 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25 + severity * 0.15);

    // 2. Noise burst for satisfying 90s arcade "CRUNCH"
    const bufferSize = ctx.sampleRate * (0.08 + severity * 0.12);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800 + severity * 1200, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.1);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3 + severity * 0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + severity * 0.08);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.1 + severity * 0.08);
  }

  /**
   * Ground belly-to-belly shove clash
   */
  public playShove(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Cute synthesized meow / chirp
   */
  public playMeow(pitchMultiplier: number = 1.0): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const startFreq = 480 * pitchMultiplier;
    const peakFreq = 760 * pitchMultiplier;
    const endFreq = 540 * pitchMultiplier;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(peakFreq, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.22);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  /**
   * Taiko Drum (Sumo match intro: DON!)
   */
  public playTaikoDon(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.28);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  /**
   * High rim-shot / Ka!
   */
  public playTaikoKa(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.09);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Ring-out whistle & drop gong
   */
  public playRingOut(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Falling pitch slide
    const slideOsc = ctx.createOscillator();
    const slideGain = ctx.createGain();
    slideOsc.type = 'sawtooth';
    slideOsc.frequency.setValueAtTime(650, now);
    slideOsc.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    slideGain.gain.setValueAtTime(0.25, now);
    slideGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    slideOsc.connect(slideGain);
    slideGain.connect(ctx.destination);
    slideOsc.start(now);
    slideOsc.stop(now + 0.43);

    // Deep splash / gong
    setTimeout(() => {
      this.playTaikoDon();
    }, 280);
  }

  /**
   * 90s Arcade Round Win Fanfare
   */
  public playVictoryFanfare(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]; // C E G C E G
    const timings = [0, 0.1, 0.2, 0.32, 0.44, 0.6];
    const durations = [0.08, 0.08, 0.1, 0.1, 0.12, 0.38];

    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + timings[idx];
      const dur = durations[idx];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + dur + 0.05);
    });
  }
}
