import { EventEmitter } from "events";

interface shop {
  shopName: string;
  canvas: HTMLCanvasElement;
  topImg: HTMLImageElement;
  middleImg: HTMLImageElement;
  bottomImg: HTMLImageElement;
  bottomImgLandscape: HTMLImageElement;
  shopListImg: HTMLImageElement;
}

export class ShopInterface extends EventEmitter {
  spliter = "";
  canvas: HTMLCanvasElement;

  topShopPicture: HTMLImageElement;
  midShopPicture: HTMLImageElement;
  botShopPicture: HTMLImageElement;
  bottomShopPicturePortrait: HTMLImageElement;
  bottomShopPictureLandscape: HTMLImageElement;
  shopList: HTMLImageElement;
  exitIcon: HTMLImageElement;

  topShopPictureRatio: number;
  midShopPictureRatio: number;
  bottomShopPictureRatio: number;
  shopListRatio: number;
  isLandscape = true;

  backgroundPos = [0, 0, 0, 0];
  topShopPos = [0, 0, 0, 0];
  midShopPos = [0, 0, 0, 0];
  botShopPos = [0, 0, 0, 0];
  listPos = [0, 0, 0, 0];
  clickArea = [0, 0, 0, 0];
  scroll = [0, 0, 0, 0];
  listDragPos = 0;

  rightLine: number;

  boxColor = "rgba(0,0,0,0.75)";
  boxColorNot = "rgba(0,0,0,0)";
  backgroundColor = "#17181c";
  valueColor = "#ffffff";
  scrollColor = "#575757";
  boxBoughtColor = "rgba(0,255,156,0.50)";

  isMoving: any = null;
  isMovingDelay: any;

  isOpen = false;
  openDelay = 350;
  openDelayP = 200;
  openAnimation = true;
  closeAnimation = false;
  canScroll = true;

  clicksEnabled = true;
  mouseDetect: number;

  valueSize = 50;

  animationTime = 350;
  animationProgress = 0;
  performanceNow = 0;

  value: number;
  valuePos = [0, 0];

  boxXpos = 0;
  boxYpos = [0];
  boxXweight = 0;
  boxYheight = 0;
  boxEnabled = [false];
  boxBought = [false];

  lvl: number[];
  cps: number[];
  price: number[];

  lvlXPos = 0;
  cpsXPos = 0;
  priceXPos = 0;

  lvlYPos = [0];
  cpsYPos = [0];
  priceYPos = [0];

  shopName: string;
  lvlSize = 0;
  cpsSize = 0;
  priceSize = 0;

  lastY = 0;
  timescrollAnimation = 250;

  howMuchScrolled = 0;
  dragTimeout = 0;
  dragReset = false;

  click = false;
  exiting = false;

  constructor(shop: shop) {
    super();

    this.shopName = shop.shopName;
    this.canvas = shop.canvas;
    this.topShopPicture = shop.topImg;
    this.midShopPicture = shop.middleImg;
    this.bottomShopPicturePortrait = shop.bottomImg;
    this.bottomShopPictureLandscape = shop.bottomImgLandscape;
    this.shopList = shop.shopListImg;

    this.topShopPictureRatio = this.topShopPicture.height / this.topShopPicture.width;
    this.midShopPictureRatio = this.midShopPicture.height / this.midShopPicture.width;
    this.bottomShopPictureRatio = this.bottomShopPicturePortrait.height / this.bottomShopPicturePortrait.width;
    this.shopListRatio = this.shopList.height / this.shopList.width;
  }

  //requed for landscape
  public setRightLine(rightLine: number): void {
    this.rightLine = rightLine / 100;
  }

  //setValue
  public setButtonValues(lvl: number[], cps: number[], price: number[]) {
    this.lvl = lvl;
    this.cps = cps;
    this.price = price;
  }

  //check if canvas is in landscape mode
  private landscapeCheck(): void {
    this.canvas.width >= this.canvas.height ? (this.isLandscape = true) : (this.isLandscape = false);
  }

  //click detector
  public exitClick(x: number, y: number) {
    if (this.clicksEnabled) {
      if (this.isOpen) {
        if (!this.isLandscape) {
          const a = this.botShopPos[2] * 0.85 < x;
          const b = this.canvas.height - this.botShopPos[3] < y;
          if (a && b) {
            this.exiting = true;
            setTimeout(() => {
              this.exiting = false;
            }, 0);
            this.closeAnimation = true;
            return true;
          }
        }
      }
    }
  }

