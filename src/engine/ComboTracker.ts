import { PlayerId, InputManager, ActionType } from './InputManager';

export class ComboTracker {
  private player: PlayerId;
  private input: InputManager;

  // Combo state machine
  // State 0: None
  // State 1: First BACK pressed
  // State 2: Second BACK pressed
  private step: 0 | 1 | 2 = 0;
  private stepTimer: number = 0;

  // Maximum allowed interval between consecutive inputs: 20 frames (~333ms at 60 FPS)
  // Total window for back-back-forward is 2 intervals = 40 frames (~666ms)
  public static readonly MAX_INTERVAL_FRAMES = 20;

  constructor(player: PlayerId, input: InputManager) {
    this.player = player;
    this.input = input;
  }

  public reset(): void {
    this.step = 0;
    this.stepTimer = 0;
  }

  /**
   * Evaluates input for this frame. Returns true if the back-back-forward
   * combo was successfully completed on this frame.
   *
   * @param catX X position of the player's cat
   * @param otherCatX X position of the opponent's cat
   */
  public update(catX: number, otherCatX: number): boolean {
    // Relative direction: if opponent is to the right, forward is 'right' and back is 'left'
    const opponentToRight = otherCatX >= catX;
    const backAction: ActionType = opponentToRight ? 'left' : 'right';
    const forwardAction: ActionType = opponentToRight ? 'right' : 'left';

    const backPressed = this.input.isJustPressed(this.player, backAction);
    const forwardPressed = this.input.isJustPressed(this.player, forwardAction);
    const jumpPressed = this.input.isJustPressed(this.player, 'jump');

    // Any jump input interrupts horizontal combo
    if (jumpPressed) {
      this.reset();
      return false;
    }

    // Advance step timer if tracking
    if (this.step > 0) {
      this.stepTimer++;
      if (this.stepTimer > ComboTracker.MAX_INTERVAL_FRAMES) {
        // Timed out, reset
        this.reset();
      }
    }

    switch (this.step) {
      case 0:
        // Waiting for first BACK
        if (backPressed) {
          this.step = 1;
          this.stepTimer = 0;
        }
        break;

      case 1:
        // Waiting for second BACK
        if (backPressed) {
          this.step = 2;
          this.stepTimer = 0;
        } else if (forwardPressed) {
          // Incompatible intermediate press, restart or reset
          this.reset();
        }
        break;

      case 2:
        // Waiting for final FORWARD
        if (forwardPressed) {
          this.reset();
          return true; // COMBO TRIGGERED!
        } else if (backPressed) {
          // Another back press keeps us at step 2 with refreshed timer
          this.step = 2;
          this.stepTimer = 0;
        }
        break;
    }

    return false;
  }
}
