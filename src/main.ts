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
import { TouchController } from './ui/TouchController';
import { NetworkManager, PlayerInputPacket, NetworkStateSnapshot, BumpEventPacket, NetworkSignal } from './network/NetworkManager';
import { OnlineModal } from './ui/OnlineModal';

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
  private touchController: TouchController;
  private network: NetworkManager;
  private onlineModal: OnlineModal;

  private isRunning: boolean = true;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly fixedStep: number = 1000 / 60; // 60 FPS fixed physics
  private tickCount: number = 0;

  // Online bump event synchronization
  private bumpSequence: number = 0;
  private lastProcessedBumpId: number = 0;
  private latestBumpPacket: BumpEventPacket | null = null;
  private bumpPacketExpiryTick: number = 0;

  // Host input delay buffer to level playing field with guest
  private hostInputQueue: Array<{ left: boolean; right: boolean; jump: boolean; justJump: boolean }> = [];

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
    this.touchController = new TouchController(this.input);
    this.network = new NetworkManager();
    this.onlineModal = new OnlineModal(this.network, () => this.handleOnlineGameStart());

    this.initControls();
    this.initNetworkSync();
    this.resetCatsForRound();
    this.checkUrlRoomHash();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private initControls(): void {
    // Toolbar buttons
    const btnOnline = document.getElementById('btn-online');
    const btnTouch = document.getElementById('btn-touch');
    const btnKeys = document.getElementById('btn-keys');
    const btnCrt = document.getElementById('btn-crt');
    const btnSound = document.getElementById('btn-sound');
    const btnBgm = document.getElementById('btn-bgm');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const crtLayer = document.getElementById('crt-layer');

    const btnOnlineMarquee = document.getElementById('btn-online-marquee');

    const openOnline = () => {
      this.onlineModal.open();
    };

    btnOnline?.addEventListener('click', openOnline);
    btnOnlineMarquee?.addEventListener('click', openOnline);

    btnTouch?.addEventListener('click', () => {
      const isNowVisible = this.touchController.toggle();
      if (btnTouch) {
        btnTouch.textContent = isNowVisible ? 'TOUCH ON' : 'TOUCH OFF';
      }
    });

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

    const btnTrack = document.getElementById('btn-track');
    btnTrack?.addEventListener('click', () => {
      const title = this.sound.nextTrack();
      this.hud.showTrackBanner(title);
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
      if (this.keyModal.isOpen() || this.onlineModal.isOpen()) return;

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

  private checkUrlRoomHash(): void {
    if (window.location.hash) {
      const match = window.location.hash.match(/room=([a-zA-Z0-9-]+)/);
      if (match && match[1]) {
        const roomId = match[1];
        setTimeout(() => {
          this.onlineModal.open(roomId);
        }, 300);
      }
    }
  }

  private initNetworkSync(): void {
    this.network.onRemoteInputReceived = (packet: PlayerInputPacket) => {
      if (this.network.isHost()) {
        // Host applies remote guest inputs to Kuro (P2)
        this.input.setVirtualAction('p2', 'left', packet.left);
        this.input.setVirtualAction('p2', 'right', packet.right);
        this.input.setVirtualAction('p2', 'jump', packet.jump);
      }
    };

    this.network.onRemoteSignalReceived = (signal: NetworkSignal) => {
      if (signal.type === 'BONK_EVENT' && signal.payload) {
        this.handleRemoteBump(signal.payload);
      }
    };

    this.network.onRemoteStateReceived = (state: NetworkStateSnapshot) => {
      if (!this.network.isHost()) {
        // 1. P1 (Host Cat): Host is authoritative, gently smooth out packet arrival jitter
        const dxP1 = state.p1.x - this.p1.x;
        const dyP1 = state.p1.y - this.p1.y;
        if (Math.abs(dxP1) < 40 && Math.abs(dyP1) < 40) {
          this.p1.x += dxP1 * 0.55;
          this.p1.y += dyP1 * 0.55;
        } else {
          this.p1.x = state.p1.x;
          this.p1.y = state.p1.y;
        }
        this.p1.vx = state.p1.vx;
        this.p1.vy = state.p1.vy;
        this.p1.state = state.p1.state as any;
        this.p1.facing = state.p1.facing as any;
        if (state.p1.scaleX !== undefined) this.p1.scaleX = state.p1.scaleX;
        if (state.p1.scaleY !== undefined) this.p1.scaleY = state.p1.scaleY;

        // 2. P2 (Guest Cat with Client-Side Prediction):
        // If Host reports combat knockback / DAZED, RING_OUT, or CELEBRATING, accept Host's authoritative state immediately!
        if (state.p2.state === 'DAZED' || state.p2.state === 'RING_OUT' || state.p2.state === 'CELEBRATING') {
          this.p2.x = state.p2.x;
          this.p2.y = state.p2.y;
          this.p2.vx = state.p2.vx;
          this.p2.vy = state.p2.vy;
          this.p2.state = state.p2.state as any;
          this.p2.facing = state.p2.facing as any;
        } else {
          // If Guest was in a terminal/defeat state (e.g. RING_OUT from losing previous round),
          // but Host has reset or recovered to IDLE/WADDLE, immediately exit defeat state!
          if (this.p2.state === 'RING_OUT' || this.p2.state === 'DAZED' || this.p2.state === 'CELEBRATING') {
            this.p2.state = state.p2.state as any;
            this.p2.x = state.p2.x;
            this.p2.y = state.p2.y;
            this.p2.vx = state.p2.vx;
            this.p2.vy = state.p2.vy;
            this.p2.facing = state.p2.facing as any;
            this.p2.isGrounded = true;
          } else {
            // Normal locomotion: Soft position reconciliation
            const dxP2 = state.p2.x - this.p2.x;
            const dyP2 = state.p2.y - this.p2.y;

            if (Math.abs(dxP2) > 35 || Math.abs(dyP2) > 40) {
              // Major desync: hard snap to Host
              this.p2.x = state.p2.x;
              this.p2.y = state.p2.y;
              this.p2.vx = state.p2.vx;
              this.p2.vy = state.p2.vy;
            } else {
              // Minor drift: smoothly nudge towards Host without interrupting local jump or walk
              this.p2.x += dxP2 * 0.25;
              if (this.p2.isGrounded && state.p2.vy === 0) {
                this.p2.y = state.p2.y;
              }
            }

            if (!this.input.isDown('p2', 'left') && !this.input.isDown('p2', 'right')) {
              this.p2.facing = state.p2.facing as any;
            }
          }
        }

        if (state.p2.scaleX !== undefined) this.p2.scaleX = state.p2.scaleX;
        if (state.p2.scaleY !== undefined) this.p2.scaleY = state.p2.scaleY;

        this.p1.roundsWon = state.p1Wins;
        this.p2.roundsWon = state.p2Wins;

        // Process synchronized collision text & bonk effects
        if (state.bump) {
          this.handleRemoteBump(state.bump);
        }

        // Round & track synchronization
        if (this.hud.currentRound !== state.currentRound) {
          this.hud.currentRound = state.currentRound;
          const trackTitle = this.sound.setRoundTrack(state.currentRound);
          this.hud.showTrackBanner(trackTitle);
          this.resetCatsForRound();
        }

        if (this.hud.matchPhase !== state.matchPhase) {
          this.hud.matchPhase = state.matchPhase as any;
          if (state.matchPhase === 'ROUND_INTRO') {
            this.sound.playTaikoDon();
            this.hud.startRoundIntro();
            this.resetCatsForRound();
          } else if (state.matchPhase === 'ROUND_OVER') {
            this.sound.playRingOut();
            this.effects.triggerScreenShake(8);

            const winner = state.p1Wins > this.p1.roundsWon ? this.p1 : this.p2;
            const isTourneyWin = state.p1Wins >= this.hud.maxRoundsToWin || state.p2Wins >= this.hud.maxRoundsToWin;
            this.hud.syncRoundOver(winner, isTourneyWin);

            if (isTourneyWin) {
              setTimeout(() => {
                this.sound.playVictoryFanfare();
              }, 800);
            }
          }
        }
      }
    };
  }

  private handleRemoteBump(bump: BumpEventPacket): void {
    if (!bump || bump.id <= this.lastProcessedBumpId) return;
    this.lastProcessedBumpId = bump.id;

    // Render comic text popup and screen shake on the guest
    this.effects.addComicPopup(bump.comicText, bump.contactX, bump.contactY, bump.isMega);
    this.effects.triggerScreenShake(bump.shakeMagnitude);
    this.effects.addDust(bump.contactX, bump.contactY + 20, bump.isMega ? 10 : 5);

    if (bump.heightDelta > 15) {
      this.effects.triggerHitStop(bump.isMega ? 3 : 1);
    }

    // Play synchronized bump sound
    if (bump.heightDelta > 9) {
      this.sound.playBonk(bump.heightDelta);
      if (bump.heightDelta > 22) {
        setTimeout(() => {
          this.sound.playMeow(1.0);
        }, 70);
      }
    } else {
      this.sound.playShove();
    }
  }

  private broadcastStateSnapshot(): void {
    if (!this.network.isConnected() || !this.network.isHost()) return;

    const activeBump = (this.latestBumpPacket && this.tickCount < this.bumpPacketExpiryTick)
      ? this.latestBumpPacket
      : null;

    this.network.sendState({
      tick: this.tickCount++,
      p1: {
        x: this.p1.x,
        y: this.p1.y,
        vx: this.p1.vx,
        vy: this.p1.vy,
        state: this.p1.state,
        facing: this.p1.facing,
        scaleX: this.p1.scaleX,
        scaleY: this.p1.scaleY,
      },
      p2: {
        x: this.p2.x,
        y: this.p2.y,
        vx: this.p2.vx,
        vy: this.p2.vy,
        state: this.p2.state,
        facing: this.p2.facing,
        scaleX: this.p2.scaleX,
        scaleY: this.p2.scaleY,
      },
      matchPhase: this.hud.matchPhase,
      currentRound: this.hud.currentRound,
      phaseTimer: this.hud.phaseTimer,
      p1Wins: this.p1.roundsWon,
      p2Wins: this.p2.roundsWon,
      bump: activeBump,
    });
  }

  private handleOnlineGameStart(): void {
    this.sound.startBGM();
    this.sound.playTaikoDon();

    if (this.network.isHost()) {
      this.touchController.setActivePlayer('p1');
    } else {
      this.touchController.setActivePlayer('p2');
    }

    this.p1.roundsWon = 0;
    this.p2.roundsWon = 0;
    this.hud.startMatch();
    this.resetCatsForRound();
  }

  private resetCatsForRound(): void {
    this.hostInputQueue = [];
    const surfaceY = this.arena.config.ringSurfaceY;
    this.p1.resetPosition(300, surfaceY, 1);
    this.p2.resetPosition(604, surfaceY, -1);
    this.sound.playTaikoDon();

    // Dynamically switch track for current round & notify player
    const trackTitle = this.sound.setRoundTrack(this.hud.currentRound);
    this.hud.showTrackBanner(trackTitle);
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
      const isOnlineGuest = this.network.isConnected() && !this.network.isHost();

      // In online guest mode: local prediction for P2 (0ms input lag!)
      if (isOnlineGuest) {
        const left = this.input.isDown('p2', 'left');
        const right = this.input.isDown('p2', 'right');
        const jumpHeld = this.input.isDown('p2', 'jump');
        const justJump = this.input.isJustPressed('p2', 'jump');

        this.network.sendInputs({
          seq: this.tickCount++,
          left,
          right,
          jump: jumpHeld,
        });

        // Instant local jump execution
        if (justJump && this.p2.isGrounded) {
          this.p2.jump();
          this.sound.playJump();
        }

        // Local physics prediction for Kuro (P2)
        this.p2.updatePhysics(
          this.arena,
          left,
          right,
          jumpHeld,
          this.p1.x
        );

        // Keep host cat animation updated on guest
        this.p1.updateAnimation();

        if (this.p1.dustParticlesToSpawn > 0) {
          this.effects.addDust(this.p1.x + this.p1.width / 2, this.p1.y + this.p1.height, this.p1.dustParticlesToSpawn);
          this.p1.dustParticlesToSpawn = 0;
        }
        if (this.p2.dustParticlesToSpawn > 0) {
          this.effects.addDust(this.p2.x + this.p2.width / 2, this.p2.y + this.p2.height, this.p2.dustParticlesToSpawn);
          this.p2.dustParticlesToSpawn = 0;
        }
      } else {
        // Host or Local:
        let p1Left = this.input.isDown('p1', 'left');
        let p1Right = this.input.isDown('p1', 'right');
        let p1Jump = this.input.isDown('p1', 'jump');
        let p1JustJump = this.input.isJustPressed('p1', 'jump');

        // Dynamic input delay buffer for online host to level reaction time with guest
        if (this.network.isConnected() && this.network.isHost()) {
          const ping = this.network.getPing() ?? 25;
          const bufferDepth = ping < 35 ? 1 : (ping < 75 ? 2 : 3);

          this.hostInputQueue.push({
            left: p1Left,
            right: p1Right,
            jump: p1Jump,
            justJump: p1JustJump,
          });

          if (this.hostInputQueue.length >= bufferDepth) {
            const buffered = this.hostInputQueue.shift()!;
            p1Left = buffered.left;
            p1Right = buffered.right;
            p1Jump = buffered.jump;
            p1JustJump = buffered.justJump;
          } else {
            p1Left = false;
            p1Right = false;
            p1Jump = false;
            p1JustJump = false;
          }
        }

        // Process Jump Inputs
        if (p1JustJump && this.p1.isGrounded) {
          this.p1.jump();
          this.sound.playJump();
        }
        if (this.input.isJustPressed('p2', 'jump') && this.p2.isGrounded) {
          this.p2.jump();
          this.sound.playJump();
        }

        // Update Cat Locomotion & Physics
        this.p1.updatePhysics(
          this.arena,
          p1Left,
          p1Right,
          p1Jump,
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

        // Collision & Height Bump Resolution
        const bumpEvent = this.collisionEngine.checkAndResolveCats(this.p1, this.p2);
        if (bumpEvent) {
          const isMega = bumpEvent.heightDelta > 26;
          this.effects.addComicPopup(bumpEvent.comicText, bumpEvent.contactX, bumpEvent.contactY - 20, isMega);
          this.effects.triggerScreenShake(bumpEvent.shakeMagnitude);
          if (bumpEvent.heightDelta > 15) {
            this.effects.triggerHitStop(isMega ? 3 : 1);
          }

          // Broadcast bump event to remote guest for instant synchronized comic text & audio
          if (this.network.isConnected() && this.network.isHost()) {
            this.bumpSequence++;
            this.latestBumpPacket = {
              id: this.bumpSequence,
              comicText: bumpEvent.comicText,
              contactX: bumpEvent.contactX,
              contactY: bumpEvent.contactY - 20,
              isMega,
              shakeMagnitude: bumpEvent.shakeMagnitude,
              heightDelta: bumpEvent.heightDelta,
            };
            this.bumpPacketExpiryTick = this.tickCount + 30;

            this.network.sendSignal({
              type: 'BONK_EVENT',
              payload: this.latestBumpPacket,
            });
          }
        }

        // Ring Out & Time Over Check
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

        // If online host, broadcast authoritative snapshot
        this.broadcastStateSnapshot();
      }
    } else if (this.hud.matchPhase === 'ROUND_OVER') {
      if (!this.network.isConnected() || this.network.isHost()) {
        // Continue gravity for fallen cat during round over
        this.p1.updatePhysics(this.arena, false, false, false, this.p2.x);
        this.p2.updatePhysics(this.arena, false, false, false, this.p1.x);

        // Check if transitioning to next round
        if (this.hud.phaseTimer === 1 && this.hud.winnerCat && this.hud.winnerCat.roundsWon < this.hud.maxRoundsToWin) {
          this.resetCatsForRound();
        }

        this.broadcastStateSnapshot();
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

    // 5. Draw Online Status & Ping Badge if active
    this.drawOnlineHUD(this.ctx, width);

    this.ctx.restore();
  }

  private drawOnlineHUD(ctx: CanvasRenderingContext2D, width: number): void {
    if (!this.network.isConnected()) return;

    ctx.save();
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const roleText = this.network.isHost() ? 'P1 (HOST)' : 'P2 (GUEST)';
    const roomId = this.network.getRoomId() || '';
    const leftText = `🌐 ${roleText} [${roomId}]`;
    const ping = this.network.getPing();
    const pingText = ping !== null ? `${ping} ms` : '-- ms';

    // Latency color indicator
    let pingColor = '#888888';
    if (ping !== null) {
      if (ping < 60) {
        pingColor = '#00ff66'; // Excellent (<60ms)
      } else if (ping <= 130) {
        pingColor = '#ffe600'; // Playable (60-130ms)
      } else {
        pingColor = '#ff3366'; // High lag (>130ms)
      }
    }

    const leftWidth = ctx.measureText(leftText).width;
    const pingWidth = ctx.measureText(pingText).width;
    const dotRadius = 3;
    const paddingX = 8;
    const separatorGap = 8;
    const dotGap = 6;
    const boxHeight = 22;
    const boxWidth = paddingX + leftWidth + separatorGap + 6 + separatorGap + dotRadius * 2 + dotGap + pingWidth + paddingX;
    const boxX = width - 16 - boxWidth;
    const boxY = 62;
    const centerY = boxY + boxHeight / 2;

    // Badge backdrop
    ctx.fillStyle = 'rgba(12, 6, 24, 0.88)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(boxX, boxY, boxWidth, boxHeight, 4);
    } else {
      ctx.rect(boxX, boxY, boxWidth, boxHeight);
    }
    ctx.fill();
    ctx.stroke();

    // 1. Role and Room Code
    let curX = boxX + paddingX;
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(leftText, curX, centerY);
    curX += leftWidth + separatorGap;

    // 2. Separator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillText('|', curX, centerY);
    curX += 6 + separatorGap;

    // 3. Latency dot
    ctx.beginPath();
    ctx.arc(curX + dotRadius, centerY, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = pingColor;
    ctx.shadowColor = pingColor;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
    curX += dotRadius * 2 + dotGap;

    // 4. Ping in ms
    ctx.fillStyle = pingColor;
    ctx.fillText(pingText, curX, centerY);

    ctx.restore();
  }
}

// Start game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new CatSumoGame();
});
