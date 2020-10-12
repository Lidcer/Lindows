export class ShopIcon {
  id: HTMLImageElement;
  canvas: HTMLCanvasElement;

  imagePos = [0, 0, 0, 0];

  isLandscape = true;

  screenCover: number;
  screenCoverAnimation: number;

  animationTime = 500;
  animationSpeed = 1.5;
  clickAnimation = false;
  animationIn = true;
  animation = 1;

  performanceNow = 0;

  vLScreen: number;
  hLScreen: number;
  vPScreen: number;
  hPScreen: number;
  iconSizeL: number;
  iconSizeP: number;

  resAnimation = false;

  clicksEnabled = true;

  constructor(
    private ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    picture: HTMLImageElement,
    iconSizeL: number,
    iconSizeP: number,
    xLSP: number,
    yLSP: number,
    xPSP: number,
    yPSP: number,
  ) {
    this.id = picture;
    this.canvas = canvas;
    this.iconSizeL = iconSizeL / 100;
    this.iconSizeP = iconSizeP / 100;
    this.vLScreen = xLSP / 100;
    this.hLScreen = yLSP / 100;
    this.vPScreen = xPSP / 100;
    this.hPScreen = yPSP / 100;
  }

  //Check if landScapeMode
  private landscapeCheck(): void {
    this.canvas.width >= this.canvas.height ? (this.isLandscape = true) : (this.isLandscape = false);
  }

  public disableClicks() {
    this.clicksEnabled = false;
  }
  public enableClicks() {
    this.clicksEnabled = true;
  }

  //Click detector
  public click(x: number, y: number): boolean {
    if (this.clicksEnabled || this.isLandscape) {
      const a = this.imagePos[0] < x;
      const b = this.imagePos[1] < y;
      const c = this.imagePos[0] + this.imagePos[2] > x;
      const d = this.imagePos[1] + this.imagePos[2] > y;

      if (a && b && c && d) {
        return true;
      }
    }
    return false;
  }

  public buttonPress() {
    this.clickAnimation = true;
  }

  //click animation
  private animate(lag: number): void {
    if (this.clickAnimation) {
      const inA = 0.8;
      const outA = 1.1;
      if (this.isLandscape) {
        if (inA < this.animation && this.animationIn) {
          this.animation -= (lag * this.animationSpeed) / this.animationTime;
        } else this.animationIn = false;
        if (this.resAnimation) {
          this.animation += (20 * this.animationSpeed) / this.animationTime;
          if (outA < this.animation) {
            this.clickAnimation = false;
            this.animationIn = true;
            this.animation = 1;
            this.resAnimation = false;
          }
        }
      } else {
        if (inA < this.animation && this.animationIn) {
          this.animation -= (lag * this.animationSpeed) / this.animationTime;
        } else {
          this.animationIn = false;
          this.animation += (lag * this.animationSpeed) / this.animationTime;
          if (outA < this.animation) {
            this.clickAnimation = false;
            this.animationIn = true;
            this.animation = 1;
          }
        }
      }
    }
  }

  //reset animation
  public resetAnimation(): void {
    if (!this.animationIn) {
      this.resAnimation = true;
    }
  }

  //align elements
  private alignElement(): void {
    if (this.isLandscape) {
      this.imagePos[2] = this.canvas.width * this.iconSizeL * this.animation;
      this.imagePos[0] = this.canvas.width * this.vLScreen - this.imagePos[2] / 2;
      this.imagePos[1] = this.canvas.height * this.hLScreen - this.imagePos[2] / 2;
    } else {
      this.imagePos[2] = this.canvas.width * this.iconSizeP * this.animation;
      this.imagePos[0] = this.canvas.width * this.hPScreen - this.imagePos[2] / 2;
      this.imagePos[1] = this.canvas.height * this.vPScreen - this.imagePos[2] / 2;
    }
  }

  //Drawing on Canvas
  public draw(): void {
    this.landscapeCheck();
    this.alignElement();

    const now = performance.now();
    this.animate(now - this.performanceNow);
    this.performanceNow = now;

    this.ctx.drawImage(this.id, this.imagePos[0], this.imagePos[1], this.imagePos[2], this.imagePos[2]);
  }
}
