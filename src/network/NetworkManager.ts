// @ts-ignore - trystero/nostr exports joinRoom without explicit d.ts in subpath
import { joinRoom, selfId } from 'trystero/nostr';

export type NetworkRole = 'host' | 'guest';

export interface PlayerInputPacket {
  seq: number;
  left: boolean;
  right: boolean;
  jump: boolean;
}

export interface NetworkStateSnapshot {
  tick: number;
  p1: { x: number; y: number; vx: number; vy: number; state: string; facing: number };
  p2: { x: number; y: number; vx: number; vy: number; state: string; facing: number };
  matchPhase: string;
  currentRound: number;
  phaseTimer: number;
  p1Wins: number;
  p2Wins: number;
}

export interface NetworkSignal {
  type: 'START_MATCH' | 'RESTART_ROUND' | 'NEXT_TRACK' | 'BONK_EVENT';
  payload?: any;
}

export class NetworkManager {
  private room: any = null;
  private role: NetworkRole | null = null;
  private currentRoomId: string | null = null;
  private opponentPeerId: string | null = null;

  // Actions
  private sendInputsAction: ((data: PlayerInputPacket) => void) | null = null;
  private sendStateAction: ((data: NetworkStateSnapshot) => void) | null = null;
  private sendSignalAction: ((data: NetworkSignal) => void) | null = null;

  // Callbacks
  public onConnectionChanged: ((connected: boolean, role: NetworkRole, roomId: string) => void) | null = null;
  public onRemoteInputReceived: ((inputs: PlayerInputPacket) => void) | null = null;
  public onRemoteStateReceived: ((state: NetworkStateSnapshot) => void) | null = null;
  public onRemoteSignalReceived: ((signal: NetworkSignal) => void) | null = null;

  constructor() {}

  public getSelfId(): string {
    return selfId;
  }

  public getRole(): NetworkRole | null {
    return this.role;
  }

  public isHost(): boolean {
    return this.role === 'host';
  }

  public isConnected(): boolean {
    return this.opponentPeerId !== null && this.room !== null;
  }

  public getRoomId(): string | null {
    return this.currentRoomId;
  }

  /**
   * Generates a clean 6-character room code like "cat-8f3e"
   */
  public generateRoomCode(): string {
    const randomHex = Math.random().toString(36).substring(2, 6);
    return `cat-${randomHex}`;
  }

  /**
   * Host starts a new room and awaits opponent
   */
  public hostRoom(roomId?: string): string {
    const id = roomId || this.generateRoomCode();
    this.role = 'host';
    this.connectToRoom(id);
    return id;
  }

  /**
   * Guest joins an existing room by code/link
   */
  public joinRoomById(roomId: string): void {
    this.role = 'guest';
    this.connectToRoom(roomId);
  }

  private connectToRoom(roomId: string): void {
    if (this.room) {
      this.leaveRoom();
    }

    this.currentRoomId = roomId;

    try {
      this.room = joinRoom(
        {
          appId: 'meowtal-combat-sumo',
        },
        roomId
      );

      // Register P2P Actions
      const [sendInputs, getInputs] = this.room.makeAction('inputs');
      const [sendState, getState] = this.room.makeAction('state');
      const [sendSignal, getSignal] = this.room.makeAction('signal');

      this.sendInputsAction = sendInputs;
      this.sendStateAction = sendState;
      this.sendSignalAction = sendSignal;

      getInputs((data: PlayerInputPacket) => {
        if (this.onRemoteInputReceived) {
          this.onRemoteInputReceived(data);
        }
      });

      getState((data: NetworkStateSnapshot) => {
        if (this.onRemoteStateReceived) {
          this.onRemoteStateReceived(data);
        }
      });

      getSignal((data: NetworkSignal) => {
        if (this.onRemoteSignalReceived) {
          this.onRemoteSignalReceived(data);
        }
      });

      this.room.onPeerJoin((peerId: string) => {
        this.opponentPeerId = peerId;
        if (this.onConnectionChanged && this.role && this.currentRoomId) {
          this.onConnectionChanged(true, this.role, this.currentRoomId);
        }
      });

      this.room.onPeerLeave((peerId: string) => {
        if (this.opponentPeerId === peerId) {
          this.opponentPeerId = null;
          if (this.onConnectionChanged && this.role && this.currentRoomId) {
            this.onConnectionChanged(false, this.role, this.currentRoomId);
          }
        }
      });
    } catch (err) {
      console.error('Failed to join decentralized WebRTC room:', err);
    }
  }

  public sendInputs(packet: PlayerInputPacket): void {
    if (this.sendInputsAction && this.isConnected()) {
      this.sendInputsAction(packet);
    }
  }

  public sendState(snapshot: NetworkStateSnapshot): void {
    if (this.sendStateAction && this.isConnected() && this.isHost()) {
      this.sendStateAction(snapshot);
    }
  }

  public sendSignal(signal: NetworkSignal): void {
    if (this.sendSignalAction && this.isConnected()) {
      this.sendSignalAction(signal);
    }
  }

  public leaveRoom(): void {
    if (this.room) {
      try {
        this.room.leave();
      } catch {
        // ignore
      }
      this.room = null;
    }
    this.currentRoomId = null;
    this.opponentPeerId = null;
    this.role = null;
    this.sendInputsAction = null;
    this.sendStateAction = null;
    this.sendSignalAction = null;
  }

  public getShareUrl(roomId: string): string {
    const base = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://example.com/';
    return `${base}#room=${roomId}`;
  }

  public getWhatsAppShareUrl(roomId: string): string {
    const shareUrl = this.getShareUrl(roomId);
    const text = `Meow! Duel me in MEOWTAL COMBAT: ${shareUrl}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  }
}
