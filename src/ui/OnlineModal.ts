import { NetworkManager, NetworkRole } from '../network/NetworkManager';

export class OnlineModal {
  private network: NetworkManager;
  private modalEl: HTMLElement | null = null;
  private statusTextEl: HTMLElement | null = null;
  private roomCodeEl: HTMLElement | null = null;
  private copyBtnEl: HTMLElement | null = null;
  private whatsappBtnEl: HTMLAnchorElement | null = null;
  private joinInputEl: HTMLInputElement | null = null;
  private joinBtnEl: HTMLElement | null = null;
  private hostBtnEl: HTMLElement | null = null;
  private closeBtnEl: HTMLElement | null = null;
  private shareSectionEl: HTMLElement | null = null;
  private initialSectionEl: HTMLElement | null = null;

  private onGameStartCallback: (() => void) | null = null;
  public onOpponentLeft: (() => void) | null = null;
  public onClose: (() => void) | null = null;

  constructor(network: NetworkManager, onGameStart?: () => void) {
    this.network = network;
    if (onGameStart) this.onGameStartCallback = onGameStart;
    this.init();
  }

  private init(): void {
    this.modalEl = document.getElementById('online-modal');
    this.statusTextEl = document.getElementById('online-status-text');
    this.roomCodeEl = document.getElementById('online-room-code');
    this.copyBtnEl = document.getElementById('btn-copy-link');
    this.whatsappBtnEl = document.getElementById('btn-whatsapp-share') as HTMLAnchorElement;
    this.joinInputEl = document.getElementById('online-room-input') as HTMLInputElement;
    this.joinBtnEl = document.getElementById('btn-join-room');
    this.hostBtnEl = document.getElementById('btn-host-room');
    this.closeBtnEl = document.getElementById('btn-close-online');
    this.shareSectionEl = document.getElementById('online-share-section');
    this.initialSectionEl = document.getElementById('online-initial-section');

    this.hostBtnEl?.addEventListener('click', () => this.handleHost());
    this.joinBtnEl?.addEventListener('click', () => this.handleJoin());
    this.closeBtnEl?.addEventListener('click', () => {
      this.network.leaveRoom();
      if (this.onClose) {
        this.onClose();
      }
      this.close();
    });
    this.copyBtnEl?.addEventListener('click', () => this.handleCopy());

    // Network connection callbacks
    this.network.onConnectionChanged = (connected: boolean, role: NetworkRole, roomId: string) => {
      this.handleConnectionChanged(connected, role, roomId);
    };

    this.network.onStatusMessage = (msg: string, isError?: boolean) => {
      if (this.statusTextEl) {
        this.statusTextEl.textContent = msg;
        this.statusTextEl.className = isError ? 'online-status-error' : 'online-status-waiting';
      }
    };
  }

  public open(autoRoomId?: string): void {
    if (!this.modalEl) return;
    this.modalEl.style.display = 'flex';

    if (autoRoomId) {
      // Auto join from URL hash
      this.joinSpecificRoom(autoRoomId);
    } else {
      this.resetView();
    }
  }

  public close(): void {
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
    }
  }

  public isOpen(): boolean {
    return this.modalEl ? this.modalEl.style.display === 'flex' : false;
  }

  private resetView(): void {
    if (this.initialSectionEl) this.initialSectionEl.style.display = 'block';
    if (this.shareSectionEl) this.shareSectionEl.style.display = 'none';
    if (this.statusTextEl) this.statusTextEl.textContent = 'HOST A ROOM OR JOIN VIA LINK';
    if (this.statusTextEl) this.statusTextEl.className = 'online-status-neutral';
  }

  private handleHost(): void {
    const roomId = this.network.hostRoom();
    this.displayShareInfo(roomId);
  }

  private handleJoin(): void {
    const rawVal = this.joinInputEl?.value?.trim() || '';
    if (!rawVal) return;

    let roomId = rawVal;
    // Extract room id if user pasted a full URL
    if (rawVal.includes('#room=')) {
      roomId = rawVal.split('#room=')[1].split('&')[0];
    } else if (rawVal.includes('room=')) {
      roomId = rawVal.split('room=')[1].split('&')[0];
    }

    this.joinSpecificRoom(roomId);
  }

  public joinSpecificRoom(roomId: string): void {
    this.network.joinRoomById(roomId);
    if (this.initialSectionEl) this.initialSectionEl.style.display = 'none';
    if (this.shareSectionEl) this.shareSectionEl.style.display = 'block';
    if (this.roomCodeEl) this.roomCodeEl.textContent = roomId;
    if (this.statusTextEl) {
      this.statusTextEl.textContent = `JOINING ROOM ${roomId}... CONNECTING PEER...`;
      this.statusTextEl.className = 'online-status-waiting';
    }
  }

  private displayShareInfo(roomId: string): void {
    if (this.initialSectionEl) this.initialSectionEl.style.display = 'none';
    if (this.shareSectionEl) this.shareSectionEl.style.display = 'block';
    if (this.roomCodeEl) this.roomCodeEl.textContent = roomId;

    const waUrl = this.network.getWhatsAppShareUrl(roomId);

    if (this.whatsappBtnEl) {
      this.whatsappBtnEl.href = waUrl;
      this.whatsappBtnEl.target = '_blank';
    }

    if (this.statusTextEl) {
      this.statusTextEl.textContent = 'ROOM READY! WAITING FOR OPPONENT...';
      this.statusTextEl.className = 'online-status-waiting';
    }
  }

  private handleCopy(): void {
    const roomId = this.network.getRoomId();
    if (!roomId) return;
    const shareUrl = this.network.getShareUrl(roomId);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        if (this.copyBtnEl) {
          const original = this.copyBtnEl.textContent;
          this.copyBtnEl.textContent = '✔ COPIED!';
          setTimeout(() => {
            if (this.copyBtnEl) this.copyBtnEl.textContent = original;
          }, 2000);
        }
      });
    }

    // Try native Web Share API on mobile if supported
    if (navigator.share) {
      navigator.share({
        title: 'MEOWTAL COMBAT',
        text: 'Meow! Duel me in MEOWTAL COMBAT:',
        url: shareUrl,
      }).catch(() => {
        // user cancelled or share failed, clipboard already copied
      });
    }
  }

  private handleConnectionChanged(connected: boolean, role: NetworkRole, roomId: string): void {
    if (connected) {
      if (this.statusTextEl) {
        this.statusTextEl.textContent = `🎉 OPPONENT CONNECTED! YOU ARE ${role === 'host' ? 'P1 (MOCHI)' : 'P2 (KURO)'}!`;
        this.statusTextEl.className = 'online-status-connected';
      }

      setTimeout(() => {
        this.close();
        if (this.onGameStartCallback) {
          this.onGameStartCallback();
        }
      }, 1400);
    } else {
      // Opponent left / disconnected -> return to lobby
      if (this.onOpponentLeft) {
        this.onOpponentLeft();
      }

      if (this.modalEl) {
        this.modalEl.style.display = 'flex';
      }

      if (role === 'host') {
        const id = this.network.getRoomId() || roomId;
        this.displayShareInfo(id);
        if (this.statusTextEl) {
          this.statusTextEl.textContent = 'OPPONENT LEFT. WAITING IN LOBBY FOR CHALLENGER...';
          this.statusTextEl.className = 'online-status-waiting';
        }
      } else {
        this.resetView();
        if (this.statusTextEl) {
          this.statusTextEl.textContent = 'HOST DISCONNECTED. RETURNED TO LOBBY.';
          this.statusTextEl.className = 'online-status-error';
        }
      }
    }
  }
}
