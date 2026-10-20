import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';

const PeerConstructor: any = (Peer as any)?.Peer || (Peer as any)?.default || Peer;

export type NetworkRole = 'host' | 'guest';

export interface PlayerInputPacket {
  seq: number;
  left: boolean;
  right: boolean;
  jump: boolean;
  turbo?: boolean;
  parry?: boolean;
}

export interface BumpEventPacket {
  id: number;
  comicText: string;
  contactX: number;
  contactY: number;
  isMega: boolean;
  isGiga?: boolean;
  isParry?: boolean;
  shakeMagnitude: number;
  heightDelta: number;
}

export interface NetworkStateSnapshot {
  tick: number;
  p1: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    state: string;
    facing: number;
    scaleX?: number;
    scaleY?: number;
    turboCooldown?: number;
  };
  p2: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    state: string;
    facing: number;
    scaleX?: number;
    scaleY?: number;
    turboCooldown?: number;
  };
  matchPhase: string;
  currentRound: number;
  phaseTimer: number;
  p1Wins: number;
  p2Wins: number;
  p1Ready?: boolean;
  p2Ready?: boolean;
  countdownText?: string;
  bump?: BumpEventPacket | null;
  p1Breed?: string;
  p2Breed?: string;
}

export interface NetworkSignal {
  type: 'START_MATCH' | 'RESTART_ROUND' | 'NEXT_TRACK' | 'BONK_EVENT' | 'PLAYER_READY' | 'CHAR_SELECT';
  payload?: any;
}

export interface PingPacket {
  id: number;
  ts: number;
}

export class NetworkManager {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private role: NetworkRole | null = null;
  private currentRoomId: string | null = null;

  // Ping & RTT latency state
  private pingInterval: any = null;
  private pingSeq: number = 0;
  private currentPingMs: number | null = null;
  private lastPongReceivedAt: number = 0;

