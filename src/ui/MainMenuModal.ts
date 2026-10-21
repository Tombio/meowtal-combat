import { CPUDifficulty } from '../engine/CPUController';
import { StageSelection } from '../entities/Arena';
import { SoundSynthesizer } from '../audio/SoundSynthesizer';

export interface MainMenuOptions {
  onSelectMode: (mode: 'cpu' | 'local', diff: CPUDifficulty) => void;
  onOpenOnline: () => void;
  onChangeDifficulty?: (diff: CPUDifficulty) => void;
  onSelectStage: (stage: StageSelection) => void;
  onToggleCRT: () => boolean;
  onToggleSFX: () => boolean;
  onToggleBGM: () => boolean;
  onNextTrack: () => string;
  onOpenKeyConfig: () => void;
  onResume: () => void;
}

export class MainMenuModal {
  private modalEl: HTMLElement;
  private sound: SoundSynthesizer;
  private options: MainMenuOptions;

  // State
  public currentMode: 'cpu' | 'local' = 'cpu';
  public currentDiff: CPUDifficulty = 'normal';
  public currentStageSelection: StageSelection = 'random';
  public selectedNavIndex: number = 0; // 0: cpu, 1: local, 2: online, 3: stage
  private crtEnabled: boolean = true;
  private isHowToPlayOpen: boolean = false;
  private openedAt: number = 0;

  private diffList: CPUDifficulty[] = ['easy', 'normal', 'hard'];
  private stageList: StageSelection[] = ['random', 'dojo', 'cyberpunk', 'thunder'];
  private navRows: HTMLElement[] = [];

  // DOM Elements
  private diffLabel: HTMLElement;
  private stageLabel: HTMLElement;
  private crtBtn: HTMLElement;
  private sfxBtn: HTMLElement;
  private bgmBtn: HTMLElement;
  private trackBtn: HTMLElement;
  private howToPlayPanel: HTMLElement;

  constructor(sound: SoundSynthesizer, options: MainMenuOptions) {
    this.sound = sound;
    this.options = options;

    this.modalEl = document.getElementById('main-menu-modal') as HTMLElement;
    this.diffLabel = document.getElementById('menu-diff-label') as HTMLElement;
    this.stageLabel = document.getElementById('menu-stage-label') as HTMLElement;
    this.crtBtn = document.getElementById('menu-btn-crt') as HTMLElement;
    this.sfxBtn = document.getElementById('menu-btn-sfx') as HTMLElement;
    this.bgmBtn = document.getElementById('menu-btn-bgm') as HTMLElement;
    this.trackBtn = document.getElementById('menu-btn-track') as HTMLElement;
    this.howToPlayPanel = document.getElementById('how-to-play-panel') as HTMLElement;

    const rowCpu = document.getElementById('menu-row-cpu');
    const rowLocal = document.getElementById('menu-row-local');
    const rowOnline = document.getElementById('menu-row-online');
    const rowStage = document.getElementById('menu-row-stage');
    this.navRows = [rowCpu, rowLocal, rowOnline, rowStage].filter(Boolean) as HTMLElement[];

    this.initEvents();
    this.updateDisplay();
  }

