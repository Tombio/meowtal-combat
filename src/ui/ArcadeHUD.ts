import { Cat } from '../entities/Cat';

export type MatchPhase = 
  | 'TITLE'
  | 'ROUND_INTRO' 
  | 'FIGHT' 
  | 'ROUND_OVER' 
  | 'MATCH_OVER';

export class ArcadeHUD {
  public matchPhase: MatchPhase = 'TITLE';
  public currentRound: number = 1;
  public maxRoundsToWin: number = 2; // Best of 3
  public phaseTimer: number = 0;
  public announcementText: string = '';
  public announcementSubtext: string = '';
  public winnerCat: Cat | null = null;
  public matchTimer: number = 60;
  private frameCounter: number = 0;

  public startMatch(): void {
    this.currentRound = 1;
    this.startRoundIntro();
  }

  public startRoundIntro(): void {
    this.matchPhase = 'ROUND_INTRO';
    this.phaseTimer = 110;
    this.matchTimer = 60;
    this.announcementText = this.currentRound === 3 ? 'FINAL ROUND' : `ROUND ${this.currentRound}`;
    this.announcementSubtext = 'HAKKEYOI... NOKOTTA!';
  }

  public triggerRoundOver(_loser: Cat, winner: Cat): void {
    this.matchPhase = 'ROUND_OVER';
    this.phaseTimer = 140;
    this.winnerCat = winner;
    winner.roundsWon++;

    if (winner.roundsWon >= this.maxRoundsToWin) {
      this.announcementText = 'RING OUT!';
      this.announcementSubtext = `${winner.name.toUpperCase()} WINS THE TOURNAMENT!`;
    } else {
      this.announcementText = 'RING OUT!';
      this.announcementSubtext = `${winner.name.toUpperCase()} TAKES THE ROUND!`;
    }
  }

