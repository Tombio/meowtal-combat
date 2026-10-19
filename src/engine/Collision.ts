import { Cat } from '../entities/Cat';
import { SoundSynthesizer } from '../audio/SoundSynthesizer';

export interface BumpEvent {
  higherCat: Cat;
  lowerCat: Cat;
  heightDelta: number;
  contactX: number;
  contactY: number;
  comicText: string;
  shakeMagnitude: number;
}

export class CollisionEngine {
  private sound: SoundSynthesizer;
  private lastCollisionTime: number = 0;

  constructor(sound: SoundSynthesizer) {
    this.sound = sound;
  }

  public resetCooldown(): void {
    this.lastCollisionTime = 0;
  }

  public checkAndResolveCats(cat1: Cat, cat2: Cat): BumpEvent | null {
    // If either cat is already in ring-out falling state, skip combat collisions
    if (cat1.state === 'RING_OUT' || cat2.state === 'RING_OUT') {
      return null;
    }

    const box1 = cat1.getHitbox();
    const box2 = cat2.getHitbox();

    // Check AABB overlap
    const overlapX = (box1.x < box2.x + box2.width) && (box1.x + box1.width > box2.x);
    const overlapY = (box1.y < box2.y + box2.height) && (box1.y + box1.height > box2.y);

    if (!overlapX || !overlapY) {
      return null;
    }

    // Cooldown check between consecutive bump events to prevent frame-by-frame repeat
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (this.lastCollisionTime > 0 && now - this.lastCollisionTime < 60) {
      return null;
    }

    // Calculate height difference: lower Y on screen means higher in the air
    // deltaY > 0 means cat1 is higher; deltaY < 0 means cat2 is higher
    const deltaY = cat2.y - cat1.y;
    const absDeltaY = Math.abs(deltaY);

    const contactX = (Math.max(box1.x, box2.x) + Math.min(box1.x + box1.width, box2.x + box2.width)) / 2;
    const contactY = (Math.max(box1.y, box2.y) + Math.min(box1.y + box1.height, box2.y + box2.height)) / 2;

    const HEIGHT_ADVANTAGE_THRESHOLD = 9; // pixels

    if (absDeltaY <= HEIGHT_ADVANTAGE_THRESHOLD) {
      // -------------------------------------------------------------
      // HEAD-ON / EQUAL HEIGHT CLASH (Belly Shove)
      // -------------------------------------------------------------
      // Separate them horizontally along X overlap
      const overlapAmt = (box1.x < box2.x) 
        ? (box1.x + box1.width - box2.x) 
        : (box2.x + box2.width - box1.x);

      const pushSeparation = Math.max(overlapAmt / 2, 2);
      if (cat1.x < cat2.x) {
        cat1.x -= pushSeparation;
        cat2.x += pushSeparation;
      } else {
        cat1.x += pushSeparation;
        cat2.x -= pushSeparation;
      }

      // Mild recoil bounce
      const recoilSpeed = 2.4;
      if (cat1.x < cat2.x) {
        cat1.vx = -recoilSpeed;
        cat2.vx = recoilSpeed;
      } else {
        cat1.vx = recoilSpeed;
        cat2.vx = -recoilSpeed;
      }

      cat1.scaleX = 1.15;
      cat2.scaleX = 1.15;

      this.sound.playShove();
      return {
        higherCat: cat1,
        lowerCat: cat2,
        heightDelta: 0,
        contactX,
        contactY,
        comicText: 'CLASH!',
        shakeMagnitude: 2,
      };
    }

    // -----------------------------------------------------------------
    // HEIGHT ADVANTAGE BUMP: Higher Cat dominates and launches the other!
    // -----------------------------------------------------------------
    const higherCat = deltaY > 0 ? cat1 : cat2;
    const lowerCat = deltaY > 0 ? cat2 : cat1;

    // Push lower cat away horizontally from higher cat
    const pushDirection = (higherCat.x <= lowerCat.x) ? 1 : -1;

    // Pushback scales with height delta
    // Balanced so Mega Bonks are impactful, but do not one-shot from the center
    const baseKnockback = 3.6;
    const knockbackScaling = 0.11;
    const totalKnockback = Math.min(baseKnockback + absDeltaY * knockbackScaling, 7.8);

    // Stun duration scales with height delta (12 frames to 22 frames)
    const dazeFrames = Math.min(12 + Math.floor(absDeltaY * 0.32), 22);

    // Apply knockback to lower cat
    lowerCat.applyKnockback(pushDirection * totalKnockback, -2.4, dazeFrames);

    // Higher cat gets a rewarding upward pounce rebound
    higherCat.pounceBounce();

    // Separate positions slightly so they don't immediately re-collide
    lowerCat.x += pushDirection * 4;

    this.lastCollisionTime = now;

    // Play height-scaled BONK audio
    this.sound.playBonk(absDeltaY);

    // Cute meow from victim on heavy hits
    if (absDeltaY > 22) {
      setTimeout(() => {
        this.sound.playMeow(lowerCat.breed === 'ginger_tabby' ? 1.1 : 0.9);
      }, 70);
    }

    // Determine comic popup text and screen shake based on height delta
    let comicText = 'BONK!';
    let shakeMagnitude = 4;

    if (absDeltaY > 32) {
      comicText = '★ MEGA BONK! ★';
      shakeMagnitude = 10;
    } else if (absDeltaY > 20) {
      comicText = 'POW!';
      shakeMagnitude = 6;
    }

    return {
      higherCat,
      lowerCat,
      heightDelta: absDeltaY,
      contactX,
      contactY,
      comicText,
      shakeMagnitude,
    };
  }
}
