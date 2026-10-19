import { InputManager } from './engine/InputManager';
import { SoundSynthesizer } from './audio/SoundSynthesizer';
import { Arena } from './entities/Arena';
import { Cat } from './entities/Cat';
import { CollisionEngine } from './engine/Collision';
import { CatRenderer } from './graphics/CatRenderer';
import { ArenaRenderer } from './graphics/ArenaRenderer';
import { EffectsRenderer } from './graphics/EffectsRenderer';
import { ArcadeHUD } from './ui/ArcadeHUD';
import { KeyConfigModal } from './ui/KeyConfigModal';

class CatSumoGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sound: SoundSynthesizer;
  private input: InputManager;
  private arena: Arena;
  private p1: Cat;
  private p2: Cat;
  private collisionEngine: CollisionEngine;
  private catRenderer: CatRenderer;
  private arenaRenderer: ArenaRenderer;
  private effects: EffectsRenderer;
  private hud: ArcadeHUD;
  private keyModal: KeyConfigModal;

  private isRunning: boolean = true;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly fixedStep: number = 1000 / 60; // 60 FPS fixed physics

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;

    // Subsystems
    this.sound = new SoundSynthesizer();
    this.input = new InputManager();
    this.arena = new Arena(this.canvas.width, this.canvas.height);

    // Initial cat positions on the Dohyo
    const surfaceY = this.arena.config.ringSurfaceY;
    this.p1 = new Cat(
      { id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 300, initialFacing: 1 },
      surfaceY
    );
    this.p2 = new Cat(
      { id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 604, initialFacing: -1 },
      surfaceY
    );

    this.collisionEngine = new CollisionEngine(this.sound);
    this.catRenderer = new CatRenderer();
    this.arenaRenderer = new ArenaRenderer(this.arena);
    this.effects = new EffectsRenderer();
    this.hud = new ArcadeHUD();
    this.keyModal = new KeyConfigModal(this.input);

    this.initControls();
    this.resetCatsForRound();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private initControls(): void {
    // Toolbar buttons
    const btnKeys = document.getElementById('btn-keys');
    const btnCrt = document.getElementById('btn-crt');
    const btnSound = document.getElementById('btn-sound');
    const btnBgm = document.getElementById('btn-bgm');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const crtLayer = document.getElementById('crt-layer');

    btnKeys?.addEventListener('click', () => {
      this.keyModal.toggle();
    });

    let crtEnabled = true;
    btnCrt?.addEventListener('click', () => {
      crtEnabled = !crtEnabled;
      if (crtLayer) {
        crtLayer.style.display = crtEnabled ? 'block' : 'none';
      }
      if (btnCrt) {
        btnCrt.textContent = crtEnabled ? 'CRT ON' : 'CRT OFF';
      }
    });

    btnSound?.addEventListener('click', () => {
      const active = this.sound.toggleMute();
      if (btnSound) {
        btnSound.textContent = active ? 'SFX: ON' : 'SFX: OFF';
      }
    });

    btnBgm?.addEventListener('click', () => {
      const active = this.sound.toggleBGM();
      if (btnBgm) {
        btnBgm.textContent = active ? 'BGM: ON' : 'BGM: OFF';
      }
    });

    btnFullscreen?.addEventListener('click', () => {
      const container = document.getElementById('screen-wrapper');
      if (!document.fullscreenElement) {
        container?.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });

    // Auto-start audio and BGM on very first user interaction
    const startAudioOnUserGesture = () => {
      this.sound.startBGM();
      window.removeEventListener('pointerdown', startAudioOnUserGesture);
      window.removeEventListener('keydown', startAudioOnUserGesture);
    };
    window.addEventListener('pointerdown', startAudioOnUserGesture);
    window.addEventListener('keydown', startAudioOnUserGesture);

    // Space key / Global start input
    window.addEventListener('keydown', (e) => {
      if (this.keyModal.isOpen()) return;

      if (e.code === 'Space') {
        this.sound.startBGM();
        if (this.hud.matchPhase === 'TITLE') {
          this.sound.playTaikoDon();
          this.hud.startMatch();
          this.resetCatsForRound();
        } else if (this.hud.matchPhase === 'MATCH_OVER') {
          this.sound.playTaikoDon();
          this.p1.roundsWon = 0;
          this.p2.roundsWon = 0;
          this.hud.startMatch();
          this.resetCatsForRound();
        }
      }
    });
  }

  private resetCatsForRound(): void {
    const surfaceY = this.arena.config.ringSurfaceY;
    this.p1.resetPosition(300, surfaceY, 1);
    this.p2.resetPosition(604, surfaceY, -1);
    this.sound.playTaikoDon();
  }

  private gameLoop(timestamp: number): void {
    if (!this.lastTime) this.lastTime = timestamp;
    const delta = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.accumulator += Math.min(delta, 100);

    while (this.accumulator >= this.fixedStep) {
      this.update();
      this.accumulator -= this.fixedStep;
    }

    this.render();

    if (this.isRunning) {
      requestAnimationFrame((t) => this.gameLoop(t));
    }
  }

  private update(): void {
    // Ambient cherry blossom petals
    this.effects.addCherryBlossom(this.canvas.width);
    this.effects.update();
    this.hud.update();

    if (this.keyModal.isOpen()) {
      return;
    }

    // Title Screen Start via P1 or P2 Jump
    if (this.hud.matchPhase === 'TITLE') {
      if (this.input.isJustPressed('p1', 'jump') || this.input.isJustPressed('p2', 'jump')) {
        this.sound.playTaikoDon();
        this.hud.startMatch();
        this.resetCatsForRound();
      }
      this.input.update();
      return;
    }

    // Match Over restart via Jump
    if (this.hud.matchPhase === 'MATCH_OVER') {
      if (this.input.isJustPressed('p1', 'jump') || this.input.isJustPressed('p2', 'jump')) {
        this.sound.playTaikoDon();
        this.p1.roundsWon = 0;
        this.p2.roundsWon = 0;
        this.hud.startMatch();
        this.resetCatsForRound();
      }
      this.input.update();
      return;
    }

    // During ROUND_INTRO: wait for fight signal
    if (this.hud.matchPhase === 'ROUND_INTRO') {
      if (this.hud.phaseTimer === 40) {
        this.sound.playTaikoKa();
      }
      this.input.update();
      return;
    }

    // Skip physics updates during hit stop freeze frame
    if (this.effects.hitStopFrames > 0) {
      this.input.update();
      return;
    }

    // Active Fight Phase
    if (this.hud.matchPhase === 'FIGHT') {
      // 1. Process Jump Inputs (Edge-triggered for jump sound & spring)
      if (this.input.isJustPressed('p1', 'jump') && this.p1.isGrounded) {
        this.p1.jump();
        this.sound.playJump();
      }
      if (this.input.isJustPressed('p2', 'jump') && this.p2.isGrounded) {
        this.p2.jump();
        this.sound.playJump();
      }

      // 2. Update Cat Locomotion & Physics
      this.p1.updatePhysics(
        this.arena,
        this.input.isDown('p1', 'left'),
        this.input.isDown('p1', 'right'),
        this.input.isDown('p1', 'jump'),
        this.p2.x
      );

      this.p2.updatePhysics(
        this.arena,
        this.input.isDown('p2', 'left'),
        this.input.isDown('p2', 'right'),
        this.input.isDown('p2', 'jump'),
        this.p1.x
      );

      // Dust generation
      if (this.p1.dustParticlesToSpawn > 0) {
        this.effects.addDust(this.p1.x + this.p1.width / 2, this.p1.y + this.p1.height, this.p1.dustParticlesToSpawn);
        this.p1.dustParticlesToSpawn = 0;
      }
      if (this.p2.dustParticlesToSpawn > 0) {
        this.effects.addDust(this.p2.x + this.p2.width / 2, this.p2.y + this.p2.height, this.p2.dustParticlesToSpawn);
        this.p2.dustParticlesToSpawn = 0;
      }

      // 3. Collision & Height Bump Resolution
      const bumpEvent = this.collisionEngine.checkAndResolveCats(this.p1, this.p2);
      if (bumpEvent) {
        const isMega = bumpEvent.heightDelta > 26;
        this.effects.addComicPopup(bumpEvent.comicText, bumpEvent.contactX, bumpEvent.contactY - 20, isMega);
        this.effects.triggerScreenShake(bumpEvent.shakeMagnitude);
        if (bumpEvent.heightDelta > 15) {
          this.effects.triggerHitStop(isMega ? 3 : 1);
        }
      }

      // 4. Ring Out & Time Over Check
      let roundOverWinner: Cat | null = null;
      let roundOverLoser: Cat | null = null;

      if (this.p1.state === 'RING_OUT') {
        roundOverWinner = this.p2;
        roundOverLoser = this.p1;
      } else if (this.p2.state === 'RING_OUT') {
        roundOverWinner = this.p1;
        roundOverLoser = this.p2;
      } else if (this.hud.matchTimer <= 0) {
        // Time out: closest to ring center wins
        const ringCenter = (this.arena.config.ringLeft + this.arena.config.ringRight) / 2;
        const dist1 = Math.abs(this.p1.x + this.p1.width / 2 - ringCenter);
        const dist2 = Math.abs(this.p2.x + this.p2.width / 2 - ringCenter);
        if (dist1 < dist2) {
          roundOverWinner = this.p1;
          roundOverLoser = this.p2;
        } else {
          roundOverWinner = this.p2;
          roundOverLoser = this.p1;
        }
      }

      if (roundOverWinner && roundOverLoser) {
        this.sound.playRingOut();
        roundOverWinner.state = 'CELEBRATING';
        this.hud.triggerRoundOver(roundOverLoser, roundOverWinner);
        this.effects.triggerScreenShake(8);

        // Check if tournament won
        if (roundOverWinner.roundsWon >= this.hud.maxRoundsToWin) {
          setTimeout(() => {
            this.sound.playVictoryFanfare();
          }, 800);
        }
      }
    } else if (this.hud.matchPhase === 'ROUND_OVER') {
      // Continue gravity for fallen cat during round over
      this.p1.updatePhysics(this.arena, false, false, false, this.p2.x);
      this.p2.updatePhysics(this.arena, false, false, false, this.p1.x);

      // Check if transitioning to next round
      if (this.hud.phaseTimer === 1 && this.hud.winnerCat && this.hud.winnerCat.roundsWon < this.hud.maxRoundsToWin) {
        this.resetCatsForRound();
      }
    }

    this.input.update();
  }

  private render(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.save();

    // Apply Screen Shake
    const shake = this.effects.getShakeOffsets();
    this.ctx.translate(shake.x, shake.y);

    // 1. Draw Arena & Background
    this.arenaRenderer.draw(this.ctx);

    // 2. Draw Cats (render higher cat on top for depth)
    if (this.p1.y >= this.p2.y) {
      this.catRenderer.draw(this.ctx, this.p2);
      this.catRenderer.draw(this.ctx, this.p1);
    } else {
      this.catRenderer.draw(this.ctx, this.p1);
      this.catRenderer.draw(this.ctx, this.p2);
    }

    // 3. Draw VFX (Popups, Dust, Petals)
    this.effects.draw(this.ctx);

    // 4. Draw Arcade HUD & Announcements
    this.hud.draw(this.ctx, this.p1, this.p2, width, height);

    this.ctx.restore();
  }
}

// Start game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new CatSumoGame();
});
