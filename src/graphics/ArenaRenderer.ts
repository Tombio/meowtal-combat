import { Arena } from '../entities/Arena';

export class ArenaRenderer {
  private arena: Arena;
  private animTimer: number = 0;

  constructor(arena: Arena) {
    this.arena = arena;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.animTimer++;
    const cfg = this.arena.config;

    // 1. Retro 90s Gradient Background (Shrine / Arcade Night Scene)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, cfg.canvasHeight);
    bgGrad.addColorStop(0, '#120726');
    bgGrad.addColorStop(0.4, '#2d144e');
    bgGrad.addColorStop(0.7, '#49185a');
    bgGrad.addColorStop(1, '#1b092a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cfg.canvasWidth, cfg.canvasHeight);

    // 2. Distant Moon & Stars
    ctx.fillStyle = '#fff9d6';
    ctx.shadowColor = '#ffeaa7';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(150, 90, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Distant mountain / pagoda silhouette
    ctx.fillStyle = 'rgba(20, 8, 38, 0.7)';
    ctx.beginPath();
    ctx.moveTo(0, 360);
    ctx.lineTo(80, 240);
    ctx.lineTo(160, 360);
    ctx.lineTo(240, 280);
    ctx.lineTo(340, 360);
    ctx.lineTo(cfg.canvasWidth, 360);
    ctx.lineTo(cfg.canvasWidth, cfg.canvasHeight);
    ctx.lineTo(0, cfg.canvasHeight);
    ctx.closePath();
    ctx.fill();

    // 3. Hanging Festival Lanterns (Glowing red & gold)
    this.drawLantern(ctx, 80, 35, '#ff2a55');
    this.drawLantern(ctx, 240, 45, '#ffaa00');
    this.drawLantern(ctx, cfg.canvasWidth - 240, 45, '#ffaa00');
    this.drawLantern(ctx, cfg.canvasWidth - 80, 35, '#ff2a55');

    // 4. Cheering Cat Spectator Silhouettes in Background
    this.drawSpectators(ctx, cfg);

    // 5. Pit Below the Platform (Dark abyss / fall zone)
    ctx.fillStyle = '#0d0417';
    ctx.fillRect(0, cfg.ringSurfaceY + cfg.ringThickness, cfg.canvasWidth, cfg.canvasHeight - (cfg.ringSurfaceY + cfg.ringThickness));

    // Bottom warning striping in the pit
    this.drawHazardFloor(ctx, cfg);

    // 6. Elevated Dohyo Platform Body (Earthen / Wood Base)
    const platX = cfg.ringLeft;
    const platY = cfg.ringSurfaceY;
    const platW = cfg.ringRight - cfg.ringLeft;
    const platH = cfg.ringThickness;

    // Wooden base bevel
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(platX - 8, platY, platW + 16, platH);

    // Dark wood grain planks
    ctx.fillStyle = '#5d4037';
    for (let x = platX; x < platX + platW; x += 36) {
      ctx.fillRect(x, platY + 12, 2, platH - 12);
    }

    // Platform bottom trim
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(platX - 10, platY + platH - 8, platW + 20, 8);

    // 7. Dohyo Tatami Surface
    const tatamiGrad = ctx.createLinearGradient(0, platY, 0, platY + 14);
    tatamiGrad.addColorStop(0, '#e4d39c');
    tatamiGrad.addColorStop(1, '#c8b476');
    ctx.fillStyle = tatamiGrad;
    ctx.fillRect(platX, platY, platW, 14);

    // Tatami woven pattern lines
    ctx.fillStyle = 'rgba(160, 140, 80, 0.4)';
    for (let x = platX + 4; x < platX + platW; x += 12) {
      ctx.fillRect(x, platY, 1, 14);
    }

    // 8. Sacred Rope Boundary (Shimenawa) along top edge
    this.drawShimenawa(ctx, platX, platY, platW);

    // 9. Sumo Center Starting Lines (Shikiri-sen)
    const centerX = cfg.canvasWidth / 2;
    ctx.fillStyle = '#ffffff';
    // White starting line 1 (P1 side)
    ctx.fillRect(centerX - 48, platY + 4, 18, 5);
    // White starting line 2 (P2 side)
    ctx.fillRect(centerX + 30, platY + 4, 18, 5);

    // 10. Sacred Salt Piles at Left & Right Edges
    this.drawSaltPile(ctx, platX + 16, platY);
    this.drawSaltPile(ctx, cfg.ringRight - 16, platY);

    // 11. Edge Drop-off Warning Glows
    this.drawEdgeWarnings(ctx, cfg);
  }

  private drawLantern(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
    const swing = Math.sin(this.animTimer * 0.05 + x) * 2;
    ctx.save();
    ctx.translate(x + swing, y);

    // Wire
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Lantern Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    // Lantern Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 16, 14, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lantern Caps
    ctx.fillStyle = '#222';
    ctx.fillRect(-8, -4, 16, 5);
    ctx.fillRect(-8, 32, 16, 5);

    // Japanese Character "猫" (Cat) or Paw on lantern
    ctx.fillStyle = '#ffe600';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('猫', 0, 20);

    ctx.restore();
  }

  private drawSpectators(ctx: CanvasRenderingContext2D, cfg: { canvasWidth: number; ringSurfaceY: number }): void {
    ctx.fillStyle = '#1c0e2d';
    const numCats = 14;
    const spacing = cfg.canvasWidth / numCats;

    for (let i = 0; i < numCats; i++) {
      const sx = i * spacing + 18;
      const bob = Math.sin(this.animTimer * 0.12 + i * 1.3) * 4;
      const sy = cfg.ringSurfaceY - 14 + bob;

      // Cat head silhouette
      ctx.beginPath();
      ctx.arc(sx, sy, 11, 0, Math.PI * 2);
      ctx.fill();

      // Cute pointy silhouette ears
      ctx.beginPath();
      ctx.moveTo(sx - 9, sy - 4);
      ctx.lineTo(sx - 12, sy - 17);
      ctx.lineTo(sx - 2, sy - 9);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sx + 2, sy - 9);
      ctx.lineTo(sx + 12, sy - 17);
      ctx.lineTo(sx + 9, sy - 4);
      ctx.fill();

      // Cheering raised paws
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.arc(sx - 13, sy - 12, 4, 0, Math.PI * 2);
        ctx.arc(sx + 13, sy - 12, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawShimenawa(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
    // Braided straw rope pattern
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x + width, y + 2);
    ctx.stroke();

    // White paper tassels (shide)
    ctx.fillStyle = '#ffffff';
    for (let px = x + 35; px < x + width - 20; px += 55) {
      ctx.beginPath();
      ctx.moveTo(px, y + 2);
      ctx.lineTo(px + 4, y + 10);
      ctx.lineTo(px, y + 14);
      ctx.lineTo(px - 4, y + 6);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawSaltPile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 2);
    ctx.lineTo(x, y - 9);
    ctx.lineTo(x + 8, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawEdgeWarnings(ctx: CanvasRenderingContext2D, cfg: { ringLeft: number; ringRight: number; ringSurfaceY: number }): void {
    const pulse = (Math.sin(this.animTimer * 0.15) + 1) * 0.5;

    // Left Edge Warning Pulse
    ctx.strokeStyle = `rgba(255, 0, 85, ${0.3 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cfg.ringLeft, cfg.ringSurfaceY - 20);
    ctx.lineTo(cfg.ringLeft, cfg.ringSurfaceY + 40);
    ctx.stroke();

    // Right Edge Warning Pulse
    ctx.beginPath();
    ctx.moveTo(cfg.ringRight, cfg.ringSurfaceY - 20);
    ctx.lineTo(cfg.ringRight, cfg.ringSurfaceY + 40);
    ctx.stroke();
  }

  private drawHazardFloor(ctx: CanvasRenderingContext2D, cfg: { canvasWidth: number; canvasHeight: number }): void {
    const y = cfg.canvasHeight - 20;
    ctx.fillStyle = '#1f0d38';
    ctx.fillRect(0, y, cfg.canvasWidth, 20);

    // Cute tatami floor pillows in pit
    ctx.fillStyle = '#ff4081';
    for (let x = 30; x < cfg.canvasWidth; x += 110) {
      ctx.fillRect(x, y - 6, 45, 8);
    }
  }
}
