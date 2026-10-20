export type ArenaStage = 'dojo' | 'cyberpunk' | 'thunder';
export type StageSelection = 'random' | ArenaStage;

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
  public stageSelection: StageSelection = 'random';
  public currentStage: ArenaStage = 'dojo';

  public static readonly ALL_STAGES: ArenaStage[] = ['dojo', 'cyberpunk', 'thunder'];

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

  public setStageSelection(sel: StageSelection): void {
    this.stageSelection = sel;
    if (sel !== 'random') {
      this.currentStage = sel;
    }
  }

  public prepareRoundStage(): ArenaStage {
    if (this.stageSelection === 'random') {
      const candidates = Arena.ALL_STAGES.filter(s => s !== this.currentStage);
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      this.currentStage = next;
    } else {
      this.currentStage = this.stageSelection;
    }
    return this.currentStage;
  }

  public getStageDisplayName(): string {
    switch (this.currentStage) {
      case 'dojo': return 'MOUNT FUJI DOJO';
      case 'cyberpunk': return 'NEO-TOKYO ROOFTOP';
      case 'thunder': return 'MIDNIGHT THUNDER';
    }
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

  public isRingOut(x: number, y: number, width: number, height: number = 52): boolean {
    const catCenter = x + width / 2;
    const feetY = y + height;

    // 1. Off-screen bounds check (cat fully exited bottom or canvas sides)
    if (y > this.config.canvasHeight || x + width < 0 || x > this.config.canvasWidth) {
      return true;
    }

    // 2. Fallen past Dohyo ledge into pit
    const isPastLeft = (catCenter < this.config.ringLeft) || (x + width <= this.config.ringLeft + 8);
    const isPastRight = (catCenter > this.config.ringRight) || (x >= this.config.ringRight - 8);
    const isPastEdge = isPastLeft || isPastRight;
    const isBelowSurface = feetY > this.config.ringSurfaceY + 12;

    return isPastEdge && isBelowSurface;
  }
}