  private initEvents(): void {
    // Mouse hover selection tracking
    this.navRows.forEach((row, idx) => {
      row.addEventListener('mouseenter', () => {
        this.selectedNavIndex = idx;
        this.updateNavHighlight();
      });
    });

    // Difficulty Previous / Next
    document.getElementById('menu-btn-diff-prev')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cycleDiff(-1);
    });
    document.getElementById('menu-btn-diff-next')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cycleDiff(1);
    });

    // Stage Previous / Next
    document.getElementById('menu-btn-stage-prev')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cycleStage(-1);
    });
    document.getElementById('menu-btn-stage-next')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cycleStage(1);
    });

    // 1P VS CPU start
    document.getElementById('menu-row-cpu')?.addEventListener('click', () => {
      this.selectCpuMode();
    });

    // 2P LOCAL start
    document.getElementById('menu-row-local')?.addEventListener('click', () => {
      this.selectLocalMode();
    });

    // ONLINE DUEL
    document.getElementById('menu-row-online')?.addEventListener('click', () => {
      this.selectOnlineMode();
    });

    // HOW TO PLAY toggle
    document.getElementById('menu-row-howto')?.addEventListener('click', () => {
      this.isHowToPlayOpen = !this.isHowToPlayOpen;
      this.sound.playTaikoKa();
      if (this.howToPlayPanel) {
        this.howToPlayPanel.style.display = this.isHowToPlayOpen ? 'block' : 'none';
      }
    });

    // Audio & CRT Quick Toggles
    this.crtBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.crtEnabled = this.options.onToggleCRT();
      this.updateDisplay();
    });

    this.sfxBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.options.onToggleSFX();
      this.updateDisplay();
    });

    this.bgmBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.options.onToggleBGM();
      this.updateDisplay();
    });

    this.trackBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.options.onNextTrack();
      this.updateDisplay();
    });

    // Resume & Keys buttons
    document.getElementById('menu-resume-btn')?.addEventListener('click', () => {
      this.close();
    });

    document.getElementById('menu-keys-btn')?.addEventListener('click', () => {
      this.close();
      this.options.onOpenKeyConfig();
    });

    // Keyboard navigation inside Main Menu
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;

      const code = e.code;
      if (code === 'Escape') {
        this.close();
        return;
      }

      // Arrow Up / W
      if (code === 'ArrowUp' || code === 'KeyW') {
        e.preventDefault();
        this.selectedNavIndex = (this.selectedNavIndex - 1 + this.navRows.length) % this.navRows.length;
        this.sound.playTaikoKa();
        this.updateNavHighlight();
        return;
      }

      // Arrow Down / S
      if (code === 'ArrowDown' || code === 'KeyS') {
        e.preventDefault();
        this.selectedNavIndex = (this.selectedNavIndex + 1) % this.navRows.length;
        this.sound.playTaikoKa();
        this.updateNavHighlight();
        return;
      }

      // Arrow Left / A
      if (code === 'ArrowLeft' || code === 'KeyA') {
        if (this.selectedNavIndex === 0) {
          e.preventDefault();
          this.cycleDiff(-1);
        } else if (this.selectedNavIndex === 3) {
          e.preventDefault();
          this.cycleStage(-1);
        }
        return;
      }

      // Arrow Right / D
      if (code === 'ArrowRight' || code === 'KeyD') {
        if (this.selectedNavIndex === 0) {
          e.preventDefault();
          this.cycleDiff(1);
        } else if (this.selectedNavIndex === 3) {
          e.preventDefault();
          this.cycleStage(1);
        }
        return;
      }

      // Space or Enter selection
      if (code === 'Space' || code === 'Enter') {
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        if (now - this.openedAt < 250) {
          // Debounce against keydown bleeding from Title screen
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        if (this.selectedNavIndex === 0) {
          this.selectCpuMode();
        } else if (this.selectedNavIndex === 1) {
          this.selectLocalMode();
        } else if (this.selectedNavIndex === 2) {
          this.selectOnlineMode();
        } else if (this.selectedNavIndex === 3) {
          this.cycleStage(1);
        }
      }
    });
  }

  public selectCpuMode(): void {
    this.currentMode = 'cpu';
    this.sound.playTaikoDon();
    this.close();
    this.options.onSelectMode('cpu', this.currentDiff);
  }

  public selectLocalMode(): void {
    this.currentMode = 'local';
    this.sound.playTaikoDon();
    this.close();
    this.options.onSelectMode('local', this.currentDiff);
  }

  public selectOnlineMode(): void {
    this.sound.playTaikoDon();
    this.close();
    this.options.onOpenOnline();
  }

  private cycleDiff(delta: number): void {
    const idx = this.diffList.indexOf(this.currentDiff);
    const nextIdx = (idx + delta + this.diffList.length) % this.diffList.length;
    this.currentDiff = this.diffList[nextIdx];
    this.sound.playTaikoKa();
    this.options.onChangeDifficulty?.(this.currentDiff);
    this.updateDisplay();
  }

  private cycleStage(delta: number): void {
    const idx = this.stageList.indexOf(this.currentStageSelection);
    const nextIdx = (idx + delta + this.stageList.length) % this.stageList.length;
    this.currentStageSelection = this.stageList[nextIdx];
    this.sound.playTaikoKa();
    this.options.onSelectStage(this.currentStageSelection);
    this.updateDisplay();
  }

  public updateDisplay(): void {
    if (this.diffLabel) {
      this.diffLabel.textContent = this.currentDiff.toUpperCase();
    }
    if (this.stageLabel) {
      switch (this.currentStageSelection) {
        case 'random': this.stageLabel.textContent = '🎲 RANDOM'; break;
        case 'dojo': this.stageLabel.textContent = 'DOJO'; break;
        case 'cyberpunk': this.stageLabel.textContent = 'CYBERPUNK'; break;
        case 'thunder': this.stageLabel.textContent = 'THUNDER'; break;
      }
    }
    if (this.crtBtn) {
      this.crtBtn.textContent = this.crtEnabled ? 'CRT: ON' : 'CRT: OFF';
    }
    if (this.sfxBtn) {
      this.sfxBtn.textContent = this.sound.getMuted() ? 'SFX: OFF' : 'SFX: ON';
    }
    if (this.bgmBtn) {
      this.bgmBtn.textContent = 'BGM: ON';
    }
  }

  public updateNavHighlight(): void {
    this.navRows.forEach((row, idx) => {
      row.classList.toggle('active-nav', idx === this.selectedNavIndex);
    });
  }

  public open(): void {
    this.openedAt = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    this.selectedNavIndex = 0;
    this.updateDisplay();
    this.updateNavHighlight();
    this.modalEl?.classList.add('active');
  }

  public close(): void {
    this.modalEl?.classList.remove('active');
    this.options.onResume();
  }

  public isOpen(): boolean {
    return !!this.modalEl?.classList.contains('active');
  }

  public toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }
}
