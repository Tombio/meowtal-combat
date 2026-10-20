import { Arena, ArenaStage } from '../entities/Arena';

export class ArenaRenderer {
  private arena: Arena;
  private animTimer: number = 0;
  public lightningFlash: number = 0;
  private rainDrops: Array<{ x: number; y: number; speed: number; len: number }> = [];

  constructor(arena: Arena) {
    this.arena = arena;
    // Pre-populate rain drops for Thunder Shrine
    for (let i = 0; i < 60; i++) {
      this.rainDrops.push({
        x: Math.random() * 960,
        y: Math.random() * 540,
        speed: 12 + Math.random() * 8,
        len: 14 + Math.random() * 10,
      });
    }
  }

  public triggerLightning(intensity = 0.85): void {
    this.lightningFlash = Math.max(this.lightningFlash, intensity);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.animTimer++;
    const cfg = this.arena.config;
    const stage = this.arena.currentStage;

    // 1. Stage Background
    if (stage === 'cyberpunk') {
      this.drawCyberpunkBackground(ctx, cfg);
    } else if (stage === 'thunder') {
      this.drawThunderBackground(ctx, cfg);
    } else {
      this.drawDojoBackground(ctx, cfg);
    }

    // 2. Pit Below the Platform (Dark abyss / fall zone)
    ctx.fillStyle = stage === 'cyberpunk' ? '#04020a' : '#0d0417';
    ctx.fillRect(0, cfg.ringSurfaceY + cfg.ringThickness, cfg.canvasWidth, cfg.canvasHeight - (cfg.ringSurfaceY + cfg.ringThickness));

    // Bottom warning striping in the pit
    this.drawHazardFloor(ctx, cfg);

    // 3. Elevated Dohyo Platform Body
    this.drawPlatform(ctx, cfg, stage);

    // 4. Rain weather overlay if Thunder stage
    if (stage === 'thunder') {
      this.drawRain(ctx, cfg);
    }

    // 5. Lightning flash overlay
    if (this.lightningFlash > 0.02) {
      ctx.save();
      ctx.fillStyle = `rgba(220, 240, 255, ${this.lightningFlash})`;
      ctx.fillRect(0, 0, cfg.canvasWidth, cfg.canvasHeight);
      ctx.restore();
      this.lightningFlash *= 0.82; // fast lightning fade
    }
  }

