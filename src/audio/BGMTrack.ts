/**
 * 90s Arcade Oriental / Japanese Battle Chiptune BGM Generator.
 * Inspired by classic Japanese 90s arcade fighters (Samurai Shodown, Street Fighter II E.Honda, Tenchu).
 * Built in a dark Japanese Hirajoshi / Insen minor scale (A, B, C, E, F) with:
 * - Shamisen / Shakuhachi plucked lead synth with dramatic plectrum bite
 * - Cascading traditional Koto arpeggios
 * - Driving Taiko battle bassline
 * - Authentic Taiko drums & Hyoshigi (wooden clappers) percussion
 */

// Note frequency map (Hz) - Focused on A Hirajoshi & Insen Japanese Minor Scales
const NOTE_FREQS: Record<string, number> = {
  // Bass Octaves
  'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'Bb2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
  // Mid & High Lead Octaves
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'Bb5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'F6': 1396.91, 'A6': 1760.00,
  '-': 0, // Rest
};

// Traditional Japanese Hirajoshi Scale pitches in A: [A, B, C, E, F]
const KOTO_NOTES: number[] = [
  NOTE_FREQS['A4'],
  NOTE_FREQS['B4'],
  NOTE_FREQS['C5'],
  NOTE_FREQS['E5'],
  NOTE_FREQS['F5'],
  NOTE_FREQS['A5'],
  NOTE_FREQS['C6'],
];

export class BGMTrack {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;

  // Battle Tempo: 130 BPM (taiko drive)
  private readonly stepDuration: number = (60 / 130) / 4; // 16th note duration (~0.115s)

  // Scheduling state
  private nextStepTime: number = 0;
  private currentStep: number = 0;
  private readonly totalSteps: number = 64; // 4 measures of 16 steps

  // Dark Japanese Hirajoshi Scale Melody (A, B, C, E, F)
  // Striking minor half-step drops (F -> E, C -> B) and soaring fifths/octaves
  private melodyPattern: (string | null)[] = [
    // Measure 1: Dramatic opening battle cry (A5 -> E5 -> F5 -> E5 -> C5 -> B4)
    'A5', null, null, null, 'E5', null, 'F5', null,
    'E5', null, 'C5', null, 'B4', null, 'C5', null,

    // Measure 2: Swift shamisen battle strike climbing to peak
    'A4', null, 'C5', null, 'E5', null, 'F5', null,
    'A5', null, 'F5', null, 'E5', 'F5', 'E5', 'C5',

    // Measure 3: Building tension & dramatic leap to high C6
    'B4', null, 'C5', null, 'E5', null, 'F5', null,
    'E5', null, 'C6', null, 'B5', null, 'A5', null,

    // Measure 4: Fatal resolution descending the Hirajoshi scale to tonic A4
    'F5', null, 'E5', null, 'C5', null, 'B4', null,
    'C5', null, 'B4', null, 'A4', null, null, null,
  ];

  // Deep Driving Taiko & Minor Sumo Bass (i -> VI -> V -> i Japanese Cadence)
  private bassPattern: (string | null)[] = [
    // Measure 1: Deep brooding A pedal with syncopated octaves
    'A2', null, 'A2', null, 'E3', null, 'A2', null,
    'A2', null, 'A2', null, 'C3', null, 'E3', null,

    // Measure 2: Slashing movement through dark F and E
    'F2', null, 'F2', null, 'C3', null, 'F2', null,
    'E2', null, 'E2', null, 'B2', null, 'E3', null,

    // Measure 3: Driving tension on the edges
    'A2', null, 'A2', null, 'E3', null, 'A2', null,
    'F2', null, 'F2', null, 'E2', null, 'E2', null,

    // Measure 4: Dramatic final cadence resolving home
    'D3', null, 'C3', null, 'B2', null, 'C3', null,
    'B2', null, 'F2', null, 'E2', null, 'A2', null,
  ];

  constructor() {}

