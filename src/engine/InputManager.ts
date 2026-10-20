export type PlayerId = 'p1' | 'p2';
export type ActionType = 'left' | 'right' | 'jump' | 'parry';

export interface KeyMap {
  left: string;
  right: string;
  jump: string;
  parry: string;
}

export const DEFAULT_KEY_MAP: Record<PlayerId, KeyMap> = {
  p1: {
    left: 'KeyA',
    right: 'KeyD',
    jump: 'KeyW',
    parry: 'KeyS',
  },
  p2: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    jump: 'ArrowUp',
    parry: 'ArrowDown',
  },
};

export class InputManager {
  private keyMap: Record<PlayerId, KeyMap>;
  private heldKeys: Set<string> = new Set();
  private justPressedKeys: Set<string> = new Set();
  private listeningForRebind: { player: PlayerId; action: ActionType; callback: (keyName: string) => void } | null = null;
  private virtualDown: Record<PlayerId, Record<ActionType, boolean>> = {
    p1: { left: false, right: false, jump: false, parry: false },
    p2: { left: false, right: false, jump: false, parry: false },
  };
  private virtualJustPressed: Record<PlayerId, Record<ActionType, boolean>> = {
    p1: { left: false, right: false, jump: false, parry: false },
    p2: { left: false, right: false, jump: false, parry: false },
  };
  private activeRole: 'host' | 'guest' | null = null;

  public setActiveRole(role: 'host' | 'guest' | null): void {
    this.activeRole = role;
  }

  public getActiveRole(): 'host' | 'guest' | null {
    return this.activeRole;
  }

