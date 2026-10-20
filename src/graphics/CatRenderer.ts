import { Cat, FIGHTER_PROFILES } from '../entities/Cat';

export class CatRenderer {
  public draw(ctx: CanvasRenderingContext2D, cat: Cat): void {
    const profile = cat.profile || FIGHTER_PROFILES[cat.breed] || FIGHTER_PROFILES.ginger_tabby;

    // 0. Draw afterimages (motion blur trail)
    if (cat.afterimages.length > 0) {
      for (const img of cat.afterimages) {
        ctx.save();
        ctx.globalAlpha = Math.max(img.alpha * 0.45, 0);
        const imgCenterX = img.x + cat.width / 2;
        const imgBottomY = img.y + cat.height;
        ctx.translate(imgCenterX, imgBottomY);
        ctx.scale(img.scaleX * img.facing, img.scaleY);
        ctx.fillStyle = profile.furColor;
        // Silhouette body
        ctx.beginPath();
        ctx.ellipse(0, -24, 26, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -40, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.save();

    // Center transform for squash and stretch
    const centerX = cat.x + cat.width / 2;
    const bottomY = cat.y + cat.height;

    ctx.translate(centerX, bottomY);
    ctx.scale(cat.scaleX * cat.facing, cat.scaleY);

    // Dynamic rotation for waddle, jump, and daze
    let rot = 0;
    if (cat.state === 'WADDLE') {
      rot = Math.sin(cat.animTimer * 0.3) * 0.08;
    } else if (cat.state === 'JUMP_RISE') {
      rot = -0.06;
    } else if (cat.state === 'JUMP_FALL') {
      rot = 0.05;
    } else if (cat.state === 'DAZED') {
      rot = Math.sin(cat.animTimer * 0.5) * 0.12;
    } else if (cat.state === 'TEETER') {
      rot = Math.sin(cat.animTimer * 0.6) * 0.18;
    } else if (cat.state === 'RING_OUT') {
      rot = (cat.animTimer * 0.25) * (cat.vx < 0 ? -1 : 1);
    }
    ctx.rotate(rot);

    // Color Palettes
    const isGinger = cat.breed === 'ginger_tabby';
    const isBoris = cat.breed === 'british_blue';
    const isCalico = cat.breed === 'calico_acrobat';

    const furColor = profile.furColor;
    const furShade = profile.furShade;
    const bellyColor = profile.bellyColor;
    const earInner = '#ffafbd';
    const noseColor = cat.breed === 'black_tuxedo' ? '#333' : '#ff6b8b';
    const eyeColor = profile.eyeColor;
    const beltColor = profile.beltColor;
    const beltBorder = profile.beltBorder;

    // 1. Shadow underneath (if grounded or near platform)
    if (cat.isGrounded) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, -2, 24, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Fluffy Tail
    ctx.save();
    const tailWag = Math.sin(cat.animTimer * 0.2) * 8;
    ctx.fillStyle = furColor;
    ctx.beginPath();
    ctx.ellipse(-20, -18 + tailWag * 0.5, 7, 14, -0.6 + tailWag * 0.04, 0, Math.PI * 2);
    ctx.fill();
    if (isCalico) {
      // Tri-color calico tail rings
      ctx.fillStyle = '#e67e22';
      ctx.beginPath();
      ctx.ellipse(-21, -22 + tailWag * 0.5, 5.5, 4, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.ellipse(-19, -14 + tailWag * 0.5, 6, 4, -0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Cute Chubby Body (Rounded Mochi Ball)
    ctx.fillStyle = furColor;
    ctx.beginPath();
    // Chubby torso
    ctx.ellipse(0, -24, 26, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boris Extra Chubby Sumo Jowls
    if (isBoris) {
      ctx.fillStyle = furColor;
      ctx.beginPath();
      ctx.arc(-18, -21, 8, 0, Math.PI * 2);
      ctx.arc(18, -21, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = furShade;
      ctx.beginPath();
      ctx.arc(-18, -19, 7, 0, Math.PI * 0.8);
      ctx.arc(18, -19, 7, 0.2 * Math.PI, Math.PI);
      ctx.fill();
    }

    // Body shading (bottom rim)
    ctx.fillStyle = furShade;
    ctx.beginPath();
    ctx.ellipse(0, -12, 23, 10, 0, 0, Math.PI);
    ctx.fill();

    // 4. White Belly Patch
    ctx.fillStyle = bellyColor;
    ctx.beginPath();
    ctx.ellipse(2, -20, 15, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Breed-specific coat markings
    if (isGinger) {
      ctx.fillStyle = furShade;
      // Forehead stripes
      ctx.fillRect(2, -42, 3, 6);
      ctx.fillRect(-4, -40, 2, 5);
      ctx.fillRect(8, -40, 2, 5);
      // Side flank stripes
      ctx.fillRect(-18, -26, 4, 3);
      ctx.fillRect(-17, -20, 4, 3);
    } else if (isCalico) {
      // Dark slate patch on left body flank
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.ellipse(-14, -20, 8, 9, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Ginger patch on right face/head
      ctx.fillStyle = '#e67e22';
      ctx.beginPath();
      ctx.ellipse(10, -36, 10, 11, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Cute Sumo Belt (Ribbon Mawashi)
    ctx.fillStyle = beltColor;
    ctx.fillRect(-18, -17, 36, 6);
    ctx.fillStyle = beltBorder;
    ctx.strokeRect(-18, -17, 36, 6);

    // Belt Knot & Bow in center
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = beltColor;
    ctx.beginPath();
    ctx.arc(0, -14, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 6. Pointy Fluffy Ears
    // Left Ear
    ctx.fillStyle = furColor;
    ctx.beginPath();
    ctx.moveTo(-16, -38);
    ctx.lineTo(-24, -54);
    ctx.lineTo(-6, -42);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = earInner;
    ctx.beginPath();
    ctx.moveTo(-15, -40);
    ctx.lineTo(-21, -50);
    ctx.lineTo(-8, -43);
    ctx.closePath();
    ctx.fill();

    // Right Ear
    ctx.fillStyle = isCalico ? '#e67e22' : furColor;
    ctx.beginPath();
    ctx.moveTo(8, -42);
    ctx.lineTo(24, -54);
    ctx.lineTo(18, -38);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = earInner;
    ctx.beginPath();
    ctx.moveTo(10, -43);
    ctx.lineTo(21, -50);
    ctx.lineTo(16, -40);
    ctx.closePath();
    ctx.fill();

    // 7. Facial Features
    if (cat.state === 'DAZED') {
      // Dizzy Spiral / X Eyes
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.5;

      // Left eye X
      ctx.beginPath();
      ctx.moveTo(-12, -32); ctx.lineTo(-4, -24);
      ctx.moveTo(-4, -32); ctx.lineTo(-12, -24);
      ctx.stroke();

      // Right eye X
      ctx.beginPath();
      ctx.moveTo(6, -32); ctx.lineTo(14, -24);
      ctx.moveTo(14, -32); ctx.lineTo(6, -24);
      ctx.stroke();

      // Dazed wavy mouth
      ctx.beginPath();
      ctx.moveTo(-4, -18);
      ctx.quadraticCurveTo(0, -22, 4, -18);
      ctx.stroke();
    } else if (cat.state === 'TEETER') {
      // Wide terrified eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-8, -28, 6, 0, Math.PI * 2);
      ctx.arc(10, -28, 6, 0, Math.PI * 2);
      ctx.fill();

      // Tiny pinprick pupils
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-7, -28, 2, 0, Math.PI * 2);
      ctx.arc(9, -28, 2, 0, Math.PI * 2);
      ctx.fill();

      // Terrified open "O" mouth
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath();
      ctx.ellipse(1, -18, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (cat.state === 'CELEBRATING') {
      // Happy curved closed eyes (^ . ^)
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-8, -27, 4, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(10, -27, 4, Math.PI, 0);
      ctx.stroke();

      // Smiling open mouth
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath();
      ctx.arc(1, -19, 4, 0, Math.PI);
      ctx.fill();
    } else {
      // Normal / Waddle / Jumping Expression
      if (cat.isBlinking) {
        // Blinking line
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, -28); ctx.lineTo(-4, -28);
        ctx.moveTo(6, -28); ctx.lineTo(14, -28);
        ctx.stroke();
      } else {
        // Big cute eyes
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.ellipse(-8, -28, 5, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(10, -28, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlights (sparkle!)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-9, -30, 2, 0, Math.PI * 2);
        ctx.arc(9, -30, 2, 0, Math.PI * 2);
        ctx.arc(-6, -26, 1, 0, Math.PI * 2);
        ctx.arc(12, -26, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cute pink nose
      ctx.fillStyle = noseColor;
      ctx.beginPath();
      ctx.moveTo(1, -22);
      ctx.lineTo(-2, -25);
      ctx.lineTo(4, -25);
      ctx.closePath();
      ctx.fill();

      // Cute cat mouth :3
      ctx.strokeStyle = furShade;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(1, -22);
      ctx.lineTo(1, -20);
      ctx.moveTo(-3, -19);
      ctx.quadraticCurveTo(-1, -17, 1, -20);
      ctx.quadraticCurveTo(3, -17, 5, -19);
      ctx.stroke();
    }

    // Chubby Rosy Cheeks
    ctx.fillStyle = 'rgba(255, 105, 140, 0.4)';
    ctx.beginPath();
    ctx.arc(-16, -24, 4, 0, Math.PI * 2);
    ctx.arc(16, -24, 4, 0, Math.PI * 2);
    ctx.fill();

    // 8. Whiskers
    ctx.strokeStyle = isGinger ? '#d96800' : (isBoris ? '#cbd5e1' : (isCalico ? '#64748b' : '#888'));
    ctx.lineWidth = 1;
    // Left whiskers
    ctx.beginPath();
    ctx.moveTo(-14, -23); ctx.lineTo(-25, -25);
    ctx.moveTo(-14, -21); ctx.lineTo(-24, -20);
    // Right whiskers
    ctx.moveTo(14, -23); ctx.lineTo(25, -25);
    ctx.moveTo(14, -21); ctx.lineTo(24, -20);
    ctx.stroke();

    // 9. Paws & Feet
    const pawColor = '#fff'; // Cute white socks
    if (cat.state === 'TEETER') {
      // Panicked pinwheeling paws
      const flap = Math.sin(cat.animTimer * 0.8) * 12;
      ctx.fillStyle = pawColor;
      ctx.beginPath();
      ctx.arc(-14 + flap, -32, 6, 0, Math.PI * 2);
      ctx.arc(16 - flap, -32, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (cat.state === 'JUMP_RISE') {
      // Reaching up paws
      ctx.fillStyle = pawColor;
      ctx.beginPath();
      ctx.arc(-10, -42, 6, 0, Math.PI * 2);
      ctx.arc(12, -42, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (cat.state === 'JUMP_FALL') {
      // Spread eagle paws
      ctx.fillStyle = pawColor;
      ctx.beginPath();
      ctx.arc(-22, -26, 6, 0, Math.PI * 2);
      ctx.arc(22, -26, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (cat.state === 'PARRY') {
      // Defensive guard paws held up tight in front
      ctx.fillStyle = pawColor;
      ctx.beginPath();
      ctx.arc(8, -26, 7, 0, Math.PI * 2);
      ctx.arc(14, -20, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (cat.state === 'WADDLE') {
      // Alternating step paws
      const stepLeft = Math.sin(cat.animTimer * 0.4) * 4;
      const stepRight = -stepLeft;
      ctx.fillStyle = pawColor;
      ctx.beginPath();
      ctx.arc(-12, -4 + stepLeft, 6, 0, Math.PI * 2);
      ctx.arc(12, -4 + stepRight, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Rest paws
      ctx.fillStyle = pawColor;
      ctx.beginPath();
      ctx.arc(-12, -4, 6, 0, Math.PI * 2);
      ctx.arc(12, -4, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 10. Floating Dizzy Stars (drawn in world coordinates above cat's head)
    if (cat.state === 'DAZED') {
      this.drawDizzyStars(ctx, centerX, cat.y - 12, cat.animTimer);
    }

    // 11. Panic Sweat Drops when Teetering on Edge
    if (cat.state === 'TEETER') {
      this.drawSweatDrops(ctx, centerX, cat.y - 8, cat.animTimer);
    }

    // 12. Turbo Attack Cooldown Progress Indicator
    if (cat.turboCooldown > 0 && cat.state !== 'RING_OUT') {
      this.drawCooldownMeter(ctx, centerX, cat.y - 14, cat.turboCooldown, cat.maxTurboCooldown, cat.animTimer);
    }

    // 13. Defensive Parry Barrier Aura
    if (cat.state === 'PARRY') {
      this.drawParryShield(ctx, centerX, bottomY - 26, cat.parryTimer);
    }
  }

  private drawParryShield(ctx: CanvasRenderingContext2D, x: number, y: number, timer: number): void {
    ctx.save();
    ctx.translate(x, y);
    const alpha = Math.min(timer / 6, 1.0) * 0.9;
    ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;

    // Hex shield arc
    ctx.beginPath();
    ctx.arc(0, 0, 34, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    // Inner bright spark
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(4, 0, 26, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();

    ctx.restore();
  }

  private drawCooldownMeter(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    cooldown: number,
    maxCooldown: number,
    timer: number
  ): void {
    const width = 28;
    const height = 4;
    const x = Math.round(cx - width / 2);
    const y = Math.round(cy);
    const progress = Math.max(0, Math.min(1, 1 - (cooldown / maxCooldown)));

    ctx.save();
    // Bezel background
    ctx.fillStyle = 'rgba(10, 6, 18, 0.85)';
    ctx.fillRect(x - 1, y - 1, width + 2, height + 2);

    // Bezel border
    const isNearlyReady = progress > 0.85;
    ctx.strokeStyle = isNearlyReady && (timer % 8 < 4) ? '#00ffff' : '#5c2d91';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 1, y - 1, width + 2, height + 2);

    // Dynamic gradient fill: fiery red-orange -> gold -> neon cyan
    const fillWidth = Math.floor(width * progress);
    if (fillWidth > 0) {
      const grad = ctx.createLinearGradient(x, y, x + width, y);
      grad.addColorStop(0, '#ff3d00');
      grad.addColorStop(0.5, '#ffc400');
      grad.addColorStop(1, '#00e5ff');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, fillWidth, height);
    }

    // Mini lightning symbol
    ctx.fillStyle = isNearlyReady ? '#00ffff' : '#ffea00';
    ctx.font = '8px monospace';
    ctx.fillText('⚡', x - 9, y + 4);

    ctx.restore();
  }

  private drawDizzyStars(ctx: CanvasRenderingContext2D, cx: number, cy: number, timer: number): void {
    const starCount = 3;
    const radius = 22;
    for (let i = 0; i < starCount; i++) {
      const angle = (timer * 0.15) + (i * (Math.PI * 2 / starCount));
      const sx = cx + Math.cos(angle) * radius;
      const sy = cy + Math.sin(angle) * (radius * 0.45);

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(timer * 0.2);
      ctx.fillStyle = '#ffe600';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 6;
      this.drawStar(ctx, 0, 0, 5, 6, 2.5);
      ctx.restore();
    }
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number): void {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerR;
      y = cy + Math.sin(rot) * outerR;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerR;
      y = cy + Math.sin(rot) * innerR;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
    ctx.fill();
  }

  private drawSweatDrops(ctx: CanvasRenderingContext2D, cx: number, cy: number, timer: number): void {
    const dropOffset = (timer * 2.5) % 18;
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(cx - 16, cy - dropOffset, 3, 0, Math.PI * 2);
    ctx.arc(cx + 16, cy - dropOffset + 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  public drawPortrait(
    ctx: CanvasRenderingContext2D,
    breed: import('../entities/Cat').CatBreed,
    centerX: number,
    bottomY: number,
    scale = 1.0,
    facing: 1 | -1 = 1,
    animTick = 0
  ): void {
    const dummyCat = new Cat({ id: 'p1', breed, initialX: 0, initialFacing: facing }, 0);
    dummyCat.x = centerX - dummyCat.width / 2;
    dummyCat.y = bottomY - dummyCat.height;
    dummyCat.facing = facing;
    dummyCat.scaleX = scale;
    dummyCat.scaleY = scale;
    dummyCat.animTimer = animTick;
    this.draw(ctx, dummyCat);
  }
}