  public elementClick(x: number, y: number) {
    if (!this.clicksEnabled || !this.isOpen) return;
    if (this.dragTimeout > 2) return;
    if (this.exiting) return;

    for (let i = 0; i < this.price.length; i++) {
      const a = this.boxXpos < x;
      const b = this.boxYpos[i] < y;
      const c = this.boxXweight + this.boxXpos * 0.95 > x;
      const d = this.boxYheight + this.boxYpos[i] * 0.95 > y;

      if (a && b && c && d) {
        this.emit("bought", {
          shopName: this.shopName,
          lvl: this.lvl,
          cps: this.cps,
          price: this.price,
          boughtElementIndex: i,
        });
        if (this.boxEnabled[i]) return true;
        return false;
      }
    }
  }

  public clickDetector(x: number, y: number): void {
    if (!this.clicksEnabled) return;

    const a = this.clickArea[0] < x;
    const b = this.clickArea[1] < y;
    const c = this.clickArea[2] + this.clickArea[0] > x;
    const d = this.clickArea[3] + this.clickArea[1] > y;

    if (a && b && c && d) {
      if (this.dragTimeout == 0) {
        this.dragReset = false;
        this.lastY = y - this.listDragPos;
      }

      this.listDragPos = -(this.lastY - y);

      this.howMuchScrolled = -(this.lastY - y);
    }
    this.dragTimeout = 5;
  }

  //open shop
  public open() {
    let delay: number;

    if (this.isLandscape) delay = this.openDelay;
    else delay = this.openDelayP;

    setTimeout(() => {
      this.isOpen = true;
    }, delay);
  }

  public close() {
    if (!this.openAnimation) {
      this.openAnimation = true;
      this.closeAnimation = true;
    }
  }

  public setValue(value: number) {
    this.value = value;
  }

  public scrollSystem(number: number) {
    if (this.clicksEnabled) this.listDragPos -= number;
  }

  //animations
  animate(lag: number): void {
    const overshot = 1.0;

    if (this.isOpen) {
      //overscroll fix
      if (this.dragTimeout == 0 && this.listDragPos > 0) {
        this.listDragPos -= this.clickArea[3] * (lag / this.timescrollAnimation);
        if (this.listDragPos < 0) this.listDragPos = 0;
      } else if (this.dragTimeout == 0 && this.listDragPos < this.clickArea[3] - this.listPos[3]) {
        this.listDragPos += this.clickArea[3] * (lag / this.timescrollAnimation);
        if (this.listDragPos > this.clickArea[3] - this.listPos[3])
          this.listDragPos = this.clickArea[3] - this.listPos[3];
      }

      //open animation
      if (this.openAnimation && this.animationProgress < overshot) {
        this.animationProgress += lag / this.animationTime;
        if (this.animationProgress > overshot) {
          this.openAnimation = false;
          this.animationProgress = 1;
        }
      } else {
        //close animation

        if (this.closeAnimation && this.animationProgress > 0) {
          if (!this.isLandscape) this.listDragPos = 0;
          this.animationProgress -= lag / this.animationTime;
          if (this.animationProgress < 0) this.animationProgress = 0;
        } else if (this.closeAnimation) {
          this.openAnimation = true;
          this.closeAnimation = false;
          this.isOpen = false;
        }
      }
    }
  }

  public disableClicks() {
    this.clicksEnabled = false;
  }
  public enableClicks() {
    this.clicksEnabled = true;
  }