  constructor() {
    this.keyMap = this.loadKeyMap();
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => this.handleKeyDown(e));
      window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
  }

  private loadKeyMap(): Record<PlayerId, KeyMap> {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('cat_sumo_keymap');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.p1 && parsed.p2) {
            return parsed;
          }
        }
      }
    } catch {
      // fallback to default
    }
    return JSON.parse(JSON.stringify(DEFAULT_KEY_MAP));
  }

  public saveKeyMap(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('cat_sumo_keymap', JSON.stringify(this.keyMap));
      }
    } catch {
      // ignore
    }
  }

  public resetDefaults(): void {
    this.keyMap = JSON.parse(JSON.stringify(DEFAULT_KEY_MAP));
    this.saveKeyMap();
  }

  public getKeyMap(): Record<PlayerId, KeyMap> {
    return this.keyMap;
  }

  public startRebind(player: PlayerId, action: ActionType, callback: (keyName: string) => void): void {
    this.listeningForRebind = { player, action, callback };
  }

  public cancelRebind(): void {
    this.listeningForRebind = null;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Intercept if listening for rebind
    if (this.listeningForRebind) {
      if (e.code === 'Escape') {
        this.cancelRebind();
        return;
      }
      e.preventDefault();
      const code = e.code;
      this.keyMap[this.listeningForRebind.player][this.listeningForRebind.action] = code;
      this.saveKeyMap();
      this.listeningForRebind.callback(this.getDisplayKeyName(code));
      this.listeningForRebind = null;
      return;
    }

    // Normal gameplay keys
    if (!this.heldKeys.has(e.code)) {
      this.justPressedKeys.add(e.code);
    }
    this.heldKeys.add(e.code);

    // Prevent default scrolling for game keys like ArrowUp, ArrowDown, Space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.heldKeys.delete(e.code);
  }

  public setVirtualAction(player: PlayerId, action: ActionType, isDown: boolean): void {
    if (isDown) {
      if (!this.virtualDown[player][action]) {
        this.virtualJustPressed[player][action] = true;
      }
      this.virtualDown[player][action] = true;
    } else {
      this.virtualDown[player][action] = false;
    }
  }

  public getPlayerActions(player: PlayerId): { left: boolean; right: boolean; jump: boolean } {
    return {
      left: this.isDown(player, 'left'),
      right: this.isDown(player, 'right'),
      jump: this.isDown(player, 'jump'),
    };
  }

  public isDown(player: PlayerId, action: ActionType): boolean {
    // In online mode: Host strictly ignores keyboard for P2; Guest strictly ignores keyboard for P1
    if (this.activeRole === 'host' && player === 'p2') {
      return !!this.virtualDown.p2[action];
    }
    if (this.activeRole === 'guest' && player === 'p1') {
      return !!this.virtualDown.p1[action];
    }

    const code = this.keyMap[player][action];
    let keyMatches = this.heldKeys.has(code);

    // On guest, allow WASD as well as Arrow keys for P2
    if (this.activeRole === 'guest' && player === 'p2') {
      const p1Code = this.keyMap.p1[action];
      keyMatches = keyMatches || this.heldKeys.has(p1Code);
    }

    return keyMatches || !!this.virtualDown[player][action];
  }

  public isJustPressed(player: PlayerId, action: ActionType): boolean {
    // In online mode: Host strictly ignores keyboard for P2; Guest strictly ignores keyboard for P1
    if (this.activeRole === 'host' && player === 'p2') {
      return !!this.virtualJustPressed.p2[action];
    }
    if (this.activeRole === 'guest' && player === 'p1') {
      return !!this.virtualJustPressed.p1[action];
    }

    const code = this.keyMap[player][action];
    let keyMatches = this.justPressedKeys.has(code);

    if (this.activeRole === 'guest' && player === 'p2') {
      const p1Code = this.keyMap.p1[action];
      keyMatches = keyMatches || this.justPressedKeys.has(p1Code);
    }

    return keyMatches || !!this.virtualJustPressed[player][action];
  }

  /**
   * Checks if any action (left, right, or jump) was just pressed for the player,
   * respecting role isolation and virtual inputs.
   */
  public isPlayerActionJustPressed(player: PlayerId): boolean {
    return this.isJustPressed(player, 'left') ||
           this.isJustPressed(player, 'right') ||
           this.isJustPressed(player, 'jump') ||
           this.isJustPressed(player, 'parry');
  }

  /**
   * Checks if a given physical keyboard code is mapped to any action for the player.
   */
  public isKeyForPlayer(code: string, player: PlayerId): boolean {
    // In online mode: host physical keyboard is only for P1, guest physical keyboard is only for P2
    if (this.activeRole === 'host' && player === 'p2') {
      return false;
    }
    if (this.activeRole === 'guest' && player === 'p1') {
      return false;
    }

    const map = this.keyMap[player];
    let matches = code === map.left || code === map.right || code === map.jump || code === map.parry;

    // On guest, allow WASD for P2 as well
    if (this.activeRole === 'guest' && player === 'p2') {
      const p1Map = this.keyMap.p1;
      matches = matches || code === p1Map.left || code === p1Map.right || code === p1Map.jump || code === p1Map.parry;
    }

    return matches;
  }

  /**
   * Clears just pressed keys at end of each frame
   */
  public update(): void {
    this.justPressedKeys.clear();
    this.virtualJustPressed.p1.left = false;
    this.virtualJustPressed.p1.right = false;
    this.virtualJustPressed.p1.jump = false;
    this.virtualJustPressed.p1.parry = false;
    this.virtualJustPressed.p2.left = false;
    this.virtualJustPressed.p2.right = false;
    this.virtualJustPressed.p2.jump = false;
    this.virtualJustPressed.p2.parry = false;
  }

  public getDisplayKeyName(code: string): string {
    if (code.startsWith('Key')) return code.substring(3);
    if (code.startsWith('Digit')) return code.substring(5);
    if (code === 'ArrowLeft') return '←';
    if (code === 'ArrowRight') return '→';
    if (code === 'ArrowUp') return '↑';
    if (code === 'ArrowDown') return '↓';
    if (code === 'Space') return 'SPACE';
    return code;
  }
}
