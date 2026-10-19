export interface ArenaConfig {
  ringLeft: number;
  ringRight: number;
  ringSurfaceY: number;
  ringThickness: number;
  canvasWidth: number;
  canvasHeight: number;
  teeterMargin: number;
}

export class Arena {
  public readonly config: ArenaConfig;

  constructor(canvasWidth = 960, canvasHeight = 540) {
    const ringWidth = 580;
    const ringLeft = (canvasWidth - ringWidth) / 2; // 190
    const ringRight = ringLeft + ringWidth; // 770
    const ringSurfaceY = 390;
    const ringThickness = 65;

    this.config = {
      ringLeft,
      ringRight,
      ringSurfaceY,
      ringThickness,
      canvasWidth,
      canvasHeight,
      teeterMargin: 40,
    };
  }

  public isOnPlatform(x: number, width: number): boolean {
    const catCenter = x + width / 2;
    return catCenter >= this.config.ringLeft && catCenter <= this.config.ringRight;
  }

  public isTeetering(x: number, width: number): 'left' | 'right' | null {
    const catCenter = x + width / 2;
    if (catCenter >= this.config.ringLeft && catCenter <= this.config.ringLeft + this.config.teeterMargin) {
      return 'left';
    }
    if (catCenter <= this.config.ringRight && catCenter >= this.config.ringRight - this.config.teeterMargin) {
      return 'right';
    }
    return null;
  }

  public isRingOut(x: number, y: number, width: number): boolean {
    const catCenter = x + width / 2;
    const isPastEdge = catCenter < this.config.ringLeft || catCenter > this.config.ringRight;
    const isBelowRing = y > this.config.ringSurfaceY + 20;
    return isPastEdge && isBelowRing;
  }
}
