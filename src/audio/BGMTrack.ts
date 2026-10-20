/**
 * Multi-Track 90s Cyber-Sumo Arcade Techno Soundtrack.
 * Features 4 distinct electronic tracks spanning different tempos and grooves:
 * - Track 0: "NEO-DOHYO ACID TECHNO" (136 BPM - Driving 90s club/arcade acid techno)
 * - Track 1: "SHINOBI DUB" (110 BPM - Slower, heavy, brooding feudal trip-hop groove)
 * - Track 2: "TOKYO METROPOLIS" (124 BPM - Punchy Yuzo Koshiro style mid-tempo cyber-funk)
 * - Track 3: "FINAL CLIMAX RAVE" (144 BPM - Fast, adrenaline-fueled match point rave)
 */

// Note frequency map (Hz)
const NOTE_FREQS: Record<string, number> = {
  // Deep Sub & Techno Bass Octaves
  'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'Bb2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
  // Mid Synths & Stabs
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'Bb5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'F6': 1396.91,
  '-': 0, // Rest
};

export interface TrackData {
  title: string;
  bpm: number;
  drumStyle: 'techno' | 'dub' | 'electro' | 'rave';
  bassPattern: string[];
  arpPattern: string[];
  chordStabSteps: Set<number>;
  leadAccents: Record<number, { note: string; dur: number }>;
}

