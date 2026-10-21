import { CatBreed, FIGHTER_PROFILES } from '../entities/Cat';
import { SoundSynthesizer } from '../audio/SoundSynthesizer';
import { CatRenderer } from '../graphics/CatRenderer';

export interface CharacterSelectOptions {
  onStartMatch: (p1Breed: CatBreed, p2Breed: CatBreed) => void;
  onBack: () => void;
  onBreedChanged?: (role: 'p1' | 'p2', breed: CatBreed) => void;
}

export class CharacterSelectModal {
  private modalEl: HTMLElement;
  private sound: SoundSynthesizer;
  private renderer: CatRenderer;
  private options: CharacterSelectOptions;

  public isOpen: boolean = false;
  public gameMode: 'cpu' | 'local' | 'online' = 'cpu';
  public isOnlineGuest: boolean = false;
  public selectionTarget: 'p1' | 'p2' = 'p1';
  private openedAt: number = 0;

  public breeds: CatBreed[] = ['ginger_tabby', 'black_tuxedo', 'british_blue', 'calico_acrobat'];
  public p1Index: number = 0;
  public p2Index: number = 1;
  public p1Ready: boolean = false;
  public p2Ready: boolean = false;

  private modeTagEl: HTMLElement | null = null;
  private fightBtnEl: HTMLElement | null = null;
  private targetP1Btn: HTMLElement | null = null;
  private targetP2Btn: HTMLElement | null = null;
  private hintEl: HTMLElement | null = null;
  private cards: HTMLElement[] = [];
  private animFrameId: number | null = null;
  private animTick: number = 0;

  constructor(
    sound: SoundSynthesizer,
    renderer: CatRenderer,
    options: CharacterSelectOptions
  ) {
    this.sound = sound;
    this.renderer = renderer;
    this.options = options;

    this.modalEl = document.getElementById('char-select-modal') as HTMLElement;
    this.modeTagEl = document.getElementById('char-select-mode-tag');
    this.fightBtnEl = document.getElementById('btn-char-select-fight');

    this.initDOM();
    this.initEvents();
  }

  private initDOM(): void {
    if (!this.modalEl) return;
    this.cards = Array.from(this.modalEl.querySelectorAll('.fighter-card')) as HTMLElement[];
    this.targetP1Btn = document.getElementById('btn-target-p1');
    this.targetP2Btn = document.getElementById('btn-target-p2');
    this.hintEl = document.getElementById('char-select-nav-hint');
  }

