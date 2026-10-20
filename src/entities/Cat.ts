import { PlayerId } from '../engine/InputManager';
import { Arena } from './Arena';

export type CatState = 
  | 'IDLE' 
  | 'WADDLE' 
  | 'JUMP_RISE' 
  | 'JUMP_FALL' 
  | 'DAZED' 
  | 'TEETER' 
  | 'RING_OUT' 
  | 'CELEBRATING'
  | 'TURBO_DASH';

export interface Afterimage {
  x: number;
  y: number;
  facing: 1 | -1;
  alpha: number;
  scaleX: number;
  scaleY: number;
}

export interface CatConfig {
  id: PlayerId;
  name: string;
  breed: 'ginger_tabby' | 'black_tuxedo';
  initialX: number;
  initialFacing: 1 | -1;
}

export class Cat {
  public readonly id: PlayerId;
  public readonly name: string;
  public readonly breed: 'ginger_tabby' | 'black_tuxedo';

  // Position & Velocity
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 56;
  public height: number = 52;
  public facing: 1 | -1 = 1;

  // State
  public state: CatState = 'IDLE';
  public isGrounded: boolean = true;
  public dazeTimer: number = 0;
  public maxDazeTimer: number = 0;
  public roundsWon: number = 0;

  // Visual Juice (Squash & Stretch, Animation)
  public scaleX: number = 1.0;
  public scaleY: number = 1.0;
  public animTimer: number = 0;
  public blinkTimer: number = 100;
  public isBlinking: boolean = false;
  public teeterSide: 'left' | 'right' | null = null;
  public dustParticlesToSpawn: number = 0;

  // Jump control
  public isHoldingJump: boolean = false;
  public hasJumpedThisPress: boolean = false;

  // Turbo Attack & Cooldown
  public turboCooldown: number = 0;
  public readonly maxTurboCooldown: number = 240; // 4 seconds at 60 FPS
  public turboDashTimer: number = 0;
  public turboDashDirection: 1 | -1 = 1;
  public readonly turboDashSpeed: number = 10.67; // ~160px reach across 15 frames (~27.5% of Dohyo)
  public afterimages: Afterimage[] = [];

  constructor(config: CatConfig, ringSurfaceY: number) {
    this.id = config.id;
    this.name = config.name;
    this.breed = config.breed;
    this.x = config.initialX;
    this.y = ringSurfaceY - this.height;
    this.facing = config.initialFacing;
  }

  public resetPosition(spawnX: number, ringSurfaceY: number, facing: 1 | -1): void {
    this.x = spawnX;
    this.y = ringSurfaceY - this.height;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.state = 'IDLE';
    this.isGrounded = true;
    this.dazeTimer = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.teeterSide = null;
    this.hasJumpedThisPress = false;
    this.turboCooldown = 0;
    this.turboDashTimer = 0;
    this.afterimages = [];
  }

  public canTurboAttack(): boolean {
    return this.turboCooldown === 0 &&
      this.state !== 'DAZED' &&
      this.state !== 'RING_OUT' &&
      this.state !== 'TURBO_DASH' &&
      this.state !== 'CELEBRATING';
  }

  public startTurboAttack(direction: 1 | -1): void {
    this.state = 'TURBO_DASH';
    this.turboDashTimer = 15;
    this.turboDashDirection = direction;
    this.facing = direction;
    this.scaleX = 1.45;
    this.scaleY = 0.7;
    this.vx = direction * this.turboDashSpeed;
    this.vy = 0;
    this.dustParticlesToSpawn = 6;
  }

  public endTurboAttack(): void {
    if (this.state === 'TURBO_DASH') {
      this.state = this.isGrounded ? 'IDLE' : 'JUMP_FALL';
      this.turboDashTimer = 0;
      this.turboCooldown = this.maxTurboCooldown;
      this.scaleX = 0.9;
      this.scaleY = 1.1;
    }
  }

  public jump(): void {
    if (this.isGrounded && this.state !== 'DAZED' && this.state !== 'RING_OUT') {
      this.vy = -12.4; // Initial jump burst
      this.isGrounded = false;
      this.hasJumpedThisPress = true;
      this.scaleX = 0.75;
      this.scaleY = 1.35; // Stretch upwards
      this.state = 'JUMP_RISE';
      this.dustParticlesToSpawn = 5;
    }
  }

  public applyKnockback(impulseX: number, impulseY: number, dazeFrames: number): void {
    this.vx = impulseX;
    this.vy = impulseY;
    if (impulseY !== 0) {
      this.isGrounded = false;
    }
    this.dazeTimer = dazeFrames;
    this.maxDazeTimer = dazeFrames;
    this.state = 'DAZED';
    this.scaleX = 1.4; // Squished wide by impact
    this.scaleY = 0.65;
  }

  public pounceBounce(): void {
    // Upward spring given to higher cat who successfully stomped/bumped opponent
    this.vy = -8.5;
    this.isGrounded = false;
    this.scaleX = 0.85;
    this.scaleY = 1.25;
  }