  public init(ctx: AudioContext): void {
    this.ctx = ctx;
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.14, ctx.currentTime);
    this.bgmGain.connect(ctx.destination);
  }

  public start(): void {
    if (this.isPlaying || !this.ctx) return;
    this.isPlaying = true;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.currentStep = 0;

    // Look-ahead scheduling loop
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
      this.bgmGain.gain.setValueAtTime(muted ? 0 : 0.14, this.ctx.currentTime);
    }
  }

  public duckVolume(duck: boolean): void {
    if (this.bgmGain && this.ctx) {
      const now = this.ctx.currentTime;
      const target = duck ? 0.03 : 0.14;
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

    // 1. Japanese Battle Percussion
    // Taiko Kick on beats 1 and 3 of every measure
    const isTaikoKick = (step % 8 === 0) || (step % 16 === 10);
    // Hyoshigi (Japanese Wooden Clapper) on beats 2 and 4
    const isHyoshigi = (step % 8 === 4);
    // Suzu / Hi-hat ticks on the 16th groove
    const isHiHat = (step % 2 === 0);

    if (isTaikoKick) this.playTaikoKick(time);
    if (isHyoshigi) this.playHyoshigiClack(time);
    if (isHiHat) this.playHiHat(time, step % 4 === 2);

    // 2. Heavy Japanese Battle Bass
    const bassNote = this.bassPattern[step];
    if (bassNote && NOTE_FREQS[bassNote]) {
      this.playBassNote(NOTE_FREQS[bassNote], time, this.stepDuration * 1.8);
    }

    // 3. Shamisen / Shakuhachi Oriental Plucked Lead
    const leadNote = this.melodyPattern[step];
    if (leadNote && NOTE_FREQS[leadNote]) {
      this.playShamisenLead(NOTE_FREQS[leadNote], time, this.stepDuration * 1.7);
    }

    // 4. Koto Arpeggio Layer (Cascading Hirajoshi notes on offbeats)
    if (step % 4 === 1 || step % 4 === 3) {
      const kotoIndex = (step * 3) % KOTO_NOTES.length;
      const kotoFreq = KOTO_NOTES[kotoIndex];
      this.playKotoNote(kotoFreq, time, this.stepDuration * 0.9);
    }
  }

  /**
   * Shamisen / Japanese Synth Lead with sharp plectrum bite and silk-string decay
   */
  private playShamisenLead(freq: number, time: number, duration: number): void {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Pulse / Sawtooth blend for oriental twang
    osc.type = 'sawtooth';

    // Characteristic micro-pitch bend at onset (plectrum strike)
    osc.frequency.setValueAtTime(freq * 1.04, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.022);

    // Lowpass filter envelope for natural silk string resonance
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, time);
    filter.frequency.exponentialRampToValueAtTime(800, time + duration);

    // Percussive attack, sustained body, quick release
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.32, time + 0.012);
    gain.gain.setValueAtTime(0.26, time + duration * 0.65);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration + 0.03);
  }

  /**
   * Koto Silk Arpeggio Note
   */
  private playKotoNote(freq: number, time: number, duration: number): void {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  /**
   * Deep Japanese Battle Bass
   */
  private playBassNote(freq: number, time: number, duration: number): void {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    // Warm low-pass filter so it acts as punchy sub
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, time);

    gain.gain.setValueAtTime(0.42, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  /**
   * Deep Resonant Taiko Kick
   */
  private playTaikoKick(time: number): void {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.12);

    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  /**
   * Hyoshigi (Japanese Wooden Clapper) - Crisp, resonant hollow clack
   */
  private playHyoshigiClack(time: number): void {
    if (!this.ctx || !this.bgmGain) return;

    // 1. Tonal wooden resonance (880 Hz hollow wood block)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, time);
    osc.frequency.exponentialRampToValueAtTime(520, time + 0.04);

    oscGain.gain.setValueAtTime(0.24, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

    osc.connect(oscGain);
    oscGain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.05);

    // 2. Crisp noise impact click
    const bufferSize = this.ctx.sampleRate * 0.035;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, time);
    filter.Q.setValueAtTime(3.0, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.038);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.bgmGain);

    noise.start(time);
    noise.stop(time + 0.04);
  }

  /**
   * Suzu Bell / 90s Hi-Hat tick
   */
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
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(accent ? 0.11 : 0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.022);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    noise.start(time);
    noise.stop(time + 0.025);
  }
}
