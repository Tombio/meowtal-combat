/**
 * 90s Cyber-Sumo Arcade Techno BGM Generator.
 * Inspired by 90s Japanese arcade techno (Streets of Rage 2, Tekken, Ridge Racer, Wipeout).
 * Features:
 * - Driving 4-on-the-floor 90s techno kick drum and offbeat open hi-hats
 * - Rolling 16th-note acid/cyber bassline (TB-303 style resonant filter pulse)
 * - Dark, moody oriental techno chord stabs on syncopated upbeats
 * - Hypnotic cyber-arpeggiator in A Hirajoshi / Insen minor (no repetitive nursery hook)
 * - Atmospheric, spaced feudal-cyberpunk lead accents
 */

// Note frequency map (Hz)
const NOTE_FREQS: Record<string, number> = {
  // Deep Sub & Techno Bass Octaves
  'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'Bb2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
  // Mid Synths & Stabs
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'Bb5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'E6': 1318.51,
  '-': 0, // Rest
};

// Hypnotic 16th-note Oriental Cyber-Arp pattern (64 steps)
// Smooth, atmospheric rolling arpeggio instead of a sing-song repeating hook
const CYBER_ARP_STEPS: string[] = [
  // Bar 1: A minor dark cyber pulse
  'A3', 'C4', 'E4', 'A4', 'C4', 'E4', 'A4', 'E4',
  'A3', 'C4', 'E4', 'A4', 'C4', 'E4', 'B4', 'C5',
  // Bar 2: F minor tension
  'F3', 'A3', 'C4', 'F4', 'A3', 'C4', 'F4', 'C4',
  'F3', 'A3', 'C4', 'F4', 'A3', 'C4', 'E4', 'F4',
  // Bar 3: D minor into G oriental lift
  'D3', 'F3', 'A3', 'D4', 'F3', 'A3', 'D4', 'A3',
  'G3', 'B3', 'D4', 'G4', 'B3', 'D4', 'F4', 'G4',
  // Bar 4: E dark Japanese turnaround
  'E3', 'G3', 'B3', 'E4', 'G3', 'B3', 'E4', 'B3',
  'F3', 'A3', 'C4', 'E4', 'D4', 'C4', 'B3', 'G3',
];

export class BGMTrack {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;

  // Driving 90s Arcade Techno Tempo: 136 BPM
  private readonly stepDuration: number = (60 / 136) / 4; // 16th note (~0.110s)

  // Scheduling state
  private nextStepTime: number = 0;
  private currentStep: number = 0;
  private readonly totalSteps: number = 64; // 4 measures of 16 steps

  // Rolling 16th-note Acid/Techno Bassline (Pumping TB-303 energy)
  private bassPattern: string[] = [
    // Bar 1: Driving A minor acid pump
    'A2', 'A2', 'A3', 'A2', 'A2', 'A2', 'C3', 'A2',
    'A2', 'A2', 'A3', 'A2', 'E2', 'E2', 'G2', 'A2',
    // Bar 2: Heavy F tension pump
    'F2', 'F2', 'F3', 'F2', 'F2', 'F2', 'A2', 'F2',
    'F2', 'F2', 'F3', 'F2', 'C3', 'C3', 'E3', 'F2',
    // Bar 3: D minor to G progression
    'D2', 'D2', 'D3', 'D2', 'D2', 'D2', 'F2', 'D2',
    'G2', 'G2', 'G3', 'G2', 'B2', 'B2', 'D3', 'G2',
    // Bar 4: Dark Japanese E/F cadence
    'E2', 'E2', 'E3', 'E2', 'E2', 'E2', 'G2', 'E2',
    'F2', 'F2', 'E2', 'E2', 'Bb2', 'Bb2', 'A2', 'E2',
  ];

  // Techno Chord Stabs (Syncopated rave hits on upbeats)
  // Step indices where chord stabs trigger
  private chordStabSteps: Set<number> = new Set([
    2, 6, 10, 14,       // Bar 1 offbeats
    18, 22, 26, 30,     // Bar 2 offbeats
    34, 38, 42, 46,     // Bar 3 offbeats
    50, 54, 58, 61      // Bar 4 turnaround hits
  ]);

  // Spaced, haunting atmospheric lead accents (Sparse & atmospheric, not a repetitive verse!)
  private leadAccents: Record<number, { note: string; dur: number }> = {
    0:  { note: 'E5', dur: 1.2 }, // Sustained opening tone
    12: { note: 'F5', dur: 0.6 },
    14: { note: 'E5', dur: 0.8 },
    32: { note: 'A5', dur: 1.4 }, // High atmospheric cry
    44: { note: 'C6', dur: 0.5 },
    46: { note: 'B5', dur: 0.8 },
    60: { note: 'A4', dur: 0.9 }, // Turnaround resolution
  };

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

    // Look-ahead scheduling loop runs every 25ms
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