  public updateAnimation(inputJumpHeld?: boolean): void {
    this.animTimer++;
    if (inputJumpHeld !== undefined) {
      this.isHoldingJump = inputJumpHeld;
    }

    // Blink timer
    this.blinkTimer--;
    if (this.blinkTimer <= 0) {
      this.isBlinking = !this.isBlinking;
      this.blinkTimer = this.isBlinking ? 8 : 120 + Math.random() * 80;
    }

    // Squash & Stretch Spring recovery
    this.scaleX += (1.0 - this.scaleX) * 0.15;
    this.scaleY += (1.0 - this.scaleY) * 0.15;

    // Fade lingering afterimages
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].alpha -= 0.08;
      if (this.afterimages[i].alpha <= 0) {
        this.afterimages.splice(i, 1);
      }
    }
  }

  public updatePhysics(
    arena: Arena,
    inputLeft: boolean,
    inputRight: boolean,
    inputJumpHeld: boolean,
    otherCatX: number
  ): void {
    this.updateAnimation(inputJumpHeld);

    // Cooldown countdown
    if (this.turboCooldown > 0) {
      this.turboCooldown--;
    }

    // Handle Ring Out state
    if (this.state === 'RING_OUT') {
      const ringSurface = arena.config.ringSurfaceY;
      // Safety guard: if cat is on Dohyo platform, recover cleanly from RING_OUT
      if (arena.isOnPlatform(this.x, this.width) && (this.y + this.height) <= ringSurface + 16) {
        this.state = 'IDLE';
        this.y = ringSurface - this.height;
        this.vy = 0;
        this.isGrounded = true;
      } else {
        this.vy += 0.55; // Gravity in pit
        this.x += this.vx;
        this.y += this.vy;
        return;
      }
    }

    // Check if falling off arena into pit
    if (arena.isRingOut(this.x, this.y, this.width)) {
      this.state = 'RING_OUT';
      this.scaleX = 0.8;
      this.scaleY = 1.2;
      return;
    }

    // Handle Active Turbo Dash
    if (this.state === 'TURBO_DASH') {
      // Record afterimage for motion blur
      if (this.turboDashTimer % 2 === 0) {
        this.afterimages.push({
          x: this.x,
          y: this.y,
          facing: this.facing,
          alpha: 0.7,
          scaleX: this.scaleX,
          scaleY: this.scaleY,
        });
      }

      this.vx = this.turboDashDirection * this.turboDashSpeed;
      this.vy = 0; // Aerodynamic dash
      this.x += this.vx;

      const isAboveRingHorizontally = arena.isOnPlatform(this.x, this.width);
      if (!isAboveRingHorizontally) {
        this.isGrounded = false;
      }

      this.turboDashTimer--;
      if (this.turboDashTimer <= 0) {
        this.endTurboAttack();
      }
      return;
    }

    // Handle Daze Timer
    if (this.dazeTimer > 0) {
      this.dazeTimer--;
      this.state = 'DAZED';
      // Balanced sliding friction while dazed
      this.vx *= 0.89;
    } else {
      // Player Movement controls (reduced to 50% speed during cooldown)
      const speedMultiplier = this.turboCooldown > 0 ? 0.5 : 1.0;
      const accel = (this.isGrounded ? 0.72 : 0.45) * speedMultiplier;
      const maxSpeed = 4.4 * speedMultiplier;

      if (inputLeft) {
        this.vx -= accel;
        if (this.vx < -maxSpeed) this.vx = -maxSpeed;
        this.facing = -1;
      } else if (inputRight) {
        this.vx += accel;
        if (this.vx > maxSpeed) this.vx = maxSpeed;
        this.facing = 1;
      } else {
        // Friction / Deceleration
        const friction = this.isGrounded ? 0.78 : 0.95;
        this.vx *= friction;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
      }

      // Dynamic facing direction update when moving or idle (face opponent when stationary)
      if (Math.abs(this.vx) < 0.3 && this.isGrounded) {
        this.facing = (otherCatX > this.x) ? 1 : -1;
      }
    }

    // Gravity calculation: applies whenever airborne or whenever vy is non-zero
    if (!this.isGrounded || this.vy !== 0) {
      this.isGrounded = false;
      // Variable jump height: lighter gravity when holding jump while moving upwards
      const gravity = (this.vy < 0 && this.isHoldingJump) ? 0.48 : 0.88;
      this.vy += gravity;
      if (this.vy > 14) this.vy = 14; // Terminal velocity
    }

    // Apply movement
    this.x += this.vx;
    this.y += this.vy;

    // Arena Platform Collision Check
    const ringSurface = arena.config.ringSurfaceY;
    const isAboveRingHorizontally = arena.isOnPlatform(this.x, this.width);

    if (isAboveRingHorizontally) {
      const feetY = this.y + this.height;
      // Landing on platform from above (only when descending)
      if (feetY >= ringSurface && this.vy >= 0 && (feetY - this.vy) <= ringSurface + 16) {
        this.y = ringSurface - this.height;
        if (!this.isGrounded && this.vy > 2) {
          // Landing squish
          this.scaleX = 1.25;
          this.scaleY = 0.75;
          this.dustParticlesToSpawn = 3;
        }
        this.vy = 0;
        this.isGrounded = true;
      } else if (feetY < ringSurface - 0.5) {
        // Feet are in the air above platform
        this.isGrounded = false;
      }
    } else {
      // Left or Right off platform
      this.isGrounded = false;
    }

    // State determination
    if (this.dazeTimer <= 0 && this.state !== 'CELEBRATING') {
      if (!this.isGrounded) {
        this.state = this.vy < 0 ? 'JUMP_RISE' : 'JUMP_FALL';
        this.teeterSide = null;
      } else {
        // Check edge teetering
        const teeter = arena.isTeetering(this.x, this.width);
        this.teeterSide = teeter;

        if (teeter !== null && Math.abs(this.vx) < 1.0) {
          this.state = 'TEETER';
        } else if (Math.abs(this.vx) > 0.4) {
          this.state = 'WADDLE';
        } else {
          this.state = 'IDLE';
        }
      }
    }
  }

  public getCenter(): { x: number; y: number } {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }

  public getHitbox(): { x: number; y: number; width: number; height: number } {
    // Slightly inset hitbox for forgiving, tight retro collision
    const insetX = 6;
    const insetY = 4;
    return {
      x: this.x + insetX,
      y: this.y + insetY,
      width: this.width - insetX * 2,
      height: this.height - insetY * 2,
    };
  }
}