  //Align Elements
  private alignElements() {
    const inside = 0.07;

    let animationProgress: number;
    let listPosS: number;

    if (this.isLandscape) {
      animationProgress = this.canvas.width * this.rightLine * (1 - this.animationProgress);

      this.botShopPicture = this.bottomShopPictureLandscape;

      this.backgroundPos[0] = this.canvas.width * (1 - this.rightLine) + animationProgress;
      this.backgroundPos[1] = 0;
      this.backgroundPos[2] = this.canvas.width - (1 - this.rightLine);
      this.backgroundPos[3] = this.canvas.height;

      this.topShopPos[0] = this.canvas.width * (1 - this.rightLine) + animationProgress;
      this.topShopPos[1] = 0;
      this.topShopPos[2] = this.canvas.width * this.rightLine;
      this.topShopPos[3] = this.topShopPos[2] * this.topShopPictureRatio;

      this.botShopPos[0] = this.canvas.width * (1 - this.rightLine) + animationProgress;
      this.botShopPos[2] = this.canvas.width * this.rightLine;
      this.botShopPos[3] = this.botShopPos[2] * this.bottomShopPictureRatio;
      this.botShopPos[1] = this.canvas.height - this.botShopPos[3];

      this.midShopPos[0] = this.canvas.width * (1 - this.rightLine) + animationProgress;
      this.midShopPos[1] = 0;
      this.midShopPos[2] = this.canvas.width * this.rightLine;
      this.midShopPos[3] = this.canvas.height - this.topShopPos[3] + this.botShopPos[3];

      this.listPos[0] =
        this.canvas.width * (1 - this.rightLine) + (this.canvas.width - this.listPos[0]) * inside + animationProgress;
      listPosS = this.topShopPos[3];
      this.listPos[1] = (this.topShopPos[3] + this.listDragPos) * 1.01;
      this.listPos[2] = this.canvas.width * this.rightLine * (1 - inside * 1.9);
      this.listPos[3] = this.listPos[2] * this.shopListRatio;

      this.clickArea[0] =
        this.canvas.width * (1 - this.rightLine) + (this.canvas.width - this.listPos[0]) * inside + animationProgress;
      this.clickArea[1] = this.topShopPos[3];
      this.clickArea[2] = this.canvas.width * this.rightLine * (1 - inside * 1.9);
      this.clickArea[3] = this.canvas.height - this.botShopPos[3] * 2.25;

      this.valueSize = 0;
      this.valuePos[0] = -50;
      this.valuePos[1] = -50;
    } else {
      animationProgress = this.canvas.height * (1 - this.animationProgress);

      this.botShopPicture = this.bottomShopPicturePortrait;

      this.backgroundPos[0] = 0;
      this.backgroundPos[1] = animationProgress;
      this.backgroundPos[2] = this.canvas.width;
      this.backgroundPos[3] = this.canvas.height;

      this.topShopPos[0] = 0;
      this.topShopPos[1] = animationProgress;
      this.topShopPos[2] = this.canvas.width;
      this.topShopPos[3] = this.topShopPos[2] * this.topShopPictureRatio;

      this.botShopPos[0] = 0;
      this.botShopPos[2] = this.canvas.width;
      this.botShopPos[3] = this.botShopPos[2] * this.bottomShopPictureRatio;
      this.botShopPos[1] = this.canvas.height - this.botShopPos[3] + animationProgress;

      this.midShopPos[0] = 0;
      this.midShopPos[1] = animationProgress;
      this.midShopPos[2] = this.canvas.width;
      this.midShopPos[3] = this.canvas.height - this.topShopPos[3] + this.botShopPos[3];

      this.listPos[0] = this.canvas.width * inside;
      listPosS = this.topShopPos[3] + animationProgress;
      this.listPos[1] = (this.topShopPos[3] + animationProgress) * 1.01 + this.listDragPos;
      this.listPos[2] = this.canvas.width * (1 - inside * 2);
      this.listPos[3] = this.listPos[2] * this.shopListRatio;

      this.clickArea[0] = this.canvas.width * inside;
      this.clickArea[1] = this.topShopPos[3] + animationProgress;
      this.clickArea[2] = this.canvas.width * (1 - inside * 1.9);
      this.clickArea[3] = this.canvas.height - this.botShopPos[3] * 2.9;

      this.valueSize = this.botShopPos[2] * 0.089;
      this.valuePos[0] = this.canvas.width * 0.5;
      this.valuePos[1] = this.botShopPos[1] + this.botShopPos[3] * 0.65;
    }

    this.boxXpos = this.listPos[0];
    this.boxXweight = this.listPos[2];
    this.boxYheight = this.listPos[3] / this.price.length;

    this.cpsXPos = this.listPos[0] + this.listPos[2] * 0.2; //1.08
    this.priceXPos = this.listPos[0] + this.listPos[2] * 0.2;
    this.lvlXPos = this.listPos[0] + this.listPos[2] * 0.98;

    this.lvlSize = this.listPos[2] * 0.05;
    this.cpsSize = this.listPos[2] * 0.05;
    this.priceSize = this.listPos[2] * 0.075;

    this.scroll[0] = this.clickArea[0] + this.listPos[2] * 1.025;
    this.scroll[1] = this.clickArea[1];
    this.scroll[2] = this.listPos[2] * 0.03;
    if (this.clickArea[3] - this.listPos[3] > 0) this.scroll[3] = 0;
    else {
      this.scroll[3] = this.clickArea[3] * (1 - (this.listPos[3] - this.clickArea[3]) / this.listPos[3]);

      const a = this.clickArea[3] - this.scroll[3];
      const b = this.listDragPos * -1;
      const c = (this.clickArea[3] - this.listPos[3]) * -1;
      const d = (a * b) / c;
      if (d > 0) this.scroll[1] += (a * b) / c;
      if (b / c > 1) this.scroll[1] = a + this.topShopPos[3];
    }
    this.clickArea[3] > this.listPos[3] ? (this.canScroll = false) : (this.canScroll = true);
    if (!this.canScroll) {
      this.listPos[1] = listPosS;
      this.listDragPos = 0;
    }
  }