  private drawDojoBackground(ctx: CanvasRenderingContext2D, cfg: any): void {
    // Retro 90s Sunset Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, cfg.canvasHeight);
    bgGrad.addColorStop(0, '#120726');
    bgGrad.addColorStop(0.4, '#2d144e');
    bgGrad.addColorStop(0.7, '#49185a');
    bgGrad.addColorStop(1, '#1b092a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cfg.canvasWidth, cfg.canvasHeight);

    // Distant Moon
    ctx.fillStyle = '#fff9d6';
    ctx.shadowColor = '#ffeaa7';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(150, 90, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Distant Majestic Mount Fuji
    this.drawMountFuji(ctx, 520, cfg.ringSurfaceY - 20);

    // Pagodas & Pines
    this.drawPagoda(ctx, 115, cfg.ringSurfaceY - 18, 1.25, 5, '#2e144a');
    this.drawPagoda(ctx, 330, cfg.ringSurfaceY - 18, 0.95, 3, '#3a1958');
    this.drawPagoda(ctx, 845, cfg.ringSurfaceY - 18, 1.15, 4, '#2e144a');

    this.drawPineTree(ctx, 55, cfg.ringSurfaceY - 18, 1.2, '#28113e');
    this.drawPineTree(ctx, 175, cfg.ringSurfaceY - 18, 0.9, '#2f1448');
    this.drawPineTree(ctx, 385, cfg.ringSurfaceY - 18, 0.85, '#381854');
    this.drawPineTree(ctx, 785, cfg.ringSurfaceY - 18, 1.1, '#2c1244');
    this.drawPineTree(ctx, 905, cfg.ringSurfaceY - 18, 1.0, '#28113e');

    // Hanging Festival Lanterns
    this.drawLantern(ctx, 80, 35, '#ff2a55');
    this.drawLantern(ctx, 240, 45, '#ffaa00');
    this.drawLantern(ctx, cfg.canvasWidth - 240, 45, '#ffaa00');
    this.drawLantern(ctx, cfg.canvasWidth - 80, 35, '#ff2a55');
  }

  private drawCyberpunkBackground(ctx: CanvasRenderingContext2D, cfg: any): void {
    // Deep Synthwave Cyber Night
    const bgGrad = ctx.createLinearGradient(0, 0, 0, cfg.canvasHeight);
    bgGrad.addColorStop(0, '#04020a');
    bgGrad.addColorStop(0.3, '#0b061c');
    bgGrad.addColorStop(0.7, '#1b0933');
    bgGrad.addColorStop(1, '#051026');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cfg.canvasWidth, cfg.canvasHeight);

    // Cyberpunk Skyscrapers Skyline
    const buildings = [
      { x: 30, w: 90, h: 260, color: '#0d0722' },
      { x: 130, w: 80, h: 320, color: '#13092e' },
      { x: 220, w: 110, h: 230, color: '#0b051f' },
      { x: 640, w: 100, h: 290, color: '#12082b' },
      { x: 750, w: 85, h: 340, color: '#150a33' },
      { x: 845, w: 95, h: 240, color: '#0c0620' },
    ];

    buildings.forEach((b) => {
      const topY = cfg.ringSurfaceY - b.h;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, topY, b.w, b.h);

      // Window grid lights
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      for (let wy = topY + 20; wy < cfg.ringSurfaceY - 40; wy += 18) {
        for (let wx = b.x + 12; wx < b.x + b.w - 12; wx += 16) {
          if ((wx + wy * 3) % 7 === 0) {
            ctx.fillStyle = (wx + wy) % 5 === 0 ? 'rgba(255, 0, 128, 0.65)' : 'rgba(0, 240, 255, 0.55)';
            ctx.fillRect(wx, wy, 8, 10);
          }
        }
      }
    });

    // Giant Glowing Holographic Billboard: 猫 (NEKO / CAT)
    ctx.save();
    ctx.font = 'bold 54px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff00aa';
    ctx.shadowBlur = 24;
    ctx.fillText('猫', 170, cfg.ringSurfaceY - 210);

    // Billboard 2: 勝利 (VICTORY)
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 24;
    ctx.fillText('勝', 790, cfg.ringSurfaceY - 220);

    // Horizontal Neon Marquee Banner
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffe600';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 10;
    ctx.fillText('NEO-DOHYO 2099', 480, 65);
    ctx.restore();

    // Floating Holographic Koi Fish
    const koiX = 480 + Math.sin(this.animTimer * 0.02) * 140;
    const koiY = 120 + Math.cos(this.animTimer * 0.03) * 20;
    ctx.save();
    ctx.translate(koiX, koiY);
    ctx.scale(Math.cos(this.animTimer * 0.02) >= 0 ? 1 : -1, 1);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(-40, -12);
    ctx.lineTo(-40, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawThunderBackground(ctx: CanvasRenderingContext2D, cfg: any): void {
    // Stormy Dark Indigo Sky
    const bgGrad = ctx.createLinearGradient(0, 0, 0, cfg.canvasHeight);
    bgGrad.addColorStop(0, '#06030e');
    bgGrad.addColorStop(0.4, '#100a26');
    bgGrad.addColorStop(0.8, '#180d38');
    bgGrad.addColorStop(1, '#0c071d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cfg.canvasWidth, cfg.canvasHeight);

    // Dark brooding thunderclouds
    ctx.fillStyle = 'rgba(25, 14, 50, 0.6)';
    for (let i = 0; i < 5; i++) {
      const cx = (i * 220 + this.animTimer * 0.2) % (cfg.canvasWidth + 200) - 100;
      ctx.beginPath();
      ctx.arc(cx, 60, 90, 0, Math.PI * 2);
      ctx.arc(cx + 60, 45, 110, 0, Math.PI * 2);
      ctx.arc(cx + 120, 60, 85, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadowy Mountain Silhouette
    this.drawMountFuji(ctx, 480, cfg.ringSurfaceY - 15, '#120a24');

    // Distant dark Torii gate on cliff
    ctx.fillStyle = '#0a0514';
    ctx.fillRect(140, cfg.ringSurfaceY - 95, 12, 80);
    ctx.fillRect(200, cfg.ringSurfaceY - 95, 12, 80);
    ctx.fillRect(125, cfg.ringSurfaceY - 100, 102, 12);
    ctx.fillRect(135, cfg.ringSurfaceY - 84, 82, 8);

    // Weathered Lanterns
    this.drawLantern(ctx, 100, 40, '#ff4400');
    this.drawLantern(ctx, cfg.canvasWidth - 100, 40, '#ff4400');
  }

  private drawRain(ctx: CanvasRenderingContext2D, cfg: any): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (const drop of this.rainDrops) {
      drop.x -= 2; // diagonal wind
      drop.y += drop.speed;
      if (drop.y > cfg.canvasHeight) {
        drop.y = -10;
        drop.x = Math.random() * (cfg.canvasWidth + 100);
      }
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 4, drop.y + drop.len);
    }
    ctx.stroke();
    ctx.restore();
  }

  private drawPlatform(ctx: CanvasRenderingContext2D, cfg: any, stage: ArenaStage): void {
    const platX = cfg.ringLeft;
    const platY = cfg.ringSurfaceY;
    const platW = cfg.ringRight - cfg.ringLeft;
    const platH = cfg.ringThickness;

    if (stage === 'cyberpunk') {
      // Sleek carbon cyber platform
      ctx.fillStyle = '#161226';
      ctx.fillRect(platX - 8, platY, platW + 16, platH);

      // Neon trim
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(platX - 8, platY, platW + 16, platH);

      // Dark cyber surface
      const cyberGrad = ctx.createLinearGradient(0, platY, 0, platY + 14);
      cyberGrad.addColorStop(0, '#261b40');
      cyberGrad.addColorStop(1, '#160d29');
      ctx.fillStyle = cyberGrad;
      ctx.fillRect(platX, platY, platW, 14);

      // Cyan grid lines
      ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
      for (let x = platX + 4; x < platX + platW; x += 16) {
        ctx.fillRect(x, platY, 1, 14);
      }

      // Neon glowing Shikiri-sen lines
      const centerX = cfg.canvasWidth / 2;
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff00aa';
      ctx.shadowBlur = 10;
      ctx.fillRect(centerX - 48, platY + 4, 18, 5);
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00e5ff';
      ctx.fillRect(centerX + 30, platY + 4, 18, 5);
      ctx.shadowBlur = 0;
    } else if (stage === 'thunder') {
      // Wet dark slate stone base
      ctx.fillStyle = '#2c2538';
      ctx.fillRect(platX - 8, platY, platW + 16, platH);

      ctx.fillStyle = '#1c1724';
      for (let x = platX; x < platX + platW; x += 36) {
        ctx.fillRect(x, platY + 12, 2, platH - 12);
      }

      // Wet tatami surface
      const wetGrad = ctx.createLinearGradient(0, platY, 0, platY + 14);
      wetGrad.addColorStop(0, '#9a8a68');
      wetGrad.addColorStop(1, '#726345');
      ctx.fillStyle = wetGrad;
      ctx.fillRect(platX, platY, platW, 14);

      this.drawShimenawa(ctx, platX, platY, platW);

      const centerX = cfg.canvasWidth / 2;
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(centerX - 48, platY + 4, 18, 5);
      ctx.fillRect(centerX + 30, platY + 4, 18, 5);
    } else {
      // Classic Mount Fuji Dojo platform
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(platX - 8, platY, platW + 16, platH);

      ctx.fillStyle = '#5d4037';
      for (let x = platX; x < platX + platW; x += 36) {
        ctx.fillRect(x, platY + 12, 2, platH - 12);
      }

      ctx.fillStyle = '#3e2723';
      ctx.fillRect(platX - 10, platY + platH - 8, platW + 20, 8);

      const tatamiGrad = ctx.createLinearGradient(0, platY, 0, platY + 14);
      tatamiGrad.addColorStop(0, '#e4d39c');
      tatamiGrad.addColorStop(1, '#c8b476');
      ctx.fillStyle = tatamiGrad;
      ctx.fillRect(platX, platY, platW, 14);

      ctx.fillStyle = 'rgba(160, 140, 80, 0.4)';
      for (let x = platX + 4; x < platX + platW; x += 12) {
        ctx.fillRect(x, platY, 1, 14);
      }

      this.drawShimenawa(ctx, platX, platY, platW);

      const centerX = cfg.canvasWidth / 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(centerX - 48, platY + 4, 18, 5);
      ctx.fillRect(centerX + 30, platY + 4, 18, 5);
    }

    // Sacred Salt Piles & Edge Warnings
    this.drawSaltPile(ctx, platX + 16, platY);
    this.drawSaltPile(ctx, cfg.ringRight - 16, platY);
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
  private drawMountFuji(ctx: CanvasRenderingContext2D, centerX: number, baseY: number, color: string = 'rgba(46, 18, 72, 0.38)'): void {
    ctx.save();
    // Soft iconic concave slopes of Mt. Fuji receding peacefully in the distance
    ctx.fillStyle = color;
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