    // 1. 90s Arcade Techno Percussion
    // Four-on-the-floor Kick drum: every 4 steps (beat 1, 2, 3, 4)
    const isKick = (step % 4 === 0);
    // 90s Offbeat Open Hi-Hat: steps 2, 6, 10, 14, 18, 22, 26, 30 (the "&" of every beat)
    const isOpenHiHat = (step % 4 === 2);
    // Rave Snare/Clap on beats 2 and 4 (steps 4, 12, 20, 28, etc.)
    const isClap = (step % 8 === 4);
    // Closed hi-hats on 16th groove
    const isClosedHat = (step % 2 === 1);

    if (isKick) this.playTechnoKick(time);
    if (isOpenHiHat) this.playOpenHiHat(time);
    if (isClap) this.playRaveClap(time);
    if (isClosedHat) this.playClosedHat(time);

    // 2. Rolling Acid / Cyber Bassline (Every 16th step has a driving pulse!)
    const bassNoteName = this.bassPattern[step];
    if (bassNoteName && NOTE_FREQS[bassNoteName]) {
      const isAccent = (step % 4 === 2) || (step % 8 === 0);
      this.playAcidBass(NOTE_FREQS[bassNoteName], time, this.stepDuration * 0.9, isAccent);
    }

    // 3. Hypnotic Oriental Cyber-Arpeggio (Runs continuously, creating the techno groove)
    const arpNoteName = CYBER_ARP_STEPS[step];
    if (arpNoteName && NOTE_FREQS[arpNoteName]) {
      this.playCyberArp(NOTE_FREQS[arpNoteName], time, this.stepDuration * 0.85);
    }

    // 4. Techno Chord Stabs (Punchy syncopated hits on offbeats)
    if (this.chordStabSteps.has(step)) {
      const root = (step < 32) ? 220 : (step < 48 ? 174.61 : 164.81); // A -> F -> E
      this.playTechnoStab(root, time);
    }

    // 5. Spaced Atmospheric Asian Accents (Sparse, moody, not a repetitive verse!)
    const lead = this.leadAccents[step];
    if (lead && NOTE_FREQS[lead.note]) {
      this.playAtmosphericLead(NOTE_FREQS[lead.note], time, lead.dur);
    }
  }

  /**
   * Punchy 90s 4-on-the-Floor Techno Kick Drum
   */
  private playTechnoKick(time: number): void {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Rapid pitch drop gives that classic 90s punchy transient
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);

    gain.gain.setValueAtTime(0.65, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + 0.13);
  }

  /**
   * Classic 90s Offbeat Open Hi-Hat (the signature techno groove!)
   */
  private playOpenHiHat(time: number): void {
    if (!this.ctx || !this.bgmGain) return;

    const bufferSize = this.ctx.sampleRate * 0.09;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.085);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    noise.start(time);
    noise.stop(time + 0.09);
  }

  /**
   * Crisp 16th Closed Hat
   */
  private playClosedHat(time: number): void {
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
    filter.frequency.setValueAtTime(8000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    noise.start(time);
    noise.stop(time + 0.025);
  }

  /**
   * 90s Rave Clap / Snare
   */
  private playRaveClap(time: number): void {
    if (!this.ctx || !this.bgmGain) return;

    // Body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(110, time + 0.06);

    oscGain.gain.setValueAtTime(0.2, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    osc.connect(oscGain);
    oscGain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.08);

    // Crack
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.Q.setValueAtTime(2.2, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.32, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.bgmGain);

    noise.start(time);
    noise.stop(time + 0.085);
  }

  /**
   * Rolling 16th-note TB-303 Acid Bassline with snappy filter cutoff
   */
  private playAcidBass(freq: number, time: number, duration: number, isAccent: boolean): void {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    // Resonant lowpass filter envelope (the acid squelch)
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(isAccent ? 5.0 : 2.5, time);
    const cutoffStart = isAccent ? 1600 : 700;
    filter.frequency.setValueAtTime(cutoffStart, time);
    filter.frequency.exponentialRampToValueAtTime(180, time + duration);

    const vol = isAccent ? 0.38 : 0.28;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  /**
   * Hypnotic Cyber-Arp (Fast, rolling oriental sequence)
   */
  private playCyberArp(freq: number, time: number, duration: number): void {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, time);
    filter.Q.setValueAtTime(2.0, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.10, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  /**
   * 90s Rave Techno Minor Chord Stabs (on syncopated offbeats)
   */
  private playTechnoStab(rootFreq: number, time: number): void {
    if (!this.ctx || !this.bgmGain) return;

    // Minor triad: root, minor 3rd (1.189), 5th (1.498)
    const freqs = [rootFreq * 2, rootFreq * 2 * 1.189, rootFreq * 2 * 1.498];
    const dur = 0.07;

    freqs.forEach((f) => {
      if (!this.ctx || !this.bgmGain) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, time);
      filter.frequency.exponentialRampToValueAtTime(800, time + dur);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(time);
      osc.stop(time + dur + 0.02);
    });
  }

  /**
   * Spaced Atmospheric Asian Synth Tone (Rare, dramatic accents, NOT a repeating verse)
   */
  private playAtmosphericLead(freq: number, time: number, duration: number): void {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Subtle oriental pitch dip at onset
    osc.frequency.setValueAtTime(freq * 1.02, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.04);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, time);
    filter.frequency.exponentialRampToValueAtTime(700, time + duration);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.20, time + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration + 0.03);
  }
}
