/* eslint-disable @typescript-eslint/camelcase */
import { clamp, sample } from "lodash";
import { Drawable } from "./Drawable";
import { Snake } from "./Snake";
import { IPoint, IWindowInfo } from "./SnakeGameLogic";
import { Renderer } from "./SnakeRender";

// drawing low poly circle

export class Food extends Drawable {
  private readonly foodColour = [59, 137, 255];
  private _onGridY = 0;
  private _onGridX = 0;
  private foodSize = 0.5;
  constructor(renderer: Renderer, private windowInfo: IWindowInfo, y: number, x: number) {
    super(renderer);
    this.red = this.foodColour[0];
    this.green = this.foodColour[1];
    this.blue = this.foodColour[2];
    this.onGridX = x;
    this.onGridY = y;
    this.y = this.sPosY;
    this.x = this.sPosX;
    this.setFoodSize(windowInfo);
    (window as any).food = this;
  }
  static randomPos(pixelHeight: number, pixelWidth: number, snake: Snake[]) {
    if (pixelHeight * pixelWidth < snake.length - 1) {
      return null;
    }
    const availableSlots: IPoint[] = [];
    const isColliding = (y: number, x: number) => {
      return snake.find(s => s.onGridY === y && s.onGridX === x);
    };
    for (let y = 0; y < pixelHeight; y++) {
      for (let x = 0; x < pixelHeight; x++) {
        if (!isColliding(y, x)) {
          availableSlots.push({ x, y });
        }
      }
    }
    return sample(availableSlots);
  }

