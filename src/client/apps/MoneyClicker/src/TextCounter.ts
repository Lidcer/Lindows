export class TextCounter {
  canvas: HTMLCanvasElement;

  spliter = "";

  isLandscape = true;

  color = "rgba(0,0,0,0.50)";
  valueColor = "rgba(255,255,255,1)";
  cpsColor = "rgba(255,255,255,0.90)";
  blackSquare = [0, 0, 0, 0];
  valuePos = [0, 0];
  cpsPos = [0, 0];

  valueSize = 55;
  cpsSize = 55;

  leftLine = 0.4;

  value = 0;
  cps = 0;

  //constructor
  constructor(private ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, values: any) {
    this.canvas = canvas;
    this.value = values.money;
  }

  //check if canvas is in landscape mode
  private landscapeCheck(): void {
    this.canvas.width >= this.canvas.height ? (this.isLandscape = true) : (this.isLandscape = false);
  }

  public setmoney(value: number, cps: number) {
    this.value = value;
    this.cps = cps;
  }

  public setLeftLine(leftLine: number): void {
    this.leftLine = leftLine / 100;
  }

  public setValue(value: number, cps: number): void {
    this.value = value;
    this.cps = cps;
  }

  private alignElement(): void {
    const size = 0.18;
    if (this.isLandscape) {
      this.blackSquare[0] = this.canvas.width * this.leftLine;
      this.blackSquare[1] = this.canvas.height * size;

      this.valuePos[0] = this.canvas.width * this.leftLine * 0.5;
      this.valuePos[1] = this.canvas.height * size * 0.5;
      this.cpsPos[0] = this.canvas.width * this.leftLine * 0.5;
      this.cpsPos[1] = this.canvas.height * size * 0.9;
    } else {
      this.blackSquare[0] = this.canvas.width;
      this.blackSquare[1] = this.canvas.height * size;

      this.valuePos[0] = this.canvas.width * 0.5;
      this.valuePos[1] = this.canvas.height * size * 0.55;
      this.cpsPos[0] = this.canvas.width * 0.5;
      this.cpsPos[1] = this.canvas.height * size * 0.9;
    }

    this.valueSize = this.blackSquare[0] * 0.115;
    this.cpsSize = this.blackSquare[0] * 0.08;
  }

  //Drawing elements on canvas
  draw() {
    this.landscapeCheck();
    this.alignElement();
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(0, 0, this.blackSquare[0], this.blackSquare[1]);

    this.ctx.fillStyle = this.valueColor;
    this.ctx.textAlign = "center";
    this.ctx.font = this.valueSize + "px ds-digi";

    const displayValue = this.value.toString().match(/.{1,3}/g);

    this.ctx.fillText(displayValue.join(this.spliter), this.valuePos[0], this.valuePos[1]);
    this.ctx.fillStyle = this.cpsColor;
    this.ctx.font = this.cpsSize + "px ds-digi";

    const displyCPS = this.cps.toString().match(/.{1,3}/g);
    this.ctx.fillText("CPS:" + displyCPS.join(this.spliter), this.cpsPos[0], this.cpsPos[1]);
  }
}
