import { clamp } from "lodash";
import { IWindowInfo } from "./SnakeGameLogic";
import { Renderer } from "./SnakeRender";
import { Square } from "./Square";

export class Snake extends Square {
  public static readonly snakeColour = [32, 247, 90];

  private canGoThroughEdge = true;
  private squares: Square[] = [];
  _onGridX: number | undefined;
  _onGridY: number | undefined;
  private percentage = 0;
  private snakeSize = 0.5;
  private precision = 1; // lower it is better it is at least it

  constructor(renderer: Renderer, private windowInfo: IWindowInfo, gameSpeed: number, x: number, y: number) {
    super(renderer);
    this.red = Snake.snakeColour[0];
    this.green = Snake.snakeColour[1];
    this.blue = Snake.snakeColour[2];
    this.setSnakeSize(windowInfo);

    this.onGridX = x;
    this.onGridY = y;
    this.y = this.sPosY;
    this.x = this.sPosX;
  }
  moveX(num: number) {
    if (num > 0) {
      this._onGridX = clamp(--this._onGridX, -1, this.windowInfo.pixelWidth);
    } else if (num < 0) {
      this._onGridX = clamp(++this._onGridX, -1, this.windowInfo.pixelWidth);
    }
  }
  moveY(num: number) {
    if (num > 0) {
      this._onGridY = clamp(--this._onGridY, -1, this.windowInfo.pixelHeight);
    } else if (num < 0) {
      this._onGridY = clamp(++this._onGridY, -1, this.windowInfo.pixelHeight);
    }
  }
  move(percentage: number) {
    const ap = percentage - this.percentage;
    this.percentage = percentage;
    if (this.sPosX > this.x) {
      this.x += this.pixelSizeWidth * ap;
      if (this.sPosX < this.x) this.x = this.sPosX;
    } else if (this.sPosX < this.x) {
      this.x -= this.pixelSizeWidth * ap;
      if (this.sPosX > this.x) this.x = this.sPosX;
    }

    if (this.sPosY > this.y) {
      this.y += this.pixelSizeHeight * ap;
      if (this.sPosY < this.y) this.y = this.sPosY;
    } else if (this.sPosY < this.y) {
      this.y -= this.pixelSizeHeight * ap;
      if (this.sPosY > this.y) this.y = this.sPosY;
    }

    this.borderSquare();
    this.snapOnGrid();
  }
  correctPos() {
    this.percentage = 0;
    this.y = this.sPosY;
    this.x = this.sPosX;
    this.borderSquare();
    this.snapOnGrid();
  }

  set size(percentage: number) {
    if (!this.windowInfo) return;
    percentage = clamp(percentage, 0, 1);
    this.snakeSize = percentage;
    this.setSnakeSize();
  }

  set onGridX(num: number) {
    this._onGridX = clamp(num, 0, this.windowInfo.pixelWidth - 1);
  }
  get onGridX() {
    return this._onGridX;
  }
  set onGridY(num: number) {
    this._onGridY = clamp(num, 0, this.windowInfo.pixelHeight - 1);
  }
  get onGridY() {
    return this._onGridY;
  }

  get shapesToDraw() {
    return 2;
  }
  get shapes() {
    return this.squares ? this.squares.length + 1 : 1;
  }
  get pos() {
    const x = clamp(this._onGridX, 1, this.windowInfo.pixelWidth + 1);
    const y = clamp(this._onGridY, 1, this.windowInfo.pixelHeight + 1);
    return { x, y };
  }

  get vertices() {
    if (this.squares.length) {
      const vertices: number[] = [];
      for (const square of this.squares) {
        square.vertices.forEach(v => vertices.push(v));
      }
      return [...super.vertices, ...vertices];
    }
    return super.vertices;
  }

  private setSnakeSize(windowInfo?: IWindowInfo) {
    windowInfo = windowInfo || this.windowInfo;
    this.widthSize = (windowInfo.width / windowInfo.pixelWidth) * this.snakeSize;
    this.heightSize = (windowInfo.height / windowInfo.pixelHeight) * this.snakeSize;
  }

  private borderSquare() {
    const sizeWidth = this.pixelSizeWidth * this.snakeSize * 0.5;
    const sizeHeight = this.pixelSizeHeight * this.snakeSize * 0.5;
    const a = this.y - sizeHeight > 0;
    const b = this.y + sizeHeight < this.windowInfo.height - this.pixelSizeHeight * this.snakeSize;
    const c = this.x - sizeWidth > 0;
    const d = this.x + sizeWidth < this.windowInfo.width - this.pixelSizeWidth * this.snakeSize;

    if (a && b && c && d) {
      if (this.squares.length) {
        this.squares = [];
      }
      return;
    }
    if (this.y + this.pixelSizeHeight * this.snakeSize - this.precision < 0) {
      this._onGridY = this.windowInfo.pixelHeight - 1;
      this.y = this.sPosY;
    } else if (this.y + this.precision > this.windowInfo.height) {
      this._onGridY = 0;
      this.y = this.sPosY;
    }

    if (this.x + this.pixelSizeWidth * this.snakeSize - this.precision < 0) {
      this._onGridX = this.windowInfo.pixelWidth - 1;
      this.x = this.sPosX;
    } else if (this.x + this.precision > this.windowInfo.width) {
      this._onGridX = 0;
      this.x = this.sPosX;
    }

    if (!this.squares.length) {
      this.squares = [];
      for (let i = 0; i < 4; i++) {
        const square = new Square(this.renderer);
        square.red = Snake.snakeColour[0];
        square.green = Snake.snakeColour[1];
        square.blue = Snake.snakeColour[2];
        this.squares.push(square);
      }
    }

    for (let i = 0; i < this.squares.length; i++) {
      if (i === 0) {
        this.squares[i].x = this.x - this.windowInfo.width;
        this.squares[i].y = this.y;
      } else if (i === 1) {
        this.squares[i].x = this.x + this.windowInfo.width;
        this.squares[i].y = this.y;
      } else if (i === 2) {
        this.squares[i].y = this.y + this.windowInfo.height;
        this.squares[i].x = this.x;
      } else if (i === 3) {
        this.squares[i].y = this.y - this.windowInfo.height;
        this.squares[i].x = this.x;
      }
      this.squares[i].widthSize = (this.windowInfo.width / this.windowInfo.pixelWidth) * this.snakeSize;
      this.squares[i].heightSize = (this.windowInfo.height / this.windowInfo.pixelHeight) * this.snakeSize;
    }
  }

  private get sPosX() {
    return this.sPosXRaw + this.xOffset * 0.5;
  }
  private get sPosY() {
    return this.sPosYRaw + this.yOffset * 0.5;
  }
  private get sPosXRaw() {
    return this.pixelSizeWidth * this.onGridX;
  }
  private get sPosYRaw() {
    return this.pixelSizeHeight * this.onGridY;
  }

  private snapOnGrid() {
    if (this.sPosY < this.y + this.precision && this.sPosY > this.y - this.precision) {
      this.y = this.sPosY;
    }
    if (this.sPosX < this.x + this.precision && this.sPosX > this.x - this.precision) {
      this.x = this.sPosX;
    }
  }
  private get pixelSizeWidth() {
    return this.windowInfo.width / this.windowInfo.pixelWidth;
  }
  private get pixelSizeHeight() {
    return this.windowInfo.height / this.windowInfo.pixelHeight;
  }

  private get yOffset() {
    return this.pixelSizeHeight - this.pixelSizeHeight * this.snakeSize;
  }

  private get xOffset() {
    return this.pixelSizeWidth - this.pixelSizeWidth * this.snakeSize;
  }
}
