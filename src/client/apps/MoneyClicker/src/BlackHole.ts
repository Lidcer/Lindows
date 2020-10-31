import { EventEmitter } from "events";

export class BlackHole extends EventEmitter {
  private id: HTMLImageElement;
  private canvas: HTMLCanvasElement;

  private imagePos = [0, 0, 0];

  private rotation = 0;
  private leftLine = 0;
  private drawinTime = 8000;
  private performanceNow = 0;
  private isLandscape = true;

  private size = 50;
  private scale = 0.0005;
  private end = false;

  //constructor
  constructor(private ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, picture: HTMLImageElement) {
    super();
    this.id = picture;
    this.canvas = canvas;
  }

  //Animate the spinning of the circle
  public animate(lag: number) {
    if (this.rotation >= 360) {
      this.rotation = 0;
    }
    this.rotation += (lag * 360) / this.drawinTime;
  }

  //Check if canvas is in landsapce mode
  private landscapeCheck(): void {
    this.canvas.width >= this.canvas.height ? (this.isLandscape = true) : (this.isLandscape = false);
  }

  //requed for landscape
  public setLeftLine(leftLine: number): void {
    this.leftLine = leftLine / 100;
  }
  private blackHoleSize() {
    if (this.isLandscape) this.size = this.canvas.width * this.scale;
    else this.size = this.canvas.height * this.scale;
  }

  private alignElement() {
    this.imagePos[0] = this.canvas.width * 0.5 - this.size * 5;
    this.imagePos[1] = this.canvas.height * 0.5 - this.size * 5;
    this.imagePos[2] = this.canvas.width;

    this.imagePos[2] = this.size * 10;
  }
  private increaseSize(lag: number) {
    if (this.scale > 1) this.scale = 1;
    else this.scale += lag * (this.scale * 0.0006);
  }

  //draw on canvas
  public draw(): void {
    if (!this.end && this.scale > 1) {
      this.emit("blackHoleFull");
      this.end = true;
    }

    this.blackHoleSize();
    this.alignElement();
    const now = performance.now();
    this.increaseSize(now - this.performanceNow);
    this.animate(now - this.performanceNow);
    this.performanceNow = now;

    const c = this.canvas.getContext("2d");
    this.landscapeCheck();
    this.ctx.save();

    this.ctx.translate(this.canvas.width * 0.5, this.canvas.height * 0.5);
    this.ctx.rotate((this.rotation * Math.PI) / 180);
    this.ctx.translate(-(this.canvas.width * 0.5), -(this.canvas.height * 0.5));

    this.ctx.drawImage(this.id, this.imagePos[0], this.imagePos[1], this.imagePos[2], this.imagePos[2]);
    this.ctx.restore();

    this.ctx.fillStyle = "#000000";
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width * 0.5, this.canvas.height * 0.5, this.size, 0, 2 * Math.PI);
    this.ctx.fill();
  }
}
