import { InputManager, PlayerId, ActionType } from '../engine/InputManager';

export class KeyConfigModal {
  private inputManager: InputManager;
  private modalEl: HTMLElement;
  private closeBtn: HTMLElement;
  private resetBtn: HTMLElement;
  private keyBtns: NodeListOf<HTMLButtonElement>;

  constructor(inputManager: InputManager) {
    this.inputManager = inputManager;
    this.modalEl = document.getElementById('key-modal') as HTMLElement;
    this.closeBtn = document.getElementById('modal-close-btn') as HTMLElement;
    this.resetBtn = document.getElementById('modal-reset-btn') as HTMLElement;
    this.keyBtns = document.querySelectorAll('.key-bind-btn');

    this.initEvents();
    this.refreshLabels();
  }

  private initEvents(): void {
    this.closeBtn.addEventListener('click', () => this.close());
    this.resetBtn.addEventListener('click', () => {
      this.inputManager.resetDefaults();
      this.refreshLabels();
    });

    this.keyBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const player = btn.dataset.player as PlayerId;
        const action = btn.dataset.action as ActionType;

        // Reset all buttons styling
        this.keyBtns.forEach(b => b.classList.remove('listening'));
        btn.classList.add('listening');
        btn.textContent = 'PRESS KEY...';

        this.inputManager.startRebind(player, action, (keyName) => {
          btn.classList.remove('listening');
          btn.textContent = keyName;
          this.refreshLabels();
        });
      });
    });

    // Close on ESC
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  public open(): void {
    this.refreshLabels();
    this.modalEl.classList.add('active');
  }

  public close(): void {
    this.inputManager.cancelRebind();
    this.keyBtns.forEach(b => b.classList.remove('listening'));
    this.modalEl.classList.remove('active');
  }

  public isOpen(): boolean {
    return this.modalEl.classList.contains('active');
  }

  public toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  public refreshLabels(): void {
    const keyMap = this.inputManager.getKeyMap();
    this.keyBtns.forEach((btn) => {
      const player = btn.dataset.player as PlayerId;
      const action = btn.dataset.action as ActionType;
      const code = keyMap[player][action];
      btn.textContent = this.inputManager.getDisplayKeyName(code);
    });
  }
}
