export interface ImageLoader {
  onImageLoad(Image: HTMLImageElement, src: string, status: number): void;
}

export class ImageLoader {
  private imagesToLoad = [];
  private loadedImages: HTMLImageElement[] = [];
  private destroyed = false;

  constructor(images: string[]) {
    this.imagesToLoad = [...images];
  }
  private loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.src = src;
      const removeEventListeiner = () => {
        image.removeEventListener("load", onLoad);
        image.removeEventListener("error", onError);
      };
      const onLoad = () => {
        removeEventListeiner();
        return resolve(image);
      };
      const onError = (error: ErrorEvent) => {
        removeEventListeiner();
        return reject(error);
      };

      image.addEventListener("load", onLoad);
      image.addEventListener("error", onError);
      image.src = src;
    });
  }

  async loadAll() {
    for (const src of this.imagesToLoad) {
      if (this.destroyed) return;
      const image = await this.loadImage(src);
      this.loadedImages.push(image);
      if (this.destroyed) return;
      if (this.onImageLoad) {
        this.onImageLoad(image, src, this.status);
      }
    }
  }

  get status() {
    return (this.loadedImages.length / this.imagesToLoad.length) * 100;
  }

  destroy() {
    this.destroyed = true;
  }
}
