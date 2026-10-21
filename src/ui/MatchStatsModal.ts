import { Cat } from '../entities/Cat';
import { CatRenderer } from '../graphics/CatRenderer';
import { SoundSynthesizer } from '../audio/SoundSynthesizer';

export interface MatchStatsOptions {
  onRematch: () => void;
  onChangeFighters: () => void;
  onMainMenu: () => void;
}

export class MatchStatsModal {
  private modalEl: HTMLElement;
  private sound: SoundSynthesizer;
  private renderer: CatRenderer;
  private options: MatchStatsOptions;

  public isOpen: boolean = false;
  private animFrameId: number | null = null;
  private animTick: number = 0;
  private winnerCat: Cat | null = null;

  private winnerCanvas: HTMLCanvasElement | null = null;
  private winnerNameEl: HTMLElement | null = null;
  private winnerTitleEl: HTMLElement | null = null;
  private mvpBadgeEl: HTMLElement | null = null;

  // Header elements
  private p1HeaderEl: HTMLElement | null = null;
  private p2HeaderEl: HTMLElement | null = null;

  // Stat table cells
  private p1BumpsEl: HTMLElement | null = null;
  private p2BumpsEl: HTMLElement | null = null;
  private p1MegasEl: HTMLElement | null = null;
  private p2MegasEl: HTMLElement | null = null;
  private p1ParriesEl: HTMLElement | null = null;
  private p2ParriesEl: HTMLElement | null = null;
  private p1TurbosEl: HTMLElement | null = null;
  private p2TurbosEl: HTMLElement | null = null;
  private p1TeetersEl: HTMLElement | null = null;
  private p2TeetersEl: HTMLElement | null = null;

  constructor(sound: SoundSynthesizer, renderer: CatRenderer, options: MatchStatsOptions) {
    this.sound = sound;
    this.renderer = renderer;
    this.options = options;

    this.modalEl = document.getElementById('match-stats-modal') as HTMLElement;
    this.initDOM();
    this.initEvents();
  }

  private initDOM(): void {
    if (!this.modalEl) return;
    this.winnerCanvas = document.getElementById('stats-winner-canvas') as HTMLCanvasElement;
    this.winnerNameEl = document.getElementById('stats-winner-name');
    this.winnerTitleEl = document.getElementById('stats-winner-title');
    this.mvpBadgeEl = document.getElementById('stats-mvp-badge');

    this.p1HeaderEl = document.getElementById('stats-p1-header');
    this.p2HeaderEl = document.getElementById('stats-p2-header');

    this.p1BumpsEl = document.getElementById('stats-p1-bumps');
    this.p2BumpsEl = document.getElementById('stats-p2-bumps');
    this.p1MegasEl = document.getElementById('stats-p1-megas');
    this.p2MegasEl = document.getElementById('stats-p2-megas');
    this.p1ParriesEl = document.getElementById('stats-p1-parries');
    this.p2ParriesEl = document.getElementById('stats-p2-parries');
    this.p1TurbosEl = document.getElementById('stats-p1-turbos');
    this.p2TurbosEl = document.getElementById('stats-p2-turbos');
    this.p1TeetersEl = document.getElementById('stats-p1-teeters');
    this.p2TeetersEl = document.getElementById('stats-p2-teeters');
  }

  private initEvents(): void {
    document.getElementById('btn-stats-rematch')?.addEventListener('click', () => {
      this.sound.playTaikoDon();
      this.options.onRematch();
    });

    document.getElementById('btn-stats-select')?.addEventListener('click', () => {
      this.sound.playTaikoDon();
      this.options.onChangeFighters();
    });

    document.getElementById('btn-stats-menu')?.addEventListener('click', () => {
      this.sound.playTaikoDon();
      this.close();
      this.options.onMainMenu();
    });
  }

