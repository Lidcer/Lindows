export class RotatingThing {
  id: HTMLImageElement;
  canvas: HTMLCanvasElement;

  imagePos = [0, 0, 0];

  rotation = 0;
  leftLine = 0;

  drawInTime = 12000;

  performanceNow = 0;

  isLandscape = true;

  screenCover: number;

  //constructor
  constructor(
    private ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    picture: HTMLImageElement,
    screenCoverPercent: number,
  ) {
    this.id = picture;
    this.canvas = canvas;
    this.screenCover = screenCoverPercent / 100;
  }

  //align elements
  private alignElement() {
    if (this.isLandscape == false) {
      this.imagePos[0] = this.canvas.width * ((1 - this.screenCover) * 0.5);
      this.imagePos[1] = this.canvas.height * 0.5 - this.canvas.width * this.screenCover * 0.5;
      this.imagePos[2] = this.canvas.width * this.screenCover;
    } else {
      this.imagePos[0] = this.canvas.width * this.leftLine * ((1 - this.screenCover) * 0.5);
      this.imagePos[1] = this.canvas.height * 0.5 - this.canvas.width * this.leftLine * this.screenCover * 0.5;
      this.imagePos[2] = this.canvas.width * this.leftLine * this.screenCover;
    }
  }

  //Animate the spinning of the circle
  public animate(lag: number) {
    if (this.rotation >= 360) {
      this.rotation = 0;
    }
    this.rotation += (lag * 360) / this.drawInTime;
  }

  private landscapeCheck(): void {
    this.canvas.width >= this.canvas.height ? (this.isLandscape = true) : (this.isLandscape = false);
  }

  public setLeftLine(leftLine: number): void {
    this.leftLine = leftLine / 100;
  }

  public draw(updateSpinner: boolean): void {
    const now = performance.now();
    if (updateSpinner) {
      this.animate(now - this.performanceNow);
    }
    this.performanceNow = now;

    this.landscapeCheck();
    this.alignElement();

    this.ctx.save();
    if (this.isLandscape == false) {
      this.ctx.translate(this.canvas.width * 0.5, this.canvas.height * 0.5);
      this.ctx.rotate((this.rotation * Math.PI) / 180);
      this.ctx.translate(-(this.canvas.width * 0.5), -(this.canvas.height * 0.5));
    } else {
      this.ctx.translate((this.canvas.width * this.leftLine) / 2, this.canvas.height * 0.5);
      this.ctx.rotate((this.rotation * Math.PI) / 180);
      this.ctx.translate(-((this.canvas.width * this.leftLine) / 2), -(this.canvas.height * 0.5));
    }
    this.ctx.drawImage(this.id, this.imagePos[0], this.imagePos[1], this.imagePos[2], this.imagePos[2]);
    this.ctx.restore();
  }
}