const TRACKS: TrackData[] = [
  // -------------------------------------------------------------------------
  // TRACK 0: NEO-DOHYO ACID TECHNO (136 BPM)
  // Driving 4-on-the-floor acid techno with TB-303 squelch & offbeat open hats
  // -------------------------------------------------------------------------
  {
    title: 'NEO-DOHYO ACID (136 BPM)',
    bpm: 136,
    drumStyle: 'techno',
    bassPattern: [
      'A2', 'A2', 'A3', 'A2', 'A2', 'A2', 'C3', 'A2',
      'A2', 'A2', 'A3', 'A2', 'E2', 'E2', 'G2', 'A2',
      'F2', 'F2', 'F3', 'F2', 'F2', 'F2', 'A2', 'F2',
      'F2', 'F2', 'F3', 'F2', 'C3', 'C3', 'E3', 'F2',
      'D2', 'D2', 'D3', 'D2', 'D2', 'D2', 'F2', 'D2',
      'G2', 'G2', 'G3', 'G2', 'B2', 'B2', 'D3', 'G2',
      'E2', 'E2', 'E3', 'E2', 'E2', 'E2', 'G2', 'E2',
      'F2', 'F2', 'E2', 'E2', 'Bb2', 'Bb2', 'A2', 'E2',
    ],
    arpPattern: [
      'A3', 'C4', 'E4', 'A4', 'C4', 'E4', 'A4', 'E4',
      'A3', 'C4', 'E4', 'A4', 'C4', 'E4', 'B4', 'C5',
      'F3', 'A3', 'C4', 'F4', 'A3', 'C4', 'F4', 'C4',
      'F3', 'A3', 'C4', 'F4', 'A3', 'C4', 'E4', 'F4',
      'D3', 'F3', 'A3', 'D4', 'F3', 'A3', 'D4', 'A3',
      'G3', 'B3', 'D4', 'G4', 'B3', 'D4', 'F4', 'G4',
      'E3', 'G3', 'B3', 'E4', 'G3', 'B3', 'E4', 'B3',
      'F3', 'A3', 'C4', 'E4', 'D4', 'C4', 'B3', 'G3',
    ],
    chordStabSteps: new Set([2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 61]),
    leadAccents: {
      0:  { note: 'E5', dur: 1.2 },
      12: { note: 'F5', dur: 0.6 },
      14: { note: 'E5', dur: 0.8 },
      32: { note: 'A5', dur: 1.4 },
      44: { note: 'C6', dur: 0.5 },
      46: { note: 'B5', dur: 0.8 },
      60: { note: 'A4', dur: 0.9 },
    },
  },

  // -------------------------------------------------------------------------
  // TRACK 1: SHINOBI DUB (110 BPM) - Slower, Deep, Brooding Trip-Hop Techno
  // Heavy 808 sub kick, moody oriental koto plucks, and slow cinematic bass
  // -------------------------------------------------------------------------
  {
    title: 'SHINOBI DUB (110 BPM)',
    bpm: 110,
    drumStyle: 'dub',
    bassPattern: [
      'D2', '-', 'D2', '-', 'A2', '-', 'D2', '-',
      'D2', '-', 'F2', '-', 'G2', '-', 'F2', 'E2',
      'Bb2', '-', 'Bb2', '-', 'F2', '-', 'Bb2', '-',
      'A2', '-', 'A2', '-', 'E2', '-', 'A2', '-',
      'G2', '-', 'G2', '-', 'D2', '-', 'G2', '-',
      'A2', '-', 'A2', '-', 'C3', '-', 'B2', '-',
      'Bb2', '-', 'Bb2', '-', 'A2', '-', 'A2', '-',
      'E2', '-', 'F2', '-', 'E2', '-', 'D2', '-',
    ],
    arpPattern: [
      'D4', '-', 'F4', '-', 'A4', '-', 'D5', '-',
      'C5', '-', 'A4', '-', 'F4', '-', 'E4', '-',
      'Bb3', '-', 'D4', '-', 'F4', '-', 'Bb4', '-',
      'A4', '-', 'F4', '-', 'E4', '-', 'D4', '-',
      'G3', '-', 'Bb3', '-', 'D4', '-', 'G4', '-',
      'A4', '-', 'C5', '-', 'B4', '-', 'A4', '-',
      'F4', '-', 'E4', '-', 'D4', '-', 'E4', '-',
      'F4', '-', 'E4', '-', 'D4', '-', '-', '-',
    ],
    chordStabSteps: new Set([4, 12, 20, 28, 36, 44, 52, 60]),
    leadAccents: {
      0:  { note: 'D5', dur: 1.8 },
      16: { note: 'F5', dur: 1.2 },
      32: { note: 'A5', dur: 1.8 },
      48: { note: 'E5', dur: 1.0 },
      56: { note: 'D5', dur: 1.5 },
    },
  },

  // -------------------------------------------------------------------------
  // TRACK 2: TOKYO METROPOLIS (124 BPM) - Mid-tempo Cyber-Funk Techno
  // Punchy syncopated electro beat with slap FM bass & neon synth arps
  // -------------------------------------------------------------------------
  {
    title: 'TOKYO METROPOLIS (124 BPM)',
    bpm: 124,
    drumStyle: 'electro',
    bassPattern: [
      'A2', '-', 'A2', 'C3', '-', 'D3', 'E3', '-',
      'A2', '-', 'A2', 'G2', '-', 'E2', 'G2', 'A2',
      'F2', '-', 'F2', 'A2', '-', 'C3', 'D3', '-',
      'E2', '-', 'E2', 'B2', '-', 'D3', 'E3', '-',
      'D2', '-', 'D2', 'F2', '-', 'A2', 'C3', '-',
      'G2', '-', 'G2', 'B2', '-', 'D3', 'E3', '-',
      'F2', '-', 'F2', 'A2', 'E2', '-', 'E2', 'B2',
      'A2', 'A2', 'C3', 'D3', 'E3', 'D3', 'C3', 'A2',
    ],
    arpPattern: [
      'A3', 'C4', 'E4', 'G4', 'A4', 'G4', 'E4', 'C4',
      'A3', 'C4', 'E4', 'G4', 'A4', 'C5', 'A4', 'E4',
      'F3', 'A3', 'C4', 'E4', 'F4', 'E4', 'C4', 'A3',
      'E3', 'G3', 'B3', 'D4', 'E4', 'G4', 'E4', 'B3',
      'D3', 'F3', 'A3', 'C4', 'D4', 'C4', 'A3', 'F3',
      'G3', 'B3', 'D4', 'F4', 'G4', 'F4', 'D4', 'B3',
      'F3', 'A3', 'C4', 'E4', 'E3', 'G3', 'B3', 'D4',
      'A3', 'C4', 'E4', 'A4', 'B4', 'C5', 'B4', 'A4',
    ],
    chordStabSteps: new Set([3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55, 59, 62]),
    leadAccents: {
      0:  { note: 'A5', dur: 1.0 },
      16: { note: 'C6', dur: 0.8 },
      32: { note: 'G5', dur: 1.2 },
      48: { note: 'E5', dur: 1.4 },
    },
  },

  // -------------------------------------------------------------------------
  // TRACK 3: FINAL CLIMAX RAVE (144 BPM) - Fast, High-Intensity Match Point Rave
  // Hyperspeed 144 BPM rave kick, double-speed rolling acid bass, intense stabs
  // -------------------------------------------------------------------------
  {
    title: 'FINAL CLIMAX RAVE (144 BPM)',
    bpm: 144,
    drumStyle: 'rave',
    bassPattern: [
      'E2', 'E2', 'E3', 'E2', 'E2', 'E2', 'G2', 'E2',
      'E2', 'E2', 'E3', 'E2', 'B2', 'B2', 'D3', 'E2',
      'C2', 'C2', 'C3', 'C2', 'C2', 'C2', 'E2', 'C2',
      'D2', 'D2', 'D3', 'D2', 'A2', 'A2', 'C3', 'D2',
      'E2', 'E2', 'E3', 'E2', 'E2', 'E2', 'G2', 'E2',
      'G2', 'G2', 'G3', 'G2', 'D3', 'D3', 'F3', 'G2',
      'A2', 'A2', 'A3', 'A2', 'F2', 'F2', 'F3', 'F2',
      'E2', 'E2', 'F2', 'F2', 'E2', 'E2', 'B2', 'E2',
    ],
    arpPattern: [
      'E4', 'G4', 'B4', 'E5', 'G4', 'B4', 'E5', 'B4',
      'E4', 'G4', 'B4', 'E5', 'D5', 'B4', 'A4', 'G4',
      'C4', 'E4', 'G4', 'C5', 'E4', 'G4', 'C5', 'G4',
      'D4', 'F4', 'A4', 'D5', 'F4', 'A4', 'D5', 'A4',
      'E4', 'G4', 'B4', 'E5', 'G4', 'B4', 'E5', 'B4',
      'G4', 'B4', 'D5', 'G5', 'B4', 'D5', 'G5', 'D5',
      'A4', 'C5', 'E5', 'A5', 'F4', 'A4', 'C5', 'F5',
      'E4', 'G4', 'B4', 'E5', 'D5', 'C5', 'B4', 'G4',
    ],
    chordStabSteps: new Set([1, 4, 7, 10, 13, 17, 20, 23, 26, 29, 33, 36, 39, 42, 45, 49, 53, 57, 61]),
    leadAccents: {
      0:  { note: 'E5', dur: 0.8 },
      16: { note: 'G5', dur: 0.8 },
      32: { note: 'B5', dur: 1.0 },
      48: { note: 'E6', dur: 1.4 },
    },
  },
];

