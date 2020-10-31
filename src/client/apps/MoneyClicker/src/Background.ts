export class Background {
  canvas: HTMLCanvasElement;

  lines: number;
  linesPortrait: number;
  linesLandscape: number;
  lineDesktopThick: number;
  leftLineSize: number;
  rightLineSize: number;
  isLandscape = true;

  clicksEnabled = true;

  color0 = "#8282fb";
  color1 = "#4040ff";
  //color2 = '#000000';
  color3 = "#00e0fa";

  //color0 = '#8282FB';
  color2 = "#2C2C99";
  //color2 = '#B0DAFF';
  //color3 = '#FFB670';

  leftMouseDetect: number; // value 0,1,2
  rightMouseDetect: number; // value 0,1,2

  leftLineDraw: number; //%
  rightLineDraw: number; //%

  shopStatus = 0;

  leftLine: number[];
  rightLine: number[];

  //Contructor
  constructor(
    private ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    linesPortrait: number,
    linesLandscape: number,
    LineThickness: number,
  ) {
    this.canvas = canvas;
    this.linesPortrait = linesPortrait;
    this.linesLandscape = linesLandscape;
    this.lineDesktopThick = LineThickness;

    this.leftMouseDetect = 0;
    this.rightMouseDetect = 0;
    this.leftLineSize = 32.5;
    this.leftLine = [0, 0, 0, 0];
    this.rightLineSize = 32.5;
    this.rightLine = [0, 0, 0, 0];
  }

  //Click detector
  public clickDetector(x: number, y: number): void {
    if (this.clicksEnabled) {
      this.rightLineClick(x, y);
      this.leftLineClick(x, y);
    }
  }

  //Left Line mouse detector
  private leftLineClick(x: number, y: number): void {
    const a = this.leftLine[0] < x;
    const b = this.leftLine[1] < y;
    const c = this.leftLine[2] > x;
    const d = this.leftLine[3] > y;

    if (a && b && c && d && this.leftMouseDetect == 0) {
      this.leftMouseDetect = 1;
    } else if (this.leftMouseDetect == 0) {
      this.leftMouseDetect = 2;
    }

    if ((x * 100) / this.canvas.width > 15 && (x * 100) / this.canvas.width < 40 && this.leftMouseDetect == 1)
      this.leftLineSize = ((x - this.lineDesktopThick / 2) * 100) / this.canvas.width;
  }

  //Right Line mouse detector
  private rightLineClick(x: number, y: number): void {
    const a = this.rightLine[0] < x;
    const b = this.rightLine[1] < y;
    const c = this.rightLine[2] > x;
    const d = this.rightLine[3] > y;

    if (a && b && c && d && this.rightMouseDetect == 0) {
      this.rightMouseDetect = 1;
    } else if (this.rightMouseDetect == 0) {
      this.rightMouseDetect = 2;
    }

    if ((x * 100) / this.canvas.width < 85 && (x * 100) / this.canvas.width > 60 && this.rightMouseDetect == 1)
      this.rightLineSize = 100 - ((x - this.lineDesktopThick / 2) * 100) / this.canvas.width;
  }

  //Touch detector
  public touchDetector(x: number, y: number): void {
    if (this.clickDetector) {
      this.touchRightLineClick(x, y);
      this.touchLeftLineClick(x, y);
    }
  }

  //Left line mouse detector
  private touchRightLineClick(x: number, y: number): void {
    const a = this.leftLine[0] * -1.1 < x;
    const b = this.leftLine[1] * -1.1 < y;
    const c = this.leftLine[2] * 1.1 > x;
    const d = this.leftLine[3] * 1.1 > y;

    if (a && b && c && d && this.leftMouseDetect == 0) {
      if ((x * 100) / this.canvas.width > 15 && (x * 100) / this.canvas.width < 40)
        this.leftLineSize = ((x - this.lineDesktopThick / 2) * 100) / this.canvas.width;
    }
  }

  //Right line mouse detector
  private touchLeftLineClick(x: number, y: number): void {
    const a = this.rightLine[0] * -1.1 < x;
    const b = this.rightLine[1] * -1.1 < y;
    const c = this.rightLine[2] * 1.1 > x;
    const d = this.rightLine[3] * 1.1 > y;

    if (a && b && c && d && this.rightMouseDetect == 0) {
      if ((x * 100) / this.canvas.width < 85 && (x * 100) / this.canvas.width > 60)
        this.rightLineSize = 100 - ((x - this.lineDesktopThick / 2) * 100) / this.canvas.width;
    }
  }

  //Set line settings
  public setSettings(LeftLine: number, RightLine: number) {
    this.leftLineSize = LeftLine;
    this.rightLineSize = RightLine;
  }

  //Return left settings
  public getLeftLineSettings(): number {
    return this.leftLineSize;
  }

  //Return right settings
  public getRightLineSettings(): number {
    return this.rightLineSize - (this.lineDesktopThick * 100) / this.canvas.width;
  }

  //If mouse is not down switch to default
  public mouseDownDisable(): void {
    this.leftMouseDetect = 0;
    this.rightMouseDetect = 0;
  }

  private landscapeCheck(): void {
    this.canvas.width >= this.canvas.height ? (this.isLandscape = true) : (this.isLandscape = false);
  }

  public disableClicks() {
    this.clicksEnabled = false;
  }
  public enableClicks() {
    this.clicksEnabled = true;
  }

  //update properties
  private screenMode(): void {
    if (this.isLandscape === false) {
      this.lines = this.linesPortrait;
      this.leftLine = [0, 0, 0, 0];
      this.leftLineDraw = this.canvas.width;
      this.rightLineDraw = this.canvas.width;
    } else {
      this.lines = this.linesLandscape;
      this.leftLineDraw = (this.canvas.width / 100) * this.leftLineSize;
      this.rightLineDraw = (this.canvas.width / 100) * this.rightLineSize;

      this.leftLine[0] = this.leftLineDraw;
      this.leftLine[1] = 0;
      this.leftLine[2] = this.leftLine[0] + this.lineDesktopThick;
      this.leftLine[3] = this.canvas.height;

      this.rightLine[0] = this.canvas.width - this.rightLineDraw;
      this.rightLine[1] = 0;
      this.rightLine[2] = this.rightLine[0] + this.lineDesktopThick;
      this.rightLine[3] = this.canvas.height;
    }
  }

  //set screen size
  public setScreen(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  //draw object on screen
  public draw(): void {
    this.ctx.fillStyle = this.color3;
    this.landscapeCheck();
    this.screenMode();

    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.lines; i > 0; i--) {
      if (i % 2 == 0) {
        this.ctx.fillStyle = this.color0;
        this.ctx.fillRect(0, 0, (this.leftLineDraw / this.lines) * i, this.canvas.height);
      } else {
        this.ctx.fillStyle = this.color1;
        this.ctx.fillRect(0, 0, (this.leftLineDraw / this.lines) * i, this.canvas.height);
      }
    }

    if (this.isLandscape === true) {
      this.ctx.fillStyle = this.color2;
      this.ctx.fillRect(this.leftLine[0], this.leftLine[1], this.leftLine[2] - this.leftLine[0], this.leftLine[3]);
      this.ctx.fillStyle = this.color2;
      this.ctx.fillRect(
        (this.canvas.width / 100) * 44 - this.lineDesktopThick,
        0,
        this.lineDesktopThick,
        this.canvas.height,
      );
      this.ctx.fillStyle = this.color0;
      this.ctx.fillRect((this.canvas.width / 100) * 44, 0, (this.canvas.width / 100) * 12, this.canvas.height);
      this.ctx.fillStyle = this.color2;
      this.ctx.fillRect((this.canvas.width / 100) * 56, 0, this.lineDesktopThick, this.canvas.height);
      this.ctx.fillStyle = this.color1;
      this.ctx.fillRect(
        this.rightLine[0],
        this.rightLine[1],
        this.canvas.width - this.rightLine[0],
        this.canvas.height,
      );
      this.ctx.fillStyle = this.color2;
      this.ctx.fillRect(this.rightLine[0], this.rightLine[1], this.rightLine[2] - this.rightLine[0], this.rightLine[3]);
    }
  }
}
