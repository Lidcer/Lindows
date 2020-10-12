import { MoneyClickerPictureReferences } from './ImageReferences';

export class MoneyImages {
  private images: HTMLImageElement[] = [];
  private _imageError: ErrorEvent;
  money1: HTMLImageElement;
  money5: HTMLImageElement;
  money10: HTMLImageElement;
  money20: HTMLImageElement;
  money50: HTMLImageElement;
  money100: HTMLImageElement;
  money200: HTMLImageElement;
  money500: HTMLImageElement;

  constructor() {
    this.money1 = this.createImage(MoneyClickerPictureReferences.Money1);
    this.money5 = this.createImage(MoneyClickerPictureReferences.Money5);
    this.money10 = this.createImage(MoneyClickerPictureReferences.Money10);
    this.money20 = this.createImage(MoneyClickerPictureReferences.Money20);
    this.money50 = this.createImage(MoneyClickerPictureReferences.Money50);
    this.money100 = this.createImage(MoneyClickerPictureReferences.Money100);
    this.money200 = this.createImage(MoneyClickerPictureReferences.Money200);
    this.money500 = this.createImage(MoneyClickerPictureReferences.Money500);
  }

  private createImage(source: string) {
    const image = new Image();
    image.addEventListener('error', ev => {
      this._imageError = ev;
    });
    image.src = source;
    this.images.push(image);
    return image;
  }
  get loaded() {
    return this.images.filter(i => i.complete).length;
  }
  get totalImages() {
    return this.images.length;
  }
  get imageError() {
    return this._imageError;
  }
}
