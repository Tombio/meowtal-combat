export interface ComicPopup {
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  scale: number;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  alpha: number;
}

export class EffectsRenderer {
  private popups: ComicPopup[] = [];
  private particles: Particle[] = [];
  public shakeAmount: number = 0;
  public hitStopFrames: number = 0;

  public triggerScreenShake(amount: number): void {
    this.shakeAmount = Math.max(this.shakeAmount, amount);
  }

  public triggerHitStop(frames: number): void {
    this.hitStopFrames = Math.max(this.hitStopFrames, frames);
  }

  public addComicPopup(text: string, x: number, y: number, isMega: boolean): void {
    this.popups.push({
      text,
      x,
      y,
      life: 0,
      maxLife: 45,
      scale: isMega ? 1.4 : 1.0,
      color: isMega ? '#ff0055' : '#ffea00',
    });
  }

  public addDust(x: number, y: number, count = 4, direction = 0): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() * 16 - 8),
        y: y + (Math.random() * 4 - 2),
        vx: direction * 1.5 + (Math.random() * 2 - 1),
        vy: -Math.random() * 2 - 0.5,
        size: Math.random() * 4 + 3,
        color: 'rgba(230, 215, 175, 0.8)',
        life: 0,
        maxLife: 20 + Math.random() * 10,
        alpha: 0.8,
      });
    }
  }

  public addCherryBlossom(canvasWidth: number): void {
    if (Math.random() < 0.25) {
      this.particles.push({
        x: Math.random() * canvasWidth,
        y: -10,
        vx: -0.6 + Math.random() * 0.4,
        vy: 0.8 + Math.random() * 0.6,
        size: Math.random() * 3 + 2,
        color: '#ffb7c5', // Pink petal
        life: 0,
        maxLife: 400,
        alpha: 0.7,
      });
    }
  }

  public update(): void {
    // Screen shake decay
    if (this.shakeAmount > 0) {
      this.shakeAmount *= 0.88;
      if (this.shakeAmount < 0.2) this.shakeAmount = 0;
    }

    // Hit stop counter
    if (this.hitStopFrames > 0) {
      this.hitStopFrames--;
    }

    // Update popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.life++;
      p.y -= 0.8; // float upwards
      if (p.life >= p.maxLife) {
        this.popups.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life++;
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha = 1 - (pt.life / pt.maxLife);
      if (pt.life >= pt.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // Draw particles
    for (const pt of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(pt.alpha, 0);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw comic text popups
    for (const pop of this.popups) {
      ctx.save();
      const progress = pop.life / pop.maxLife;
      const currentScale = pop.scale * (1 + Math.sin(progress * Math.PI) * 0.3);
      const alpha = progress > 0.7 ? (1 - progress) / 0.3 : 1;

      ctx.translate(pop.x, pop.y);
      ctx.scale(currentScale, currentScale);
      ctx.globalAlpha = Math.max(alpha, 0);

      ctx.font = 'bold 20px "Press Start 2P", monospace';
      ctx.textAlign = 'center';

      // Thick black comic drop shadow
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.strokeText(pop.text, 0, 0);

      // Neon comic fill
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, 0, 0);

      ctx.restore();
    }
  }

  public getShakeOffsets(): { x: number; y: number } {
    if (this.shakeAmount <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() * 2 - 1) * this.shakeAmount,
      y: (Math.random() * 2 - 1) * this.shakeAmount,
    };
  }
}
