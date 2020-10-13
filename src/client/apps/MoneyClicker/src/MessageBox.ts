export class MSG {
  id: HTMLImageElement;
  canvas: HTMLCanvasElement;

  imagePos = [0, 0, 0, 0];
  screenCover: number; //%
  screenCoverAnimation = 0;
  pictureRatio: number;

  button = 2;

  buttonPos0 = [0, 0, 0, 0];
  buttonPos1 = [0, 0, 0, 0];
  buttonPos2 = [0, 0, 0, 0];

  open = false;
  title: string;

  text0: string;
  text1: string;
  text2: string;
  text3: string;

  button0Text: string;
  button1Text: string;
  button2Text: string;

  titleSize: number;
  titlePos = [0, 0];
  text0Pos = [0, 0];
  text1Pos = [0, 0];
  text2Pos = [0, 0];
  text3Pos = [0, 0];
  textSize: number;
  buttonTextPos0 = [0, 0];
  buttonTextPos1 = [0, 0];
  buttonTextPos2 = [0, 0];
  buttonTextSize: number;

  selected: number;
  drawinTime = 250; //5 second

  buttonColor = '#4040ff';
  textColor = 'white';

  openAnimation = false;
  closeAnimation = false;
  isLandscape = true;

  performanceNow = 0;

  //Picture and screenCoverAnimation in %
  constructor(canvas: HTMLCanvasElement, picture: HTMLImageElement, screenCover: number) {
    this.id = picture;
    this.canvas = canvas;
    this.screenCover = screenCover; //Messge box screen coverage on Landscapemode

    this.pictureRatio = picture.height / picture.width;
  }

  //Element Aligner
  private box(): void {
    const x = this.canvas.width * (this.screenCoverAnimation / 100);
    let y = x * this.pictureRatio;

    if (y > this.canvas.height * (this.screenCoverAnimation / 100))
      y = this.canvas.height * (this.screenCoverAnimation / 100);

    this.imagePos[0] = (this.canvas.width - x) / 2;
    this.imagePos[1] = this.canvas.height / 2 - y / 2;
    this.imagePos[2] = x;
    this.imagePos[3] = y;
  }

  //Short function for clicks
  public click(x: number, y: number): void {
    this.clickButton0(x, y);
    this.clickButton1(x, y);
    this.clickButton2(x, y);
  }

  //Click detector for button 0
  private clickButton0(x: number, y: number): void {
    const a = this.buttonPos0[0] < x;
    const b = this.buttonPos0[1] < y;
    const c = this.buttonPos0[0] + this.buttonPos0[2] > x;
    const d = this.buttonPos0[1] + this.buttonPos0[3] > y;

    if (a && b && c && d) {
      this.selected = 0;
    }
  }

  //Click detector for button 1
  private clickButton1(x: number, y: number): void {
    const a = this.buttonPos1[0] < x;
    const b = this.buttonPos1[1] < y;
    const c = this.buttonPos1[0] + this.buttonPos1[2] > x;
    const d = this.buttonPos1[1] + this.buttonPos1[3] > y;

    if (a && b && c && d) {
      this.selected = 1;
    }
  }

  //Click detector for button 2
  private clickButton2(x: number, y: number): void {
    const a = this.buttonPos2[0] < x;
    const b = this.buttonPos2[1] < y;
    const c = this.buttonPos2[0] + this.buttonPos2[2] > x;
    const d = this.buttonPos2[1] + this.buttonPos2[3] > y;

    if (a && b && c && d) {
      this.selected = 2;
    }
  }

  //buttons alignment
  private buttons(): void {
    switch (this.button) {
      case 1:
        this.buttonPos0[0] = this.imagePos[0] + this.imagePos[2] * 0.025;
        this.buttonPos0[1] = this.imagePos[1] + this.imagePos[3] * 0.75;
        this.buttonPos0[2] = this.imagePos[2] * 0.4625;
        this.buttonPos0[3] = this.imagePos[3] * 0.2;

        this.buttonPos1[0] = this.imagePos[0] + this.imagePos[2] * 0.5124;
        this.buttonPos1[1] = this.imagePos[1] + this.imagePos[3] * 0.75;
        this.buttonPos1[2] = this.imagePos[2] * 0.4625;
        this.buttonPos1[3] = this.imagePos[3] * 0.2;

        this.buttonPos2 = [0, 0, 0, 0];
        break;

      case 2:
        const c = 1 / 3 - 0.0333333333;
        this.buttonPos0[0] = this.imagePos[0] + this.imagePos[2] * 0.025;
        this.buttonPos0[1] = this.imagePos[1] + this.imagePos[3] * 0.75;
        this.buttonPos0[2] = this.imagePos[2] * c;
        this.buttonPos0[3] = this.imagePos[3] * 0.2;

        this.buttonPos1[0] = this.imagePos[0] + this.imagePos[2] * (c + 0.05);
        this.buttonPos1[1] = this.imagePos[1] + this.imagePos[3] * 0.75;
        this.buttonPos1[2] = this.imagePos[2] * c;
        this.buttonPos1[3] = this.imagePos[3] * 0.2;

        this.buttonPos2[0] = this.imagePos[0] + this.imagePos[2] * (c * 2 + 0.075);
        this.buttonPos2[1] = this.imagePos[1] + this.imagePos[3] * 0.75;
        this.buttonPos2[2] = this.imagePos[2] * c;
        this.buttonPos2[3] = this.imagePos[3] * 0.2;
        break;

      default:
        this.buttonPos0[0] = this.imagePos[0] + this.imagePos[2] * 0.025;
        this.buttonPos0[1] = this.imagePos[1] + this.imagePos[3] * 0.75;
        this.buttonPos0[2] = this.imagePos[2] * 0.95;
        this.buttonPos0[3] = this.imagePos[3] * 0.2;

        this.buttonPos1 = [0, 0, 0, 0];
        this.buttonPos2 = [0, 0, 0, 0];
        break;
    }
  }

  //Text alignment
  private text(): void {
    this.titlePos[0] = this.imagePos[0] + this.imagePos[2] / 2;
    this.titlePos[1] = this.imagePos[1] + this.imagePos[3] * 0.15;
    this.titleSize = this.imagePos[3] * 0.18;

    this.text0Pos[0] = this.imagePos[0] + this.imagePos[2] * 0.05;
    this.text0Pos[1] = this.imagePos[1] + this.imagePos[3] * 0.3;

    this.text1Pos[0] = this.imagePos[0] + this.imagePos[2] * 0.05;
    this.text1Pos[1] = this.imagePos[1] + this.imagePos[3] * 0.4;

    this.text2Pos[0] = this.imagePos[0] + this.imagePos[2] * 0.05;
    this.text2Pos[1] = this.imagePos[1] + this.imagePos[3] * 0.5;

    this.text3Pos[0] = this.imagePos[0] + this.imagePos[2] * 0.05;
    this.text3Pos[1] = this.imagePos[1] + this.imagePos[3] * 0.6;
    this.textSize = this.imagePos[3] * 0.1;

    this.buttonTextPos0[0] = this.buttonPos0[0] + this.buttonPos0[2] * 0.5;
    this.buttonTextPos0[1] = this.buttonPos0[1] + this.buttonPos0[3] * 0.75;

    this.buttonTextPos1[0] = this.buttonPos1[0] + this.buttonPos1[2] * 0.5;
    this.buttonTextPos1[1] = this.buttonPos1[1] + this.buttonPos0[3] * 0.75;

    this.buttonTextPos2[0] = this.buttonPos2[0] + this.buttonPos2[2] * 0.5;
    this.buttonTextPos2[1] = this.buttonPos2[1] + this.buttonPos0[3] * 0.75;
    this.buttonTextSize = this.imagePos[3] * 0.15;
  }

  //Animation for message box
  private animate(lag: number): void {
    if (this.openAnimation == true) {
      if (this.screenCoverAnimation < this.screenCover + 5) {
        this.screenCoverAnimation += (lag * 100) / this.drawinTime;
        if (this.screenCoverAnimation > this.screenCover + 5) {
          this.screenCoverAnimation = this.screenCover;
          this.openAnimation = false;
        }
      }
    }

    if (this.closeAnimation == true) {
      this.openAnimation = false;
      if (this.screenCoverAnimation > 0) {
        this.screenCoverAnimation -= (lag * 100) / this.drawinTime;
        if (this.screenCoverAnimation < 0) {
          this.screenCoverAnimation = 0;
          this.closeAnimation = false;
          this.open = false;
        }
      }
    }
  }

  //Draw image on canvas
  public draw(): void {
    const now = performance.now();
    if (this.open) {
      this.landscapeCheck();
      this.animate(now - this.performanceNow);
      this.box();
      this.buttons();
      this.text();
      const c = this.canvas.getContext('2d');
      c.drawImage(this.id, this.imagePos[0], this.imagePos[1], this.imagePos[2], this.imagePos[3]);
      c.fillStyle = this.buttonColor;
      c.fillRect(this.buttonPos0[0], this.buttonPos0[1], this.buttonPos0[2], this.buttonPos0[3]);
      c.fillRect(this.buttonPos1[0], this.buttonPos1[1], this.buttonPos1[2], this.buttonPos1[3]);
      c.fillRect(this.buttonPos2[0], this.buttonPos2[1], this.buttonPos2[2], this.buttonPos2[3]);
      c.font = this.titleSize + 'px Arial';
      c.textAlign = 'center';
      c.fillStyle = this.textColor;
      c.fillText(this.title, this.titlePos[0], this.titlePos[1]);
      c.font = this.buttonTextSize + 'px Arial';
      c.fillText(this.button0Text, this.buttonTextPos0[0], this.buttonTextPos0[1]);
      c.fillText(this.button1Text, this.buttonTextPos1[0], this.buttonTextPos1[1]);
      c.fillText(this.button2Text, this.buttonTextPos2[0], this.buttonTextPos2[1]);
      c.textAlign = 'left';
      c.font = this.textSize + 'px Arial';
      c.fillText(this.text0, this.text0Pos[0], this.text0Pos[1]);
      c.fillText(this.text1, this.text1Pos[0], this.text1Pos[1]);
      c.fillText(this.text2, this.text2Pos[0], this.text2Pos[1]);
      c.fillText(this.text3, this.text3Pos[0], this.text3Pos[1]);
    }
    this.performanceNow = now;
  }

  private landscapeCheck(): void {
    this.canvas.width >= this.canvas.height ? (this.isLandscape = true) : (this.isLandscape = false);
  }

  //await MessageBox.show("Text","title","button","button1","button2");
  public show(text: string, title = '', button0 = 'OK', button1 = '', button2 = '') {
    this.selected = undefined;
    const splitLine = 30;

    const formatText = text.split('\n');

    this.text0 = formatText[0] ? formatText[0] : '';
    this.text1 = formatText[1] ? formatText[1] : '';
    this.text2 = formatText[2] ? formatText[2] : '';
    this.text3 = formatText[3] ? formatText[3] : '';

    this.open = true;
    this.openAnimation = true;
    this.closeAnimation = false;
    this.title = title;

    if (button1 == '') {
      this.button = 0;
    } else if (button2 == '') {
      this.button = 1;
    } else {
      this.button = 2;
    }

    this.button0Text = button0;
    this.button1Text = button1;
    this.button2Text = button2;

    return new Promise(resolve => {
      const a = setInterval(() => {
        if (this.selected !== undefined) {
          clearInterval(a);
          this.closeAnimation = true;

          resolve(this.selected);
        }
      }, 100);
    });
  }
}