export class BGMTrack {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;

  // Track management
  private currentTrackIndex: number = 0;
  private currentTrack: TrackData = TRACKS[0];
  private stepDuration: number = (60 / TRACKS[0].bpm) / 4;

  // Scheduling state
  private nextStepTime: number = 0;
  private currentStep: number = 0;
  private readonly totalSteps: number = 64; // 4 measures of 16 steps

  constructor() {}

  public init(ctx: AudioContext): void {
    this.ctx = ctx;
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.14, ctx.currentTime);
    this.bgmGain.connect(ctx.destination);
  }

  public setTrack(index: number): string {
    const safeIndex = ((index % TRACKS.length) + TRACKS.length) % TRACKS.length;
    this.currentTrackIndex = safeIndex;
    this.currentTrack = TRACKS[safeIndex];
    this.stepDuration = (60 / this.currentTrack.bpm) / 4;
    this.currentStep = 0;
    return this.currentTrack.title;
  }

  public setRandomTrack(): string {
    if (TRACKS.length <= 1) return this.currentTrack.title;
    let nextIdx: number;
    do {
      nextIdx = Math.floor(Math.random() * TRACKS.length);
    } while (nextIdx === this.currentTrackIndex);
    return this.setTrack(nextIdx);
  }

  public setRoundTrack(_roundNumber?: number): string {
    // Random non-repeating track on every round
    return this.setRandomTrack();
  }

  public nextTrack(): string {
    return this.setRandomTrack();
  }

  public getCurrentTrackTitle(): string {
    return this.currentTrack.title;
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

    const track = this.currentTrack;

    // 1. Percussion based on Track Style
    if (track.drumStyle === 'techno' || track.drumStyle === 'rave') {
      const isKick = (step % 4 === 0);
      const isOpenHiHat = (step % 4 === 2);
      const isClap = (step % 8 === 4);
      const isClosedHat = (step % 2 === 1);

      if (isKick) this.playKick(time, track.drumStyle === 'rave');
      if (isOpenHiHat) this.playOpenHiHat(time);
      if (isClap) this.playClap(time);
      if (isClosedHat) this.playClosedHat(time);
    } else if (track.drumStyle === 'dub') {
      // Slower dub trip-hop beat: Heavy kick on 0 and 10; snare on 4 and 12
      const isDubKick = (step % 16 === 0) || (step % 16 === 10);
      const isDubSnare = (step % 8 === 4);
      const isDubHat = (step % 2 === 0);

      if (isDubKick) this.playDubKick(time);
      if (isDubSnare) this.playDubSnare(time);
      if (isDubHat) this.playClosedHat(time);
    } else {
      // Electro / Breakbeat
      const isElectroKick = (step % 16 === 0) || (step % 16 === 6) || (step % 16 === 10);
      const isElectroClap = (step % 8 === 4);
      const isElectroHat = (step % 2 === 0);

      if (isElectroKick) this.playKick(time, false);
      if (isElectroClap) this.playClap(time);
      if (isElectroHat) this.playClosedHat(time);
    }

    // 2. Rolling Bassline
    const bassNoteName = track.bassPattern[step];
    if (bassNoteName && NOTE_FREQS[bassNoteName]) {
      const isAccent = (step % 4 === 2) || (step % 8 === 0);
      this.playBass(NOTE_FREQS[bassNoteName], time, this.stepDuration * 0.9, isAccent);
    }

    // 3. Cyber-Arpeggio
    const arpNoteName = track.arpPattern[step];
    if (arpNoteName && NOTE_FREQS[arpNoteName]) {
      this.playArp(NOTE_FREQS[arpNoteName], time, this.stepDuration * 0.85);
    }

    // 4. Techno Chord Stabs
    if (track.chordStabSteps.has(step)) {
      const root = (step < 32) ? 220 : (step < 48 ? 174.61 : 164.81);
      this.playStab(root, time);
    }

    // 5. Atmospheric Spaced Accents
    const lead = track.leadAccents[step];
    if (lead && NOTE_FREQS[lead.note]) {
      this.playAtmosphericLead(NOTE_FREQS[lead.note], time, lead.dur);
    }
  }

  private playKick(time: number, isRave: boolean): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isRave ? 175 : 155, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);

    gain.gain.setValueAtTime(0.65, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.13);
  }

  private playDubKick(time: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.18);

    gain.gain.setValueAtTime(0.72, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.24);
  }

  private playDubSnare(time: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.09);

    oscGain.gain.setValueAtTime(0.25, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.11);

    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.28, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.bgmGain);
    noise.start(time);
    noise.stop(time + 0.12);
  }

  private playOpenHiHat(time: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const bufferSize = this.ctx.sampleRate * 0.09;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

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

  private playClosedHat(time: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const bufferSize = this.ctx.sampleRate * 0.02;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

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

  private playClap(time: number): void {
    if (!this.ctx || !this.bgmGain) return;
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

    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

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

  private playBass(freq: number, time: number, duration: number, isAccent: boolean): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(isAccent ? 4.5 : 2.5, time);
    const cutoff = isAccent ? 1500 : 650;
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.exponentialRampToValueAtTime(170, time + duration);

    const vol = isAccent ? 0.38 : 0.28;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private playArp(freq: number, time: number, duration: number): void {
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

  private playStab(rootFreq: number, time: number): void {
    if (!this.ctx || !this.bgmGain) return;
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

  private playAtmosphericLead(freq: number, time: number, duration: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * 1.02, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.04);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, time);
    filter.frequency.exponentialRampToValueAtTime(700, time + duration);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + duration + 0.03);
  }
}
