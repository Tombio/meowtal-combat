import { InputManager, PlayerId, ActionType } from '../engine/InputManager';

export class TouchController {
  private input: InputManager;
  private container: HTMLElement | null = null;
  private activePlayer: PlayerId = 'p1';
  private isVisible: boolean = false;

  constructor(input: InputManager) {
    this.input = input;
    this.init();
  }

  private init(): void {
    this.container = document.getElementById('touch-controls-container');
    if (!this.container) return;

    this.bindButton('touch-btn-left', 'left');
    this.bindButton('touch-btn-right', 'right');
    this.bindButton('touch-btn-jump', 'jump');
    this.bindButton('touch-btn-parry', 'parry');

    // Auto-show on mobile touch devices (phones, tablets, standalone PWAs)
    const isMobileTouchDevice =
      ('ontouchstart' in window) ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
      (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);

    if (isMobileTouchDevice) {
      this.show();
      const btnTouch = document.getElementById('btn-touch');
      if (btnTouch) {
        btnTouch.textContent = 'TOUCH ON';
      }
    }
  }

  public setActivePlayer(player: PlayerId): void {
    this.activePlayer = player;
  }

  public toggle(): boolean {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
    return this.isVisible;
  }

  public show(): void {
    if (this.container) {
      this.container.style.display = 'flex';
      this.isVisible = true;
    }
  }

  public hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
      this.isVisible = false;
      // Reset any stuck touch down states
      this.input.setVirtualAction('p1', 'left', false);
      this.input.setVirtualAction('p1', 'right', false);
      this.input.setVirtualAction('p1', 'jump', false);
      this.input.setVirtualAction('p1', 'parry', false);
      this.input.setVirtualAction('p2', 'left', false);
      this.input.setVirtualAction('p2', 'right', false);
      this.input.setVirtualAction('p2', 'jump', false);
      this.input.setVirtualAction('p2', 'parry', false);
    }
  }

  public getIsOpen(): boolean {
    return this.isVisible;
  }

  private bindButton(elementId: string, action: ActionType): void {
    const btn = document.getElementById(elementId);
    if (!btn) return;

    const startAction = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.input.setVirtualAction(this.activePlayer, action, true);
      btn.classList.add('active');

      if (action === 'jump') {
        try {
          navigator.vibrate?.(12);
        } catch {
          // ignore
        }
      }
    };

    const endAction = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.input.setVirtualAction(this.activePlayer, action, false);
      btn.classList.remove('active');
    };

    btn.addEventListener('pointerdown', startAction);
    btn.addEventListener('pointerup', endAction);
    btn.addEventListener('pointercancel', endAction);
    btn.addEventListener('pointerleave', endAction);

    // Prevent context menu or dragging
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}