  public update(): void {
    this.frameCounter++;

    if (this.matchPhase === 'ROUND_INTRO') {
      this.phaseTimer--;
      if (this.phaseTimer <= 0) {
        this.matchPhase = 'FIGHT';
      }
    } else if (this.matchPhase === 'FIGHT') {
      // Countdown timer every 60 frames (1 second)
      if (this.frameCounter % 60 === 0 && this.matchTimer > 0) {
        this.matchTimer--;
      }
    } else if (this.matchPhase === 'ROUND_OVER') {
      this.phaseTimer--;
      if (this.phaseTimer <= 0) {
        if (this.winnerCat && this.winnerCat.roundsWon >= this.maxRoundsToWin) {
          this.matchPhase = 'MATCH_OVER';
        } else {
          this.currentRound++;
          this.startRoundIntro();
        }
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, p1: Cat, p2: Cat, canvasWidth: number, canvasHeight: number): void {
    if (this.matchPhase === 'TITLE') {
      this.drawTitleScreen(ctx, canvasWidth, canvasHeight);
      return;
    }

    // 1. Top Arcade HUD Bar
    this.drawTopBar(ctx, p1, p2, canvasWidth);

    // 2. Center Announcements
    if (this.matchPhase === 'ROUND_INTRO') {
      this.drawRoundIntroBanner(ctx, canvasWidth, canvasHeight);
    } else if (this.matchPhase === 'ROUND_OVER') {
      this.drawRoundOverBanner(ctx, canvasWidth, canvasHeight);
    } else if (this.matchPhase === 'MATCH_OVER') {
      this.drawMatchOverScreen(ctx, canvasWidth, canvasHeight);
    }
  }

  private drawTopBar(ctx: CanvasRenderingContext2D, p1: Cat, p2: Cat, width: number): void {
    // Backdrop ribbon
    ctx.fillStyle = 'rgba(18, 9, 32, 0.85)';
    ctx.fillRect(0, 0, width, 54);
    ctx.strokeStyle = '#4a2869';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 54);
    ctx.lineTo(width, 54);
    ctx.stroke();

    // P1 Name & Wins (Left)
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff9800';
    ctx.textAlign = 'left';
    ctx.fillText('★ MOCHI', 24, 26);

    // P1 Golden Fish Win Icons
    for (let i = 0; i < this.maxRoundsToWin; i++) {
      this.drawWinIcon(ctx, 24 + i * 26, 36, i < p1.roundsWon, '#ff9800');
    }

    // Center Timer Box
    const centerX = width / 2;
    ctx.fillStyle = '#ffea00';
    ctx.font = '22px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    const timerStr = this.matchTimer.toString().padStart(2, '0');
    ctx.fillText(timerStr, centerX, 36);

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff80ab';
    ctx.fillText(`ROUND ${this.currentRound}`, centerX, 16);

    // P2 Name & Wins (Right)
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'right';
    ctx.fillText('KURO ★', width - 24, 26);

    // P2 Golden Fish Win Icons
    for (let i = 0; i < this.maxRoundsToWin; i++) {
      this.drawWinIcon(ctx, width - 24 - (this.maxRoundsToWin - 1 - i) * 26, 36, i < p2.roundsWon, '#00e5ff');
    }
  }

  private drawWinIcon(ctx: CanvasRenderingContext2D, x: number, y: number, won: boolean, _playerColor: string): void {
    ctx.save();
    ctx.translate(x, y);
    if (won) {
      // Golden Little Fish / Win Gem
      ctx.fillStyle = '#ffe600';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(8, 6, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Fish tail
      ctx.beginPath();
      ctx.moveTo(15, 6);
      ctx.lineTo(20, 1);
      ctx.lineTo(20, 11);
      ctx.closePath();
      ctx.fill();
      // Fish eye
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(3, 5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Empty slot
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(2, 0, 14, 12);
    }
    ctx.restore();
  }

  private drawRoundIntroBanner(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const centerY = height / 2 - 40;

    ctx.save();
    // Sliding yellow banner
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, centerY - 45, width, 90);

    ctx.textAlign = 'center';

    // Main text ("ROUND 1" / "FINAL ROUND")
    if (this.phaseTimer > 40) {
      ctx.font = '28px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffe600';
      ctx.shadowColor = '#ff6b00';
      ctx.shadowBlur = 15;
      ctx.fillText(this.announcementText, width / 2, centerY - 6);
    } else {
      // "HAKKEYOI... NOKOTTA!" (Ready... Fight!)
      ctx.font = '26px "Press Start 2P", monospace';
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 20;
      ctx.fillText('NOKOTTA! (FIGHT!)', width / 2, centerY - 6);
    }

    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 0;
    ctx.fillText('BUMP FROM ABOVE FOR BIG KNOCKBACK!', width / 2, centerY + 26);

    ctx.restore();
  }

  private drawRoundOverBanner(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const centerY = height / 2 - 40;
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, centerY - 50, width, 100);

    ctx.textAlign = 'center';
    ctx.font = '32px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur = 18;
    ctx.fillText(this.announcementText, width / 2, centerY - 6);

    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffe600';
    ctx.shadowBlur = 0;
    ctx.fillText(this.announcementSubtext, width / 2, centerY + 28);

    ctx.restore();
  }

  private drawMatchOverScreen(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(8, 4, 18, 0.88)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.font = '32px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffe600';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 25;
    ctx.fillText('VICTORY!', width / 2, height / 2 - 70);

    if (this.winnerCat) {
      const color = this.winnerCat.id === 'p1' ? '#ff9800' : '#00e5ff';
      ctx.font = '20px "Press Start 2P", monospace';
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillText(`${this.winnerCat.name.toUpperCase()} IS GRAND CHAMPION!`, width / 2, height / 2 - 20);
    }

    // Blinking prompt
    if (Math.floor(this.frameCounter / 30) % 2 === 0) {
      ctx.font = '13px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fillText('PRESS [SPACE] OR [JUMP] TO REMATCH', width / 2, height / 2 + 55);
    }

    ctx.restore();
  }

  private drawTitleScreen(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    // Dim background
    ctx.fillStyle = 'rgba(12, 6, 24, 0.88)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';

    // Title
    ctx.font = '34px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffe600';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 20;
    ctx.fillText('CHONKY CAT SUMO', width / 2, height / 2 - 110);

    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fillText('★ 2-PLAYER DOHYO BRAWL ★', width / 2, height / 2 - 70);

    // Instructions Box
    ctx.fillStyle = 'rgba(38, 18, 64, 0.85)';
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 2;
    const boxW = 680;
    const boxH = 150;
    const boxX = (width - boxW) / 2;
    const boxY = height / 2 - 45;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText('• BUMP OPPONENT OFF THE DOHYO TO WIN!', width / 2, boxY + 30);
    ctx.fillStyle = '#ff80ab';
    ctx.fillText('• HIGHER CAT AT COLLISION INFLICTS MASSIVE PUSHBACK!', width / 2, boxY + 60);
    ctx.fillStyle = '#69f0ae';
    ctx.fillText('• TIME YOUR JUMP TO LEAP OVER & SWITCH SIDES!', width / 2, boxY + 90);
    ctx.fillStyle = '#ffe600';
    ctx.fillText('• P1: [A / D / W]  |  P2: [ARROWS ← → ↑]', width / 2, boxY + 122);

    // Blinking START
    if (Math.floor(this.frameCounter / 30) % 2 === 0) {
      ctx.font = '15px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffff00';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 12;
      ctx.fillText('INSERT COIN: PRESS [SPACE] TO START', width / 2, height / 2 + 155);
    }

    ctx.restore();
  }
}
