export class CustomCursor {
  id: HTMLImageElement;
  canvas: HTMLCanvasElement;

  x: number;
  y: number;
  lastX: number;
  lastY: number;
  angle = 0;

  delay = 0;

  rotation = 0;

  imagePos = [0, 0, 0, 0];

  imgRatio = 1;

  constructor(canvas: HTMLCanvasElement, img: HTMLImageElement) {
    this.id = img;
    this.canvas = canvas;

    this.x = canvas.height * 0.5;
    this.y = canvas.width * 0.5;

    this.lastX = this.x;
    this.lastY = this.y;

    this.imgRatio = img.width / img.height;
  }

  public update(x: number, y: number) {
    if (this.delay > 20) {
      let nowX = this.x - x;
      let nowY = this.y - y;

      let angle = 0;
      if (nowX >= 0 && nowY >= 0) {
        console.log('A<');

        if (nowX < 0) nowX *= -1;
        if (nowY < 0) nowY *= -1;
        angle = Math.atan(nowX / nowY) * (180 / Math.PI) + 270;
      } else if (nowX < 0 && nowY >= 0) {
        console.log('>A');
        if (nowX < 0) nowX *= -1;
        if (nowY < 0) nowY *= -1;
        angle = Math.atan(nowX / nowY) * (180 / Math.PI);
      } else if (nowX < 0 && nowY < 0) {
        console.log('>V');
        if (nowX < 0) nowX *= -1;
        if (nowY < 0) nowY *= -1;
        angle = Math.atan(nowX / nowY) * (180 / Math.PI) + 90;
      } else if (nowX >= 0 && nowY < 0) {
        console.log('<V');
        if (nowX < 0) nowX *= -1;
        if (nowY < 0) nowY *= -1;
        angle = Math.atan(nowX / nowY) * (180 / Math.PI) + 180;
      }

      this.lastX = 0;
      this.lastY = 0;
      this.delay = 0;

      this.angle = angle;
      console.log(this.delay, nowX, nowY, this.angle);
    }
    this.delay++;
    this.x = x;
    this.y = y;
  }

  public updateScale() {
    const something = this.canvas.height + this.canvas.width;

    this.imagePos[2] = something * 0.05;
    this.imagePos[3] = this.imagePos[2] * this.imgRatio;

    this.imagePos[0] = this.x;
    this.imagePos[1] = this.y;

    this.imagePos[0] = this.x - this.imagePos[2] * 0.5;
    this.imagePos[1] = this.y - this.imagePos[3] * 0.5;
  }

  public draw() {
    this.updateScale();
    //this.rotation += 1;
    //console.log(this.x, this.y);

    const c = this.canvas.getContext('2d');

    c.save();

    c.translate(this.x, this.y);
    c.rotate((this.angle * Math.PI) / 180);
    c.translate(-this.x, -this.y);

    c.drawImage(this.id, this.imagePos[0], this.imagePos[1], this.imagePos[2], this.imagePos[2]);
    c.restore();
  }
}