  private initEvents(): void {
    // Target button clicks for selecting P1 vs P2 / CPU
    this.targetP1Btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.gameMode === 'online' && this.isOnlineGuest) return;
      this.selectionTarget = 'p1';
      this.sound.playTaikoKa();
      this.updateCardDisplays();
    });

    this.targetP2Btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.gameMode === 'online' && !this.isOnlineGuest) return;
      this.selectionTarget = 'p2';
      this.sound.playTaikoKa();
      this.updateCardDisplays();
    });

    // Click / touch to select fighter cards
    this.cards.forEach((card, idx) => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.gameMode === 'online') {
          if (this.isOnlineGuest) {
            this.setP2Index(idx);
          } else {
            this.setP1Index(idx);
          }
        } else if (this.gameMode === 'local' || this.gameMode === 'cpu') {
          if (this.selectionTarget === 'p2') {
            this.setP2Index(idx);
          } else {
            this.setP1Index(idx);
          }
        }
      });

      card.querySelector('.tag-p1')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.gameMode === 'online' && this.isOnlineGuest) return;
        this.selectionTarget = 'p1';
        this.setP1Index(idx);
      });

      card.querySelector('.tag-p2')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.gameMode === 'online' && !this.isOnlineGuest) return;
        this.selectionTarget = 'p2';
        this.setP2Index(idx);
      });
    });

    this.fightBtnEl?.addEventListener('click', () => {
      if (this.isOnlineGuest) return;
      this.sound.playTaikoDon();
      this.confirmStart();
    });

    document.getElementById('btn-char-select-back')?.addEventListener('click', () => {
      this.close();
      this.options.onBack();
    });

    // Keyboard navigation listener while modal is active
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      const code = e.code;
      // Escape closes
      if (code === 'Escape') {
        this.close();
        this.options.onBack();
        return;
      }

      // Enter or Space confirms and starts
      if (code === 'Space' || code === 'Enter') {
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        if (now - this.openedAt < 250) {
          return;
        }
        if (this.isOnlineGuest) return; // Guest waits for Host
        this.sound.playTaikoDon();
        this.confirmStart();
        return;
      }

      // Tab toggles active selection target in local/cpu mode
      if (code === 'Tab') {
        e.preventDefault();
        if (this.gameMode === 'cpu' || this.gameMode === 'local') {
          this.selectionTarget = (this.selectionTarget === 'p1') ? 'p2' : 'p1';
          this.sound.playTaikoKa();
          this.updateCardDisplays();
        }
        return;
      }

      // Movement controls
      if (this.gameMode === 'online') {
        if (this.isOnlineGuest) {
          if (code === 'KeyA' || code === 'ArrowLeft') {
            this.cycleP2(-1);
          } else if (code === 'KeyD' || code === 'ArrowRight') {
            this.cycleP2(1);
          }
        } else {
          if (code === 'KeyA' || code === 'ArrowLeft') {
            this.cycleP1(-1);
          } else if (code === 'KeyD' || code === 'ArrowRight') {
            this.cycleP1(1);
          }
        }
      } else {
        // P1 Controls: A / D
        if (code === 'KeyA') {
          this.cycleP1(-1);
        } else if (code === 'KeyD') {
          this.cycleP1(1);
        }

        // P2 / CPU Controls: Left / Right Arrows
        if (code === 'ArrowLeft') {
          this.cycleP2(-1);
        } else if (code === 'ArrowRight') {
          this.cycleP2(1);
        }
      }
    });
  }

  public open(mode: 'cpu' | 'local' | 'online', initialP1 = 'ginger_tabby' as CatBreed, initialP2 = 'black_tuxedo' as CatBreed, isOnlineGuest = false): void {
    this.openedAt = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    this.gameMode = mode;
    this.isOnlineGuest = isOnlineGuest;
    this.selectionTarget = (mode === 'online' && isOnlineGuest) ? 'p2' : 'p1';
    this.isOpen = true;
    this.p1Index = Math.max(0, this.breeds.indexOf(initialP1));
    this.p2Index = Math.max(0, this.breeds.indexOf(initialP2));
    this.p1Ready = false;
    this.p2Ready = (mode === 'cpu');

    if (this.modalEl) {
      this.modalEl.classList.add('active');
    }

    if (this.fightBtnEl) {
      if (mode === 'online' && isOnlineGuest) {
        this.fightBtnEl.textContent = '⏳ WAITING FOR HOST...';
        this.fightBtnEl.style.opacity = '0.7';
        this.fightBtnEl.style.cursor = 'default';
      } else {
        this.fightBtnEl.textContent = '🥋 FIGHT! 🥋';
        this.fightBtnEl.style.opacity = '1.0';
        this.fightBtnEl.style.cursor = 'pointer';
      }
    }

    if (this.modeTagEl) {
      switch (mode) {
        case 'cpu':
          this.modeTagEl.textContent = '1P VS CPU';
          break;
        case 'local':
          this.modeTagEl.textContent = '2P LOCAL DUEL';
          break;
        case 'online':
          this.modeTagEl.textContent = isOnlineGuest ? 'ONLINE DUEL (YOU ARE GUEST)' : 'ONLINE DUEL (YOU ARE HOST)';
          break;
      }
    }

    if (this.hintEl) {
      if (mode === 'cpu') {
        this.hintEl.textContent = 'YOU: [A][D] | CPU: [◀][▶] | [TAB] Switch Target | Click [YOU] / [CPU] or Cards to Select';
      } else if (mode === 'local') {
        this.hintEl.textContent = 'P1: [A][D] Navigate | P2: [◀][▶] Navigate | Tap or Click to Select';
      } else {
        this.hintEl.textContent = isOnlineGuest
          ? 'YOU ARE GUEST (P2): [A][D] or [◀][▶] Navigate | Select your fighter'
          : 'YOU ARE HOST (P1): [A][D] or [◀][▶] Navigate | Select your fighter';
      }
    }

    this.updateCardDisplays();
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

  public setP1Index(idx: number): void {
    if (this.p1Index !== idx) {
      this.p1Index = (idx + this.breeds.length) % this.breeds.length;
      this.sound.playShove();
      this.updateCardDisplays();
      this.options.onBreedChanged?.('p1', this.breeds[this.p1Index]);
    }
  }

  public setP2Index(idx: number): void {
    if (this.p2Index !== idx) {
      this.p2Index = (idx + this.breeds.length) % this.breeds.length;
      this.sound.playShove();
      this.updateCardDisplays();
      this.options.onBreedChanged?.('p2', this.breeds[this.p2Index]);
    }
  }

  public cycleP1(delta: number): void {
    this.setP1Index(this.p1Index + delta);
  }

  public cycleP2(delta: number): void {
    this.setP2Index(this.p2Index + delta);
  }

  public getP1Breed(): CatBreed {
    return this.breeds[this.p1Index];
  }

  public getP2Breed(): CatBreed {
    return this.breeds[this.p2Index];
  }

  public setRemoteP1Breed(breed: CatBreed): void {
    const idx = this.breeds.indexOf(breed);
    if (idx !== -1) {
      this.p1Index = idx;
      this.updateCardDisplays();
    }
  }

  public setRemoteP2Breed(breed: CatBreed): void {
    const idx = this.breeds.indexOf(breed);
    if (idx !== -1) {
      this.p2Index = idx;
      this.updateCardDisplays();
    }
  }

  private confirmStart(): void {
    const p1Breed = this.getP1Breed();
    const p2Breed = this.getP2Breed();

    this.close();
    this.options.onStartMatch(p1Breed, p2Breed);
  }

  private updateCardDisplays(): void {
    const p1Breed = this.breeds[this.p1Index];
    const p2Breed = this.breeds[this.p2Index];
    const p1Name = FIGHTER_PROFILES[p1Breed]?.name.toUpperCase() || 'MOCHI';
    const p2Name = FIGHTER_PROFILES[p2Breed]?.name.toUpperCase() || 'KURO';

    if (this.targetP1Btn) {
      this.targetP1Btn.textContent = (this.gameMode === 'online')
        ? (this.isOnlineGuest ? `OPPONENT (HOST): ${p1Name}` : `🐱 YOU (HOST): ${p1Name}`)
        : `🐱 YOU (P1): ${p1Name}`;
      this.targetP1Btn.classList.toggle('active', this.selectionTarget === 'p1');
      if (this.gameMode === 'online' && this.isOnlineGuest) {
        this.targetP1Btn.style.opacity = '0.7';
        this.targetP1Btn.style.cursor = 'default';
      } else {
        this.targetP1Btn.style.opacity = '1.0';
        this.targetP1Btn.style.cursor = 'pointer';
      }
    }

    if (this.targetP2Btn) {
      this.targetP2Btn.textContent = (this.gameMode === 'cpu')
        ? `🤖 CPU (P2): ${p2Name}`
        : ((this.gameMode === 'online')
          ? (this.isOnlineGuest ? `🐱 YOU (GUEST): ${p2Name}` : `OPPONENT (GUEST): ${p2Name}`)
          : `🥋 P2: ${p2Name}`);
      this.targetP2Btn.classList.toggle('active', this.selectionTarget === 'p2');
      if (this.gameMode === 'online' && !this.isOnlineGuest) {
        this.targetP2Btn.style.opacity = '0.7';
        this.targetP2Btn.style.cursor = 'default';
      } else {
        this.targetP2Btn.style.opacity = '1.0';
        this.targetP2Btn.style.cursor = 'pointer';
      }
    }

    this.cards.forEach((card, idx) => {
      const isP1 = (this.p1Index === idx);
      const isP2 = (this.p2Index === idx);

      card.classList.toggle('selected-p1', isP1);
      card.classList.toggle('selected-p2', isP2);

      const tagP1 = card.querySelector('.tag-p1') as HTMLElement;
      const tagP2 = card.querySelector('.tag-p2') as HTMLElement;

      if (tagP1) {
        tagP1.style.display = isP1 ? 'block' : 'none';
        tagP1.textContent = (this.gameMode === 'online') ? 'HOST' : 'P1';
      }
      if (tagP2) {
        tagP2.style.display = isP2 ? 'block' : 'none';
        tagP2.textContent = (this.gameMode === 'cpu') ? 'CPU' : ((this.gameMode === 'online') ? 'GUEST' : 'P2');
      }
    });
  }

  private startAnimationLoop(): void {
    const loop = () => {
      if (!this.isOpen) return;
      this.animTick++;
      this.renderCanvasAvatars();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private renderCanvasAvatars(): void {
    this.breeds.forEach((breed, idx) => {
      const card = this.cards[idx];
      if (!card) return;
      const canvas = card.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isP1 = (this.p1Index === idx);
      const isP2 = (this.p2Index === idx);
      const isSelected = isP1 || isP2;

      // Glow behind canvas if selected
      if (isSelected) {
        ctx.save();
        ctx.fillStyle = isP1 ? 'rgba(255, 0, 127, 0.2)' : 'rgba(0, 229, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 + 5, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const facing = (isP2 && !isP1) ? -1 : 1;
      const scale = isSelected ? (1.0 + Math.sin(this.animTick * 0.1) * 0.04) : 0.95;
      const bottomY = canvas.height - 12;

      this.renderer.drawPortrait(
        ctx,
        breed,
        canvas.width / 2,
        bottomY,
        scale,
        facing,
        this.animTick
      );
    });
  }
}
