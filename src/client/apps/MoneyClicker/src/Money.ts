export class Money {
  id: HTMLImageElement;
  canvas: HTMLCanvasElement;
  leftLine: number;

  isLandscape = true;

  imagePos = [0, 0, 0, 0];

  screenCover: number;
  screenCoverAnimation: number;
  animationTime = 1000;
  clickAnimation = false;
  animationIn = true;

  animationSpeed = 1.5;
  pictureRatio = 1;
  performanceNow = 0;
  clicksEnabled = true;

  //const
  constructor(
    private ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    picture: HTMLImageElement,
    screenCoverPercent: number,
  ) {
    this.id = picture;
    this.canvas = canvas;
    this.screenCover = screenCoverPercent / 100;
    this.screenCoverAnimation = this.screenCover;
    this.pictureRatio = picture.height / picture.width;
  }

  //align elements
  private alignElement(): void {
    if (this.isLandscape == false) {
      this.imagePos[2] = this.canvas.width * this.screenCoverAnimation;
      this.imagePos[3] = this.imagePos[2] * this.pictureRatio;
      this.imagePos[0] = this.canvas.width * 0.5 - this.imagePos[2] * 0.5;
      this.imagePos[1] = this.canvas.height * 0.5 - this.imagePos[3] * 0.5;
    } else {
      this.imagePos[2] = this.canvas.width * this.leftLine * this.screenCoverAnimation;
      this.imagePos[3] = this.imagePos[2] * this.pictureRatio;
      this.imagePos[0] = this.canvas.width * this.leftLine * 0.5 - this.imagePos[2] * 0.5;
      this.imagePos[1] = this.canvas.height * 0.5 - this.imagePos[3] * 0.5;
    }
  }

  //required for landscape
  public setLeftLine(leftLine: number): void {
    this.leftLine = leftLine / 100;
  }

  //check if canvas is in landscape mode
  private landscapeCheck(): void {
    this.canvas.width >= this.canvas.height ? (this.isLandscape = true) : (this.isLandscape = false);
  }

  //replace image
  public replaceImage(picture: HTMLImageElement): void {
    this.id = picture;
    this.pictureRatio = picture.height / picture.width;
  }

  //click detector
  public click(x: number, y: number): boolean {
    if (this.clicksEnabled) {
      const a = this.imagePos[0] < x;
      const b = this.imagePos[1] < y;
      const c = this.imagePos[0] + this.imagePos[2] > x;
      const d = this.imagePos[1] + this.imagePos[3] > y;

      if (a && b && c && d) {
        this.clickAnimation = true;
        return true;
      }
    }
    return false;
  }

  public disableClicks() {
    this.clicksEnabled = false;
  }
  public enableClicks() {
    this.clicksEnabled = true;
  }

  //click animation
  private animate(lag: number): void {
    if (this.clickAnimation) {
      const inA = 0.025;
      const outA = 0.015;

      if (this.screenCover - inA < this.screenCoverAnimation && this.animationIn)
        this.screenCoverAnimation -= (lag * this.animationSpeed) / this.animationTime;
      else {
        this.animationIn = false;
        this.screenCoverAnimation += (lag * this.animationSpeed) / this.animationTime;
        if (this.screenCover + outA < this.screenCoverAnimation) {
          this.clickAnimation = false;
          this.animationIn = true;
          this.screenCoverAnimation = this.screenCover;
        }
      }
    }
  }

  //Drawing on Canvas
  public draw(): void {
    this.landscapeCheck();

    const now = performance.now();
    this.animate(now - this.performanceNow);
    this.performanceNow = now;

    this.alignElement();
    this.ctx.drawImage(this.id, this.imagePos[0], this.imagePos[1], this.imagePos[2], this.imagePos[3]);
  }
}