  private setFoodSize(windowInfo?: IWindowInfo) {
    windowInfo = windowInfo || this.windowInfo;
    this.widthSize = (windowInfo.width / windowInfo.pixelWidth) * this.foodSize;
    this.heightSize = (windowInfo.height / windowInfo.pixelHeight) * this.foodSize;
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
  private get yOffset() {
    return this.pixelSizeHeight - this.pixelSizeHeight * this.foodSize;
  }
  private get xOffset() {
    return this.pixelSizeWidth - this.pixelSizeWidth * this.foodSize;
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

  private get pixelSizeWidth() {
    return this.windowInfo.width / this.windowInfo.pixelWidth;
  }
  private get pixelSizeHeight() {
    return this.windowInfo.height / this.windowInfo.pixelHeight;
  }
  get pos() {
    const x = clamp(this._onGridX, 1, this.windowInfo.pixelWidth + 1);
    const y = clamp(this._onGridY, 1, this.windowInfo.pixelHeight + 1);
    return { x, y };
  }

  get vertices() {
    // round "square" top-left
    const point1 = [this.posX + this.third, this.posY - this.third];
    const point2 = [this.posX + this.third * 2, this.posY - this.third];
    const point3 = [this.posX + this.third, this.posY - this.third * 2];
    const point4 = [this.posX + this.third * 2, this.posY - this.third * 2];

    const triangle1_1 = [this.posX, this.posY - this.third];
    const triangle1_2 = [this.posX + this.thirdOutOfThird, this.posY - this.thirdOutOfThird];
    const triangle1_3 = point1;

    const triangle2_1 = triangle1_2;
    const triangle2_2 = [this.posX + this.third, this.posY];
    const triangle2_3 = point1;

    // square
    const triangle3_1 = triangle2_2;
    const triangle3_2 = point2;
    const triangle3_3 = [this.posX + this.third * 2, this.posY];

    const triangle4_1 = triangle2_2;
    const triangle4_2 = point1;
    const triangle4_3 = triangle3_2;

    // round "square" top-right
    const triangle5_1 = point2;
    const triangle5_2 = triangle3_3;
    const triangle5_3 = [this.posX + this.third * 2 + this.thirdOutOfThird * 2, this.posY - this.thirdOutOfThird];

    const triangle6_1 = point2;
    const triangle6_2 = triangle5_3;
    const triangle6_3 = [this.posX + this.third * 3, this.posY - this.third];

    // Middle square
    const triangle7_1 = triangle1_1;
    const triangle7_2 = triangle6_3;
    const triangle7_3 = [this.posX, this.posY - this.third * 2];

    const triangle8_1 = triangle7_2;
    const triangle8_2 = triangle7_3;
    const triangle8_3 = [this.posX + this.third * 3, this.posY - this.third * 2];

    // round "square" bottom-left
    const triangle9_1 = [this.posX, this.posY - this.third * 2];
    const triangle9_2 = [this.posX + this.thirdOutOfThird, this.posY - this.third * 2 - this.thirdOutOfThird * 2];
    const triangle9_3 = point3;

    const triangle10_1 = triangle9_2;
    const triangle10_2 = point3;
    const triangle10_3 = [this.posX + this.third, this.posY - this.third * 3];

    // // square bottom
    const triangle11_1 = triangle10_3;
    const triangle11_2 = point3;
    const triangle11_3 = point4;

    const triangle12_1 = triangle11_1;
    const triangle12_2 = [this.posX + this.third * 2, this.posY - this.third * 3];
    const triangle12_3 = point4;

    // // round "square" right-bottom
    const triangle13_1 = triangle12_2;
    const triangle13_2 = [
      this.posX + this.third * 2 + this.thirdOutOfThird * 2,
      this.posY - this.third * 3 + this.thirdOutOfThird,
    ];
    const triangle13_3 = point4;

    const triangle14_1 = triangle8_3;
    const triangle14_2 = triangle13_2;
    const triangle14_3 = point4;

    return [
      ...triangle1_1,
      ...this.colour,
      ...triangle1_2,
      ...this.colour,
      ...triangle1_3,
      ...this.colour,

      ...triangle2_1,
      ...this.colour,
      ...triangle2_2,
      ...this.colour,
      ...triangle2_3,
      ...this.colour,

      ...triangle3_1,
      ...this.colour,
      ...triangle3_2,
      ...this.colour,
      ...triangle3_3,
      ...this.colour,

      ...triangle4_1,
      ...this.colour,
      ...triangle4_2,
      ...this.colour,
      ...triangle4_3,
      ...this.colour,

      ...triangle5_1,
      ...this.colour,
      ...triangle5_2,
      ...this.colour,
      ...triangle5_3,
      ...this.colour,

      ...triangle6_1,
      ...this.colour,
      ...triangle6_2,
      ...this.colour,
      ...triangle6_3,
      ...this.colour,

      ...triangle7_1,
      ...this.colour,
      ...triangle7_2,
      ...this.colour,
      ...triangle7_3,
      ...this.colour,

      ...triangle8_1,
      ...this.colour,
      ...triangle8_2,
      ...this.colour,
      ...triangle8_3,
      ...this.colour,

      ...triangle9_1,
      ...this.colour,
      ...triangle9_2,
      ...this.colour,
      ...triangle9_3,
      ...this.colour,

      ...triangle10_1,
      ...this.colour,
      ...triangle10_2,
      ...this.colour,
      ...triangle10_3,
      ...this.colour,

      ...triangle11_1,
      ...this.colour,
      ...triangle11_2,
      ...this.colour,
      ...triangle11_3,
      ...this.colour,

      ...triangle12_1,
      ...this.colour,
      ...triangle12_2,
      ...this.colour,
      ...triangle12_3,
      ...this.colour,

      ...triangle13_1,
      ...this.colour,
      ...triangle13_2,
      ...this.colour,
      ...triangle13_3,
      ...this.colour,

      ...triangle14_1,
      ...this.colour,
      ...triangle14_2,
      ...this.colour,
      ...triangle14_3,
      ...this.colour,
    ];
  }

  private get third() {
    return this.verticalSize / 3;
  }

  private get thirdOutOfThird() {
    return this.third / 3;
  }
  get shapes() {
    return 7;
  }
}
