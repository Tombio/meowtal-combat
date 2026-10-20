import { Cat } from '../entities/Cat';
import { Arena } from '../entities/Arena';
import { InputManager } from './InputManager';

export type CPUDifficulty = 'easy' | 'normal' | 'hard';

export class CPUController {
  public difficulty: CPUDifficulty = 'normal';
  private input: InputManager;
  private turboTriggerCallback: (() => void) | null = null;

  constructor(input: InputManager) {
    this.input = input;
  }

  public setDifficulty(diff: CPUDifficulty): void {
    this.difficulty = diff;
  }

  public setOnTurboTrigger(cb: () => void): void {
    this.turboTriggerCallback = cb;
  }

  public reset(): void {
    this.input.setVirtualAction('p2', 'left', false);
    this.input.setVirtualAction('p2', 'right', false);
    this.input.setVirtualAction('p2', 'jump', false);
    this.input.setVirtualAction('p2', 'parry', false);
  }

  public update(cpuCat: Cat, playerCat: Cat, arena: Arena): void {
    // If CPU is defeated, ring-out, or match is stopped, clear inputs
    if (cpuCat.state === 'RING_OUT' || cpuCat.state === 'DAZED' || cpuCat.state === 'TURBO_DASH') {
      this.input.setVirtualAction('p2', 'left', false);
      this.input.setVirtualAction('p2', 'right', false);
      this.input.setVirtualAction('p2', 'jump', false);
      this.input.setVirtualAction('p2', 'parry', false);
      return;
    }

    const ringLeft = arena.config.ringLeft;
    const ringRight = arena.config.ringRight;

    const cpuCenter = cpuCat.x + cpuCat.width / 2;
    const playerCenter = playerCat.x + playerCat.width / 2;
    const distToPlayer = Math.abs(cpuCenter - playerCenter);
    const playerToLeft = playerCenter < cpuCenter;

    // Platform edge danger detection
    const nearLeftEdge = cpuCenter < ringLeft + 65;
    const nearRightEdge = cpuCenter > ringRight - 65;

    let moveLeft = false;
    let moveRight = false;
    let jump = false;
    let parry = false;

    if (this.difficulty === 'easy') {
      // -------------------------------------------------------------
      // EASY (Chonky Kitten): Casual, wanders towards center, slow
      // -------------------------------------------------------------
      if (nearLeftEdge) {
        moveRight = true;
      } else if (nearRightEdge) {
        moveLeft = true;
      } else {
        // Slowly track player with pauses
        if (Math.random() < 0.65) {
          if (playerToLeft) moveLeft = true;
          else moveRight = true;
        }
      }

      // Random occasional jump
      if (Math.random() < 0.015 && cpuCat.isGrounded) {
        jump = true;
      }

    } else if (this.difficulty === 'normal') {
      // -------------------------------------------------------------
      // NORMAL (Sensei Neko): Good spacing, edge avoidance, smart jumps
      // -------------------------------------------------------------
      if (nearLeftEdge) {
        moveRight = true;
        if (cpuCat.isGrounded && Math.random() < 0.2) jump = true;
      } else if (nearRightEdge) {
        moveLeft = true;
        if (cpuCat.isGrounded && Math.random() < 0.2) jump = true;
      } else {
        // Maintain 80px distance or advance
        if (distToPlayer > 110) {
          if (playerToLeft) moveLeft = true;
          else moveRight = true;
        } else if (distToPlayer < 45) {
          // Push back or jump over
          if (playerToLeft) moveRight = true;
          else moveLeft = true;
        } else {
          // Stalk
          if (Math.random() < 0.5) {
            if (playerToLeft) moveLeft = true;
            else moveRight = true;
          }
        }
      }

      // Jump when player is close and grounded
      if (distToPlayer < 120 && cpuCat.isGrounded) {
        if (playerCat.state === 'TURBO_DASH') {
          // 50% chance to jump over Turbo Attack
          if (Math.random() < 0.5) jump = true;
        } else if (playerCat.vy < -2 && Math.random() < 0.35) {
          // Counter-jump when player jumps
          jump = true;
        } else if (Math.random() < 0.02) {
          jump = true;
        }
      }

      // Defensive parry chance when player approaches for clash
      if (distToPlayer < 75 && cpuCat.canParry() && Math.random() < 0.25) {
        parry = true;
      }

    } else {
      // -------------------------------------------------------------
      // HARD (Grandmaster Shihan): Reads attacks, reactive counters
      // -------------------------------------------------------------
      // Reactive Turbo Attack Dodge: clean vault over player's charge!
      if (playerCat.state === 'TURBO_DASH' && cpuCat.isGrounded && distToPlayer < 200) {
        jump = true;
      }

      // Punish dazed or whiffed player with Turbo Attack!
      if ((playerCat.state === 'DAZED' || playerCat.state === 'PARRY_WHIFF') &&
          distToPlayer > 60 && distToPlayer < 170 && cpuCat.canTurboAttack()) {
        if (this.turboTriggerCallback) {
          this.turboTriggerCallback();
        }
      }

      // Parry incoming close attacks
      if (distToPlayer < 75 && cpuCat.canParry()) {
        const playerApproaching = (playerToLeft && playerCat.vx > 0.5) || (!playerToLeft && playerCat.vx < -0.5);
        if (playerApproaching || playerCat.state === 'TURBO_DASH') {
          if (Math.random() < 0.75) {
            parry = true;
          }
        }
      }

      // Edge recovery
      if (nearLeftEdge) {
        moveRight = true;
        if (cpuCat.isGrounded) jump = true;
      } else if (nearRightEdge) {
        moveLeft = true;
        if (cpuCat.isGrounded) jump = true;
      } else {
        // Optimal combat spacing: 70px to 100px
        if (distToPlayer > 95) {
          if (playerToLeft) moveLeft = true;
          else moveRight = true;
        } else if (distToPlayer < 60) {
          if (playerToLeft) moveRight = true;
          else moveLeft = true;
        } else {
          // Circle and jump-strike
          if (cpuCat.isGrounded && Math.random() < 0.04) {
            jump = true;
          }
        }
      }
    }

    // Apply to InputManager virtual actions
    this.input.setVirtualAction('p2', 'left', moveLeft);
    this.input.setVirtualAction('p2', 'right', moveRight);
    this.input.setVirtualAction('p2', 'jump', jump);
    this.input.setVirtualAction('p2', 'parry', parry);
  }
}