  public open(winner: Cat, p1: Cat, p2: Cat): void {
    this.winnerCat = winner;
    this.isOpen = true;

    const btnRematch = document.getElementById('btn-stats-rematch');
    if (btnRematch) btnRematch.textContent = '🔄 REMATCH';
    const btnSelect = document.getElementById('btn-stats-select');
    if (btnSelect) btnSelect.textContent = '🐾 FIGHTERS';

    if (this.modalEl) {
      this.modalEl.classList.add('active');
    }

    if (this.winnerNameEl) {
      this.winnerNameEl.textContent = `${winner.name.toUpperCase()} WINS!`;
    }
    if (this.winnerTitleEl) {
      this.winnerTitleEl.textContent = winner.profile.title;
    }

    if (this.p1HeaderEl) {
      this.p1HeaderEl.textContent = `P1: ${p1.name.toUpperCase()}`;
    }
    if (this.p2HeaderEl) {
      this.p2HeaderEl.textContent = `P2: ${p2.name.toUpperCase()}`;
    }

    // Populate stat rows
    if (this.p1BumpsEl) this.p1BumpsEl.textContent = String(p1.combatStats.bumpsLanded);
    if (this.p2BumpsEl) this.p2BumpsEl.textContent = String(p2.combatStats.bumpsLanded);

    if (this.p1MegasEl) this.p1MegasEl.textContent = String(p1.combatStats.megaBonks);
    if (this.p2MegasEl) this.p2MegasEl.textContent = String(p2.combatStats.megaBonks);

    if (this.p1ParriesEl) this.p1ParriesEl.textContent = String(p1.combatStats.parriesSuccessful);
    if (this.p2ParriesEl) this.p2ParriesEl.textContent = String(p2.combatStats.parriesSuccessful);

    if (this.p1TurbosEl) this.p1TurbosEl.textContent = String(p1.combatStats.turboHitsLanded);
    if (this.p2TurbosEl) this.p2TurbosEl.textContent = String(p2.combatStats.turboHitsLanded);

    if (this.p1TeetersEl) this.p1TeetersEl.textContent = String(p1.combatStats.teeterSaves);
    if (this.p2TeetersEl) this.p2TeetersEl.textContent = String(p2.combatStats.teeterSaves);

    // Compute MVP Title for the winner
    if (this.mvpBadgeEl) {
      const stats = winner.combatStats;
      let title = 'TOURNAMENT YOKOZUNA';

      if (stats.parriesSuccessful >= 2) {
        title = '⚡ THE PARRY SENSEI ⚡';
      } else if (stats.megaBonks >= 3) {
        title = '💥 METEOR STOMPER 💥';
      } else if (stats.teeterSaves >= 2) {
        title = '🐾 THE EDGE LORD 🐾';
      } else if (stats.turboHitsLanded >= 2) {
        title = '🔥 DRAGON COMBO MASTER 🔥';
      } else if (winner.breed === 'british_blue') {
        title = '⚖️ UNSTOPPABLE CHONK ⚖️';
      } else if (winner.breed === 'calico_acrobat') {
        title = '🕊️ FEATHERWEIGHT FLYER 🕊️';
      }

      this.mvpBadgeEl.textContent = `🎖️ AWARDED: ${title} 🎖️`;
    }

    this.startAnimationLoop();
  }

  public close(): void {
    this.isOpen = false;
    if (this.modalEl) {
      this.modalEl.classList.remove('active');
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private startAnimationLoop(): void {
    const loop = () => {
      if (!this.isOpen) return;
      this.animTick++;
      this.renderWinnerCanvas();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private renderWinnerCanvas(): void {
    if (!this.winnerCanvas || !this.winnerCat) return;
    const ctx = this.winnerCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, this.winnerCanvas.width, this.winnerCanvas.height);

    // Celebrating bounce
    const bounce = Math.abs(Math.sin(this.animTick * 0.15)) * 8;
    const bottomY = this.winnerCanvas.height - 10 - bounce;

    this.renderer.drawPortrait(
      ctx,
      this.winnerCat.breed,
      this.winnerCanvas.width / 2,
      bottomY,
      1.2,
      1,
      this.animTick
    );
  }
}
