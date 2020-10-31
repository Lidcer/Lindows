import { clamp } from "lodash";
import { Renderer } from "./SnakeRender";

export abstract class Drawable {
  private readonly maxColourRage = 255;
  protected r = 0;
  protected g = 0;
  protected b = 0;

  private sizeWidth = 0;
  private sizeHeight = 0;

  protected posX = 0;
  protected posY = 0;

  constructor(protected renderer: Renderer) {}
  abstract get shapes(): number;
  abstract get vertices(): number[];

  protected get colour() {
    return [this.r, this.g, this.b];
  }
  protected get horizontalSize() {
    return (this.sizeWidth / this.renderer.width) * 2;
  }
  protected get verticalSize() {
    return (this.sizeHeight / this.renderer.height) * 2;
  }

  set size(number: number) {
    this.sizeWidth = number;
    this.sizeHeight = number;
  }
  set widthSize(number: number) {
    this.sizeWidth = number;
  }
  set heightSize(number: number) {
    this.sizeHeight = number;
  }
  get x() {
    return ((this.posX + 1) / 2) * this.renderer.width;
  }
  set x(x: number) {
    this.posX = (x / this.renderer.width) * 2 - 1;
  }
  get y() {
    return this.renderer.height - ((this.posY + 1) / 2) * this.renderer.height;
  }
  set y(y: number) {
    this.posY = -((y / this.renderer.height) * 2 - 1);
  }
  get red() {
    return this.r * this.maxColourRage;
  }
  set red(red: number) {
    red = clamp(red, 0, this.maxColourRage);
    this.r = red / this.maxColourRage;
  }
  get blue() {
    return this.b * this.maxColourRage;
  }
  set blue(blue: number) {
    blue = clamp(blue, 0, this.maxColourRage);
    this.b = blue / this.maxColourRage;
  }
  get green() {
    return this.g * this.maxColourRage;
  }
  set green(green: number) {
    green = clamp(green, 0, this.maxColourRage);
    this.g = green / this.maxColourRage;
  }
}
