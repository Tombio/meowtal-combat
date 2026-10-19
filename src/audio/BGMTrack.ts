/**
 * 90s Arcade Chiptune BGM Generator.
 * Synthesizes an upbeat, super catchy ("catshy") 16-bit arcade theme
 * featuring lead melody, arpeggios, walking funk bass, and retro drum beat.
 */

// Note frequency map (Hz)
const NOTE_FREQS: Record<string, number> = {
  // Bass Octaves
  'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  // Mid & High Lead Octaves
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
  'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51,
  '-': 0, // Rest
};

export class BGMTrack {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;

  // Tempo: 136 BPM
  private readonly stepDuration: number = (60 / 136) / 4; // duration of a 16th note (~0.11s)

  // Scheduling state
  private nextStepTime: number = 0;
  private currentStep: number = 0;
  private readonly totalSteps: number = 64; // 4 measures of 16 steps

  // Melody pattern (64 steps)
  private melodyPattern: (string | null)[] = [
    // Measure 1: Catchy opening hook
    'E5', null, 'E5', null, 'G5', null, 'A5', null,
    null, 'A5', null, 'G5', 'E5', null, 'D5', null,
    // Measure 2: The bouncy cat dance
    'C5', null, 'D5', null, 'E5', null, 'G5', null,
    'E5', null, 'D5', null, 'C5', null, 'A4', null,
    // Measure 3: Joyful ascending playful meow trill
    'E5', null, 'G5', null, 'A5', null, 'C6', null,
    'B5', null, 'A5', null, 'G5', 'A5', 'G5', 'E5',
    // Measure 4: Arcade turnaround resolution
    'D5', null, 'E5', null, 'G5', null, 'A5', null,
    'G5', null, 'E5', null, 'D5', 'C5', 'A4', null,
  ];

  // Bassline pattern (syncopated 8th notes, 32 notes over 64 16th steps)
  private bassPattern: (string | null)[] = [
    // Measure 1
    'A2', null, 'A2', null, 'C3', null, 'C3', null,
    'D3', null, 'D3', null, 'E3', null, 'G2', null,
    // Measure 2
    'A2', null, 'A2', null, 'C3', null, 'D3', null,
    'E3', null, 'G3', null, 'E3', null, 'D3', null,
    // Measure 3
    'F2', null, 'F2', null, 'A2', null, 'C3', null,
    'G2', null, 'G2', null, 'B2', null, 'D3', null,
    // Measure 4
    'A2', null, 'A2', null, 'E3', null, 'D3', null,
    'C3', null, 'B2', null, 'A2', null, 'E2', null,
  ];

  constructor() {}

  public init(ctx: AudioContext): void {
    this.ctx = ctx;
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.13, ctx.currentTime);
    this.bgmGain.connect(ctx.destination);
  }

  public start(): void {
    if (this.isPlaying || !this.ctx) return;
    this.isPlaying = true;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.currentStep = 0;

    // Scheduler loop runs every 25ms to look ahead and schedule notes
    this.timerId = window.setInterval(() => this.scheduler(), 25);
  }

  public stop(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public setMuted(muted: boolean): void {
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(muted ? 0 : 0.13, this.ctx.currentTime);
    }
  }

  public duckVolume(duck: boolean): void {
    if (this.bgmGain && this.ctx) {
      const now = this.ctx.currentTime;
      const target = duck ? 0.03 : 0.13;
      this.bgmGain.gain.linearRampToValueAtTime(target, now + 0.15);
    }
  }

  private scheduler(): void {
    if (!this.ctx || !this.isPlaying) return;

    // Schedule 100ms in advance
    while (this.nextStepTime < this.ctx.currentTime + 0.1) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += this.stepDuration;
      this.currentStep = (this.currentStep + 1) % this.totalSteps;
    }
  }

  private scheduleStep(step: number, time: number): void {
    if (!this.ctx || !this.bgmGain) return;

    // 1. Drum Beat
    // Kick on step 0, 8, 16, 24, 32, 40, 48, 56 (beats 1 and 3 of every measure) + syncopations
    const isKick = (step % 8 === 0) || (step % 16 === 10);
    // Snare on step 4, 12, 20, 28, etc. (beats 2 and 4)
    const isSnare = (step % 8 === 4);
    // Closed hi-hat on even 16th steps
    const isHiHat = (step % 2 === 0);

    if (isKick) this.playKick(time);
    if (isSnare) this.playSnare(time);
    if (isHiHat) this.playHiHat(time, step % 4 === 2);

    // 2. Bassline
    const bassNote = this.bassPattern[step];
    if (bassNote && NOTE_FREQS[bassNote]) {
      this.playBassNote(NOTE_FREQS[bassNote], time, this.stepDuration * 1.8);
    }

    // 3. Lead Melody
    const leadNote = this.melodyPattern[step];
    if (leadNote && NOTE_FREQS[leadNote]) {
      this.playLeadNote(NOTE_FREQS[leadNote], time, this.stepDuration * 1.6);
    }

    // 4. Arpeggiated Sparkle (Subtle cute 16-bit accompaniment on high register)
    if (step % 4 === 1 || step % 4 === 3) {
      const chordRoot = (step < 32) ? 440 : (step < 48 ? 349.23 : 440);
      const arpFreq = chordRoot * (step % 2 === 0 ? 1.5 : 2.0);
      this.playArpChirp(arpFreq, time, this.stepDuration * 0.8);
    }
  }

  private playLeadNote(freq: number, time: number, duration: number): void {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pulse/Square wave with slight warmth
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    // Quick attack and snappy chiptune decay
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.35, time + 0.015);
    gain.gain.setValueAtTime(0.30, time + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private playBassNote(freq: number, time: number, duration: number): void {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Punchy triangle bass
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private playArpChirp(freq: number, time: number, duration: number): void {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  private playKick(time: number): void {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.09);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + 0.11);
  }

  private playSnare(time: number): void {
    if (!this.ctx || !this.bgmGain) return;

    const bufferSize = this.ctx.sampleRate * 0.06;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    noise.start(time);
    noise.stop(time + 0.08);
  }

  private playHiHat(time: number, accent: boolean): void {
    if (!this.ctx || !this.bgmGain) return;

    const bufferSize = this.ctx.sampleRate * 0.02;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(accent ? 0.12 : 0.06, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    noise.start(time);
    noise.stop(time + 0.03);
  }
}