  // Callbacks
  public onConnectionChanged: ((connected: boolean, role: NetworkRole, roomId: string) => void) | null = null;
  public onStatusMessage: ((msg: string, isError?: boolean) => void) | null = null;
  public onRemoteInputReceived: ((inputs: PlayerInputPacket) => void) | null = null;
  public onRemoteStateReceived: ((state: NetworkStateSnapshot) => void) | null = null;
  public onRemoteSignalReceived: ((signal: NetworkSignal) => void) | null = null;
  public onPingUpdate: ((pingMs: number) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.leaveRoom();
      });
    }
  }

  public getRole(): NetworkRole | null {
    return this.role;
  }

  public isHost(): boolean {
    return this.role === 'host';
  }

  public isConnected(): boolean {
    return this.conn !== null && this.conn.open;
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

  private createPeerInstance(id?: string): any {
    return new PeerConstructor(id, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    });
  }

  /**
   * Host starts a new room and awaits opponent
   */
  public hostRoom(roomId?: string): string {
    this.leaveRoom();
    const id = (roomId || this.generateRoomCode()).toLowerCase();
    this.role = 'host';
    this.currentRoomId = id;

    if (this.onStatusMessage) {
      this.onStatusMessage(`CONNECTING TO NETWORK AS HOST...`);
    }

    try {
      const peer = this.createPeerInstance(id);
      this.peer = peer;

      peer.on('open', (assignedId: string) => {
        this.currentRoomId = assignedId;
        if (this.onStatusMessage) {
          this.onStatusMessage(`ROOM ${assignedId} READY! WAITING FOR OPPONENT...`);
        }
      });

      peer.on('connection', (connection: DataConnection) => {
        this.conn = connection;
        this.setupConnectionHandlers(connection);
      });

      peer.on('error', (err: any) => {
        console.error('PeerJS Host Error:', err);
        if (err.type === 'unavailable-id') {
          // If ID collision, retry with a fresh code
          const newId = this.generateRoomCode();
          this.hostRoom(newId);
        } else if (this.onStatusMessage) {
          this.onStatusMessage(`NETWORK ERROR: ${err.type || 'Connection failed'}`, true);
        }
      });
    } catch (err) {
      console.error('Failed to create host peer:', err);
    }

    return id;
  }

  /**
   * Guest joins an existing room by code/link
   */
  public joinRoomById(roomId: string): void {
    this.leaveRoom();
    const id = roomId.trim().toLowerCase();
    this.role = 'guest';
    this.currentRoomId = id;

    if (this.onStatusMessage) {
      this.onStatusMessage(`CONNECTING TO ROOM ${id}...`);
    }

    try {
      const peer = this.createPeerInstance();
      this.peer = peer;

      peer.on('open', () => {
        // Connect directly to the host's peer ID
        const connection = peer.connect(id, {
          reliable: false, // low-latency direct UDP for fighting game
        });

        this.conn = connection;
        this.setupConnectionHandlers(connection);
      });

      peer.on('error', (err: any) => {
        console.error('PeerJS Guest Error:', err);
        if (this.onStatusMessage) {
          this.onStatusMessage(`FAILED TO CONNECT: ${err.type || 'Room not found'}`, true);
        }
      });
    } catch (err) {
      console.error('Failed to create guest peer:', err);
    }
  }

  private setupConnectionHandlers(conn: DataConnection): void {
    conn.on('open', () => {
      this.startPingLoop();
      if (this.onConnectionChanged && this.role && this.currentRoomId) {
        this.onConnectionChanged(true, this.role, this.currentRoomId);
      }
    });

    conn.on('data', (raw: any) => {
      if (!raw || typeof raw !== 'object') return;

      if (raw.t === 'inputs' && this.onRemoteInputReceived) {
        this.onRemoteInputReceived(raw.d);
      } else if (raw.t === 'state' && this.onRemoteStateReceived) {
        this.onRemoteStateReceived(raw.d);
      } else if (raw.t === 'signal' && this.onRemoteSignalReceived) {
        this.onRemoteSignalReceived(raw.d);
      } else if (raw.t === 'ping') {
        this.handlePing(raw.d);
      } else if (raw.t === 'pong') {
        this.handlePong(raw.d);
      }
    });

    conn.on('close', () => {
      this.stopPingLoop();
      this.conn = null;
      if (this.onConnectionChanged && this.role && this.currentRoomId) {
        this.onConnectionChanged(false, this.role, this.currentRoomId);
      }
    });

    conn.on('error', (err) => {
      console.error('DataConnection error:', err);
    });
  }

  private startPingLoop(): void {
    this.stopPingLoop();
    this.lastPongReceivedAt = performance.now();
    this.sendPing();
    this.pingInterval = setInterval(() => {
      this.sendPing();

      // Disconnect timeout check: if connected and no pong received for 6 seconds, trigger disconnect
      if (this.conn && this.lastPongReceivedAt > 0 && performance.now() - this.lastPongReceivedAt > 6000) {
        console.warn('Ping timeout: remote peer unreachable');
        this.stopPingLoop();
        if (this.conn) {
          try {
            this.conn.close();
          } catch (e) {}
          this.conn = null;
        }
        if (this.onConnectionChanged && this.role && this.currentRoomId) {
          this.onConnectionChanged(false, this.role, this.currentRoomId);
        }
      }
    }, 500);
  }

  private stopPingLoop(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.currentPingMs = null;
    this.lastPongReceivedAt = 0;
  }

  public sendPing(): void {
    if (this.conn && this.conn.open) {
      this.pingSeq++;
      this.conn.send({
        t: 'ping',
        d: { id: this.pingSeq, ts: performance.now() } as PingPacket,
      });
    }
  }

  public handlePing(packet: PingPacket): void {
    if (!packet || typeof packet.ts !== 'number') return;
    if (this.conn && this.conn.open) {
      this.conn.send({
        t: 'pong',
        d: packet,
      });
    }
  }

  public handlePong(packet: PingPacket): void {
    if (!packet || typeof packet.ts !== 'number') return;
    const now = performance.now();
    const rtt = Math.max(1, Math.round(now - packet.ts));
    this.lastPongReceivedAt = now;

    if (this.currentPingMs === null) {
      this.currentPingMs = rtt;
    } else {
      // 40% prev, 60% new for responsive yet smooth measurement
      this.currentPingMs = Math.round(this.currentPingMs * 0.4 + rtt * 0.6);
    }

    if (this.onPingUpdate) {
      this.onPingUpdate(this.currentPingMs);
    }
  }

  public getPing(): number | null {
    // If no pong received within 4 seconds while connected, indicate timeout / heavy lag
    if (this.currentPingMs !== null && this.lastPongReceivedAt > 0 && performance.now() - this.lastPongReceivedAt > 4000) {
      return 999;
    }
    return this.currentPingMs;
  }

  public sendInputs(packet: PlayerInputPacket): void {
    if (this.conn && this.conn.open) {
      this.conn.send({ t: 'inputs', d: packet });
    }
  }

  public sendState(snapshot: NetworkStateSnapshot): void {
    if (this.conn && this.conn.open && this.isHost()) {
      this.conn.send({ t: 'state', d: snapshot });
    }
  }

  public sendSignal(signal: NetworkSignal): void {
    if (this.conn && this.conn.open) {
      this.conn.send({ t: 'signal', d: signal });
    }
  }

  public leaveRoom(): void {
    this.stopPingLoop();
    if (this.conn) {
      try {
        this.conn.close();
      } catch {
        // ignore
      }
      this.conn = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // ignore
      }
      this.peer = null;
    }

    this.currentRoomId = null;
    this.role = null;
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
