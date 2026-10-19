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

    // 2. Distant Majestic Mount Fuji (Soft atmospheric silhouette)
    this.drawMountFuji(ctx, 520, cfg.ringSurfaceY - 20);

    // 3. Traditional Multi-Tier Japanese Pagodas (Fainter, soft horizon silhouettes)
    // Left tall 5-tier pagoda silhouetted gently against the moon
    this.drawPagoda(ctx, 115, cfg.ringSurfaceY - 18, 1.25, 5, '#2e144a');

    // Distant center-left 3-tier pagoda (faintest, deepest in the background)
    this.drawPagoda(ctx, 330, cfg.ringSurfaceY - 18, 0.95, 3, '#3a1958');

    // Right 4-tier pagoda framing the arena
    this.drawPagoda(ctx, 845, cfg.ringSurfaceY - 18, 1.15, 4, '#2e144a');

    // Traditional Japanese Pine Trees (Matsu) along the horizon (softened tones)
    this.drawPineTree(ctx, 55, cfg.ringSurfaceY - 18, 1.2, '#28113e');
    this.drawPineTree(ctx, 175, cfg.ringSurfaceY - 18, 0.9, '#2f1448');
    this.drawPineTree(ctx, 385, cfg.ringSurfaceY - 18, 0.85, '#381854'); // distant pine
    this.drawPineTree(ctx, 785, cfg.ringSurfaceY - 18, 1.1, '#2c1244');
    this.drawPineTree(ctx, 905, cfg.ringSurfaceY - 18, 1.0, '#28113e');

    // 3b. Atmospheric Mountain Mist / Evening Haze along the horizon (softens lower skyline)
    const horizonMist = ctx.createLinearGradient(0, cfg.ringSurfaceY - 110, 0, cfg.ringSurfaceY - 15);
    horizonMist.addColorStop(0, 'rgba(73, 24, 90, 0)');
    horizonMist.addColorStop(0.5, 'rgba(73, 24, 90, 0.22)');
    horizonMist.addColorStop(1, 'rgba(73, 24, 90, 0.50)');
    ctx.fillStyle = horizonMist;
    ctx.fillRect(0, cfg.ringSurfaceY - 110, cfg.canvasWidth, 95);

    // 4. Hanging Festival Lanterns (Glowing red & gold)
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

  /**
   * Distant Majestic Mount Fuji with soft snowy peak (faint atmospheric mountain air)
   */
  private drawMountFuji(ctx: CanvasRenderingContext2D, centerX: number, baseY: number): void {
    ctx.save();
    // Soft iconic concave slopes of Mt. Fuji receding peacefully in the distance
    ctx.fillStyle = 'rgba(46, 18, 72, 0.38)';
    ctx.beginPath();
    ctx.moveTo(centerX - 280, baseY);
    ctx.quadraticCurveTo(centerX - 130, baseY - 35, centerX - 48, baseY - 145);
    // Flat volcanic crater crest
    ctx.lineTo(centerX + 48, baseY - 145);
    ctx.quadraticCurveTo(centerX + 130, baseY - 35, centerX + 280, baseY);
    ctx.closePath();
    ctx.fill();

    // Very soft snowy crest highlight gleaming gently in moonlight
    ctx.fillStyle = 'rgba(255, 240, 250, 0.07)';
    ctx.beginPath();
    ctx.moveTo(centerX - 48, baseY - 145);
    ctx.lineTo(centerX + 48, baseY - 145);
    ctx.lineTo(centerX + 70, baseY - 95);
    ctx.lineTo(centerX - 70, baseY - 95);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Traditional Japanese Pagoda Tower with multiple tiered, flared roofs and top spire (Sōrin)
   * Rendered in soft atmospheric tones to remain gentle and non-distracting
   */
  private drawPagoda(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    baseY: number,
    scale: number,
    numTiers: number,
    color: string = '#2e144a'
  ): void {
    ctx.save();
    ctx.fillStyle = color;

    const tierHeight = 23 * scale;
    const baseWidth = 58 * scale;
    const totalHeight = numTiers * tierHeight;
    const topRoofY = baseY - totalHeight;

    // 1. Spire on top (Sōrin)
    const spireH = 36 * scale;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.moveTo(centerX, topRoofY);
    ctx.lineTo(centerX, topRoofY - spireH);
    ctx.stroke();

    // Sacred rings (Kurin) on spire
    ctx.fillStyle = color;
    for (let r = 0; r < 5; r++) {
      const ringY = topRoofY - (12 + r * 4.5) * scale;
      ctx.fillRect(centerX - 4 * scale, ringY, 8 * scale, 2 * scale);
    }
    // Sacred jewel / teardrop (Hōju) on top of spire
    ctx.beginPath();
    ctx.arc(centerX, topRoofY - spireH, 3 * scale, 0, Math.PI * 2);
    ctx.fill();

    // 2. Draw Multiple Tiered Roofs from top to bottom
    for (let t = 0; t < numTiers; t++) {
      // Tiers taper gracefully towards the top
      const progress = t / (numTiers - 1 || 1); // 0 at top tier, 1 at bottom tier
      const tierWidth = baseWidth * (0.64 + 0.36 * progress);
      const tierY = topRoofY + t * tierHeight;
      const roofPeakY = tierY;
      const roofEaveY = tierY + 9 * scale;
      const bodyWidth = tierWidth * 0.46;
      const bodyBottomY = tierY + tierHeight;

      // Tier Body / Tower Walls
      ctx.fillRect(centerX - bodyWidth / 2, roofEaveY, bodyWidth, bodyBottomY - roofEaveY + 2);

      // Flared Pagoda Roof with graceful upturned corners (Sori curves)
      ctx.beginPath();
      // Start at left flared tip
      ctx.moveTo(centerX - tierWidth / 2, roofEaveY - 2.5 * scale);
      // Curve smoothly up to center peak
      ctx.quadraticCurveTo(centerX - tierWidth * 0.25, roofPeakY + 3.5 * scale, centerX, roofPeakY);
      // Curve smoothly down to right flared tip
      ctx.quadraticCurveTo(centerX + tierWidth * 0.25, roofPeakY + 3.5 * scale, centerX + tierWidth / 2, roofEaveY - 2.5 * scale);
      // Eave thickness return
      ctx.lineTo(centerX + tierWidth / 2 - 3 * scale, roofEaveY + 4 * scale);
      ctx.lineTo(centerX - tierWidth / 2 + 3 * scale, roofEaveY + 4 * scale);
      ctx.closePath();
      ctx.fill();

      // Small balcony railing under eave
      ctx.fillRect(centerX - bodyWidth * 0.6, roofEaveY + 7 * scale, bodyWidth * 1.2, 2.5 * scale);
    }

    // Pagoda Foundation / Base
    ctx.fillRect(centerX - baseWidth * 0.55, baseY, baseWidth * 1.1, 10 * scale);

    ctx.restore();
  }

  /**
   * Traditional Japanese Pine Tree (Matsu) with cloud-shaped evergreen foliage
   */
  private drawPineTree(
    ctx: CanvasRenderingContext2D,
    x: number,
    baseY: number,
    scale: number,
    color: string = '#28113e'
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    // Curved trunk
    ctx.beginPath();
    ctx.moveTo(x - 3 * scale, baseY);
    ctx.quadraticCurveTo(x + 2 * scale, baseY - 20 * scale, x - 1 * scale, baseY - 36 * scale);
    ctx.lineTo(x + 4 * scale, baseY - 36 * scale);
    ctx.quadraticCurveTo(x + 6 * scale, baseY - 20 * scale, x + 3 * scale, baseY);
    ctx.closePath();
    ctx.fill();

    // Cloud-shaped pine branch clusters (matsu style)
    const clouds = [
      { ox: -12, oy: -28, r: 12 },
      { ox: 14, oy: -34, r: 11 },
      { ox: -4, oy: -42, r: 14 },
    ];
    for (const c of clouds) {
      ctx.beginPath();
      ctx.ellipse(x + c.ox * scale, baseY + c.oy * scale, c.r * 1.5 * scale, c.r * 0.75 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