  private list(i: number) {
    const size = this.listPos[3] / this.price.length;
    this.boxYpos[i] = this.listPos[1] + size * i;

    this.cpsYPos[i] = this.listPos[1] + size * i + size * 0.55;
    this.priceYPos[i] = this.listPos[1] + size * i + size * 0.9;
    this.lvlYPos[i] = this.listPos[1] + size * i + size * 0.85;
  }

  public draw() {
    if (this.dragTimeout > 0) this.dragTimeout--;

    if (this.dragTimeout == 5) this.howMuchScrolled = 0;

    const now = performance.now();
    if (this.isOpen) {
      const c = this.canvas.getContext("2d");
      this.landscapeCheck();
      this.alignElements();

      this.animate(now - this.performanceNow);

      c.fillStyle = this.backgroundColor;
      c.fillRect(this.backgroundPos[0], this.backgroundPos[1], this.backgroundPos[2], this.backgroundPos[3]);
      c.drawImage(this.shopList, this.listPos[0], this.listPos[1], this.listPos[2], this.listPos[3]);

      for (let i = 0; i < this.price.length; i++) {
        if (this.price[i] >= this.value) this.boxEnabled[i] = true;
        else if (this.price[i] == -1) {
          this.boxEnabled[i] = true;
          this.boxBought[i] = true;
        } else {
          this.boxEnabled[i] = false;
          this.boxBought[i] = false;
        }
        this.list(i);

        c.fillStyle = this.valueColor;
        c.textAlign = "left";
        c.font = this.lvlSize + "px ds-digi";
        if (this.cps[i] >= 0) {
          const displyCPS = this.cps[i].toString().match(/.{1,3}/g);
          c.fillText("CPS+ " + displyCPS.join(this.spliter), this.cpsXPos, this.cpsYPos[i]);
        }
        c.textAlign = "left";
        c.font = this.priceSize + "px ds-digi";
        if (this.price[i] >= 0) {
          const displyPrice = this.price[i].toString().match(/.{1,3}/g);
          c.fillText(displyPrice.join(this.spliter), this.priceXPos, this.priceYPos[i]);
        } else {
          c.fillText("Already bought", this.priceXPos, this.priceYPos[i]);
        }
        c.textAlign = "right";
        c.font = this.lvlSize + "px ds-digi";

        c.fillText("LVL: " + this.lvl[i].toString(), this.lvlXPos, this.lvlYPos[i]);

        if (this.boxEnabled[i] && !this.boxBought[i]) c.fillStyle = this.boxColor;
        else if (this.boxBought[i]) c.fillStyle = this.boxBoughtColor;
        else c.fillStyle = this.boxColorNot;
        c.fillRect(this.boxXpos, this.boxYpos[i], this.boxXweight, this.boxYheight);
      }

      c.drawImage(this.midShopPicture, this.midShopPos[0], this.midShopPos[1], this.midShopPos[2], this.midShopPos[3]);
      c.drawImage(this.topShopPicture, this.topShopPos[0], this.topShopPos[1], this.topShopPos[2], this.topShopPos[3]);
      c.drawImage(this.botShopPicture, this.botShopPos[0], this.botShopPos[1], this.botShopPos[2], this.botShopPos[3]);
      c.fillStyle = this.valueColor;
      c.textAlign = "center";
      c.font = this.valueSize + "px ds-digi";

      const displyValue = this.value.toString().match(/.{1,3}/g);

      c.fillText(displyValue.join(this.spliter), this.valuePos[0], this.valuePos[1]);

      c.fillStyle = this.scrollColor;
      c.fillRect(this.scroll[0], this.scroll[1], this.scroll[2], this.scroll[3]);
    }
    this.performanceNow = now;
  }
}
