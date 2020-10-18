import { MSG } from './src/MessageBox';
import { Background } from './src/Background';
import { RotatingThing } from './src/RotatingThing';
import { Money } from './src/Money';
import { ShopIcon } from './src/ShopIcon';
import { TextCounter } from './src/TextCounter';
import { ShopInterface } from './src/ShopInterface';
import { MoneyClickerSaveGameData, Values } from './src/Values';
import { MoneyImages } from './src/MoneyImages';

import { BlackHole } from './src/BlackHole';
import { MoneyClickerPictureReferences } from './src/ImageReferences';
import { attachToWindowIfDev } from '../../essential/requests';
import { MoneyClicker } from './MoneyClicker';
import { ImageLoader } from './src/ImageLoader';

export class MoneyClickerGame {
  private background: Background;
  private messageBox: MSG;
  private rotatingThing: RotatingThing;
  private vorIcon: ShopIcon;
  private smallBangIcon: ShopIcon;
  private upgradeIcon: ShopIcon;
  private vor: ShopInterface;
  private smallBang: ShopInterface;
  private upgrades: ShopInterface;
  private money: Money;
  private textLabel: TextCounter;
  private values: Values;
  private moneyPics: MoneyImages;
  private blackHole: BlackHole;
  private endGame = false;
  private endGameMessageBox: MSG;
  private mobileTouch = false;
  private isLandscape = false;
  private mouseDown = false;
  private images: HTMLImageElement[] = [];

  private messageBoxPic: HTMLImageElement;
  private rotatingThingPic: HTMLImageElement;

  private vorPic: HTMLImageElement;
  private smallBangPic: HTMLImageElement;
  private upgradePic: HTMLImageElement;

  private vorTop: HTMLImageElement;
  private vorMid: HTMLImageElement;
  private vorBotP: HTMLImageElement;
  private vorBotL: HTMLImageElement;
  private vorL: HTMLImageElement;

  private sBTop: HTMLImageElement;
  private slBMid: HTMLImageElement;
  private sBBotP: HTMLImageElement;
  private sBBotL: HTMLImageElement;
  private sBL: HTMLImageElement;

  private upTop: HTMLImageElement;
  private upBMid: HTMLImageElement;
  private upBotP: HTMLImageElement;
  private upBotL: HTMLImageElement;
  private upL: HTMLImageElement;

  private imageLoader: ImageLoader;

  private paused = false;

  private blackHoleImg: HTMLImageElement;

  private imageError: ErrorEvent;

  constructor(
    private canvas: HTMLCanvasElement,
    private moneyClickerWindow: MoneyClicker,
    private getData: () => MoneyClickerSaveGameData | undefined,
    private setData: (data: MoneyClickerSaveGameData, quick: boolean) => Promise<void>,
  ) {}

  private addEventListeners() {
    // window.addEventListener('resize', () => {
    //   if (this.canvas.hidden) return;
    //   dynamicResolution();
    // });

    //navigation.loadingAnimation('0', true);

    this.canvas.addEventListener('mousedown', event => {
      this.mouseDown = true;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.mouseDown = false;
      this.background.mouseDownDisable();
    });

    this.canvas.addEventListener('wheel', wheel => {
      if (this.upgrades.isOpen) this.upgrades.scrollSystem(wheel.deltaY);
      if (this.smallBang.isOpen) this.smallBang.scrollSystem(wheel.deltaY);
      if (this.vor.isOpen) this.vor.scrollSystem(wheel.deltaY);
    });

    this.canvas.addEventListener(
      'touchend',
      event => {
        const rect = this.canvas.getBoundingClientRect();

        const t = event.touches.length - 1;

        if (!event.touches[t]) return;
        if (this.money.click(event.touches[t].pageX, event.touches[t].pageY)) this.values.moneyClick();

        if (t === 0) {
          this.messageBox.click(event.touches[t].pageX - rect.left, event.touches[t].pageY - rect.top);
          this.endGameMessageBox.click(event.touches[t].pageX - rect.left, event.touches[t].pageY - rect.top);
          if (this.vor.exitClick(event.touches[t].pageX - rect.left, event.touches[t].pageY - rect.top))
            this.enableIconClicks();
          if (this.smallBang.exitClick(event.touches[t].pageX - rect.left, event.touches[t].pageY - rect.top))
            this.enableIconClicks();
          if (this.upgrades.exitClick(event.touches[t].pageX - rect.left, event.touches[t].pageY - rect.top))
            this.enableIconClicks();

          if (this.vorIcon.click(event.touches[t].pageX - rect.left, event.touches[t].pageY - rect.top))
            this.buttons(1);
          if (this.smallBangIcon.click(event.touches[t].pageX - rect.left, event.touches[t].pageY - rect.top))
            this.buttons(2);
          if (this.upgradeIcon.click(event.touches[t].pageX - rect.left, event.touches[t].pageY - rect.top))
            this.buttons(3);

          this.vor.elementClick(event.touches[t].pageX - rect.left, event.touches[t].pageY - rect.top);
          this.smallBang.elementClick(event.touches[t].pageX - rect.left, event.touches[t].pageY - rect.top);
          this.upgrades.elementClick(event.touches[t].pageX - rect.left, event.touches[t].pageY - rect.top);
        }

        this.mobileTouch = true;
      },
      false,
    );

    this.canvas.addEventListener('mousemove', event => {
      if (this.mouseDown) {
        this.background.clickDetector(event.offsetX, event.offsetY);
        this.vor.clickDetector(event.offsetX, event.offsetY);
        this.smallBang.clickDetector(event.offsetX, event.offsetY);
        this.upgrades.clickDetector(event.offsetX, event.offsetY);
      }
    });

    this.canvas.addEventListener('touchmove', event => {
      const rect = this.canvas.getBoundingClientRect();
      this.background.touchDetector(event.touches[0].pageX - rect.left, event.touches[0].pageY - rect.top);
      this.vor.clickDetector(event.touches[0].pageX - rect.left, event.touches[0].pageY - rect.top);
      this.smallBang.clickDetector(event.touches[0].pageX - rect.left, event.touches[0].pageY - rect.top);
      this.upgrades.clickDetector(event.touches[0].pageX - rect.left, event.touches[0].pageY - rect.top);
    });

    this.canvas.addEventListener('click', event => {
      if (!this.mobileTouch) {
        if (this.money.click(event.offsetX, event.offsetY)) this.values.moneyClick();

        this.messageBox.click(event.offsetX, event.offsetY);
        if (this.vorIcon.click(event.offsetX, event.offsetY)) this.buttons(1);
        if (this.smallBangIcon.click(event.offsetX, event.offsetY)) this.buttons(2);
        if (this.upgradeIcon.click(event.offsetX, event.offsetY)) this.buttons(3);

        if (this.vor.exitClick(event.offsetX, event.offsetY)) this.enableIconClicks();
        if (this.smallBang.exitClick(event.offsetX, event.offsetY)) this.enableIconClicks();
        if (this.upgrades.exitClick(event.offsetX, event.offsetY)) this.enableIconClicks();

        this.vor.elementClick(event.offsetX, event.offsetY);
        this.smallBang.elementClick(event.offsetX, event.offsetY);
        this.upgrades.elementClick(event.offsetX, event.offsetY);
      }
      this.mobileTouch = false;
    });
  }

  private msgDisableClicks() {
    this.background.disableClicks();
    this.money.disableClicks();
    this.vor.disableClicks();
    this.smallBang.disableClicks();
    this.upgrades.disableClicks();
  }

  private msgenableClicks() {
    this.background.enableClicks();
    this.money.enableClicks();
    this.vor.enableClicks();
    this.smallBang.enableClicks();
    this.upgrades.enableClicks();
  }

  private async buttons(set: number) {
    const a = [];
    a[0] = this.vor.closeAnimation || this.vor.openAnimation;
    a[1] = this.smallBang.closeAnimation || this.smallBang.openAnimation;
    a[2] = this.upgrades.closeAnimation || this.upgrades.openAnimation;

    if (a[0] && a[1] && a[2] && this.isLandscape) return;

    switch (set) {
      case 1:
        if (!this.values.isVorUnlocked()) {
          this.msgDisableClicks();
          const selected = await this.messageBox.show(
            "You need to buy Vor relay \nin shop 'upgrades' to get access \nto Vor Network!",
            'Missing proxy',
            'OK',
            'Upgrades',
          );
          this.msgenableClicks();
          if (selected === 1) {
            this.disableIconClicks();
            this.vorIcon.resetAnimation();
            this.smallBangIcon.resetAnimation();
            this.upgradeIcon.buttonPress();

            this.vor.close();
            this.smallBang.close();
            this.upgrades.open();
          }
          return;
        }

        this.disableIconClicks();
        this.vorIcon.buttonPress();
        this.smallBangIcon.resetAnimation();
        this.upgradeIcon.resetAnimation();

        this.vor.open();
        this.smallBang.close();
        this.upgrades.close();
        break;

      case 2:
        this.disableIconClicks();
        this.vorIcon.resetAnimation();
        this.smallBangIcon.buttonPress();
        this.upgradeIcon.resetAnimation();

        this.vor.close();
        this.smallBang.open();
        this.upgrades.close();

        break;
      case 3:
        this.disableIconClicks();
        this.vorIcon.resetAnimation();
        this.smallBangIcon.resetAnimation();
        this.upgradeIcon.buttonPress();

        this.vor.close();
        this.smallBang.close();
        this.upgrades.open();

        break;
      default:
        this.vorIcon.resetAnimation();
        this.smallBangIcon.resetAnimation();
        this.upgradeIcon.resetAnimation();

        this.vor.close();
        this.smallBang.close();
        this.upgrades.close();
        break;
    }
  }

  private disableIconClicks() {
    if (!this.background.isLandscape) {
      this.vorIcon.disableClicks();
      this.smallBangIcon.disableClicks();
      this.upgradeIcon.disableClicks();
      this.money.disableClicks();
    } else this.enableIconClicks();
  }

  destroy() {
    if (this.imageLoader) {
      this.imageLoader.destroy();
    }
    if (this.values) {
      this.values.destroy();
    }
  }

  pauseGame() {
    this.paused = true;
  }

  resumeGame() {
    this.paused = false;
  }

  private enableIconClicks() {
    this.vorIcon.enableClicks();
    this.smallBangIcon.enableClicks();
    this.upgradeIcon.enableClicks();
    this.money.enableClicks();
  }

  onResolutionChange() {
    //Do not render if the game is too squishy
    const rect = this.moneyClickerWindow.getBoundingRect();
    if (rect.width / rect.height < 2.5) {
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }
    this.canvas.width >= this.canvas.height ? (this.isLandscape = true) : (this.isLandscape = false);

    if (this.isLandscape && !this.smallBang.isOpen && !this.vor.isOpen && !this.upgrades.isOpen) {
      setTimeout(() => {
        this.smallBangIcon.buttonPress();
      }, 1);
      this.smallBang.open();
    } else if (this.vor.isOpen) this.vorIcon.buttonPress();
    else if (this.smallBang.isOpen) this.smallBangIcon.buttonPress();
    else if (this.upgrades.isOpen) this.upgradeIcon.buttonPress();
  }

  async loadGame(callback: (percentage: number) => void): Promise<void> {
    this.imageLoader = new ImageLoader([
      MoneyClickerPictureReferences.MessageBoxPic,
      MoneyClickerPictureReferences.RotatingThingPic,

      MoneyClickerPictureReferences.VorPic,
      MoneyClickerPictureReferences.SmallBangPic,
      MoneyClickerPictureReferences.UpgradePic,

      MoneyClickerPictureReferences.VorTop,
      MoneyClickerPictureReferences.VorMid,
      MoneyClickerPictureReferences.VorBotP,
      MoneyClickerPictureReferences.VorBotL,
      MoneyClickerPictureReferences.VorL,

      MoneyClickerPictureReferences.SBTop,
      MoneyClickerPictureReferences.SlBMid,
      MoneyClickerPictureReferences.SBBotP,
      MoneyClickerPictureReferences.SBBotL,
      MoneyClickerPictureReferences.SBL,

      MoneyClickerPictureReferences.UpTop,
      MoneyClickerPictureReferences.UpBMid,
      MoneyClickerPictureReferences.UpBotP,
      MoneyClickerPictureReferences.UpBotL,
      MoneyClickerPictureReferences.UpL,
      MoneyClickerPictureReferences.BlackHoleImg,

      MoneyClickerPictureReferences.Money1,
      MoneyClickerPictureReferences.Money5,
      MoneyClickerPictureReferences.Money10,
      MoneyClickerPictureReferences.Money20,
      MoneyClickerPictureReferences.Money50,
      MoneyClickerPictureReferences.Money100,
      MoneyClickerPictureReferences.Money200,
      MoneyClickerPictureReferences.Money500,
    ]);
    this.moneyPics = new MoneyImages();
    this.imageLoader.onImageLoad = (image: HTMLImageElement, src: string, status: number) => {
      switch (src) {
        case MoneyClickerPictureReferences.MessageBoxPic:
          this.messageBoxPic = image;
          break;
        case MoneyClickerPictureReferences.RotatingThingPic:
          this.rotatingThingPic = image;
          break;
        case MoneyClickerPictureReferences.VorPic:
          this.vorPic = image;
          break;
        case MoneyClickerPictureReferences.SmallBangPic:
          this.smallBangPic = image;
          break;
        case MoneyClickerPictureReferences.UpgradePic:
          this.upgradePic = image;
          break;
        case MoneyClickerPictureReferences.VorTop:
          this.vorTop = image;
          break;
        case MoneyClickerPictureReferences.VorMid:
          this.vorMid = image;
          break;
        case MoneyClickerPictureReferences.VorBotP:
          this.vorBotP = image;
          break;
        case MoneyClickerPictureReferences.VorBotL:
          this.vorBotL = image;
          break;
        case MoneyClickerPictureReferences.VorL:
          this.vorL = image;
          break;
        case MoneyClickerPictureReferences.SBTop:
          this.sBTop = image;
          break;
        case MoneyClickerPictureReferences.SlBMid:
          this.slBMid = image;
          break;
        case MoneyClickerPictureReferences.SBBotP:
          this.sBBotP = image;
          break;
        case MoneyClickerPictureReferences.SBBotL:
          this.sBBotL = image;
          break;
        case MoneyClickerPictureReferences.SBL:
          this.sBL = image;
          break;
        case MoneyClickerPictureReferences.UpTop:
          this.upTop = image;
          break;
        case MoneyClickerPictureReferences.UpBMid:
          this.upBMid = image;
          break;
        case MoneyClickerPictureReferences.UpBotP:
          this.upBotP = image;
          break;
        case MoneyClickerPictureReferences.UpBotL:
          this.upBotL = image;
          break;
        case MoneyClickerPictureReferences.UpL:
          this.upL = image;
          break;
        case MoneyClickerPictureReferences.BlackHoleImg:
          this.blackHoleImg = image;
          break;
        case MoneyClickerPictureReferences.Money1:
          this.moneyPics.money1 = image;
          break;
        case MoneyClickerPictureReferences.Money5:
          this.moneyPics.money5 = image;
          break;
        case MoneyClickerPictureReferences.Money10:
          this.moneyPics.money10 = image;
          break;
        case MoneyClickerPictureReferences.Money20:
          this.moneyPics.money20 = image;
          break;
        case MoneyClickerPictureReferences.Money50:
          this.moneyPics.money50 = image;
          break;
        case MoneyClickerPictureReferences.Money100:
          this.moneyPics.money100 = image;
          break;
        case MoneyClickerPictureReferences.Money200:
          this.moneyPics.money200 = image;
          break;
        case MoneyClickerPictureReferences.Money500:
          this.moneyPics.money500 = image;
          break;
        default:
          break;
      }
      callback(status);
    };
    return this.imageLoader.loadAll();
  }

  startGame() {
    this.addEventListeners();
    const ctx = this.canvas.getContext('2d');
    //navigation.startGame();
    //this.canvas.style.display = "";

    //let boxThing = document.querySelector('.box') as HTMLElement;
    //boxThing.style.display = "none";

    this.values = new Values(this.setData, this.getData); //__________>

    this.vorIcon = new ShopIcon(ctx, this.canvas, this.vorPic, 10, 26, 50, 25, 85, 20);
    this.smallBangIcon = new ShopIcon(ctx, this.canvas, this.smallBangPic, 10, 26, 50, 50, 85, 50);
    this.upgradeIcon = new ShopIcon(ctx, this.canvas, this.upgradePic, 10, 26, 50, 75, 85, 80);
    this.textLabel = new TextCounter(ctx, this.canvas, this.values);

    this.vor = new ShopInterface({
      shopName: 'vor',
      canvas: this.canvas,
      topImg: this.vorTop,
      middleImg: this.vorMid,
      bottomImg: this.vorBotP,
      bottomImgLandscape: this.vorBotL,
      shopListImg: this.vorL,
    });

    this.smallBang = new ShopInterface({
      shopName: 'smallBang',
      canvas: this.canvas,
      topImg: this.sBTop,
      middleImg: this.slBMid,
      bottomImg: this.sBBotP,
      bottomImgLandscape: this.sBBotL,
      shopListImg: this.sBL,
    });
    this.upgrades = new ShopInterface({
      shopName: 'upgrades',
      canvas: this.canvas,
      topImg: this.upTop,
      middleImg: this.upBMid,
      bottomImg: this.upBotP,
      bottomImgLandscape: this.upBotL,
      shopListImg: this.upL,
    });
    attachToWindowIfDev('rotatingThingPic', this.rotatingThingPic);
    this.background = new Background(ctx, this.canvas, 37, 19, 8);
    this.rotatingThing = new RotatingThing(ctx, this.canvas, this.rotatingThingPic, 95);
    this.money = new Money(ctx, this.canvas, this.moneyPics.money1, 85);

    this.blackHole = new BlackHole(ctx, this.canvas, this.blackHoleImg);

    this.blackHole.on('blackHoleFull', async () => {
      this.canvas.classList.remove('shake');

      const selected = await this.endGameMessageBox.show(
        'You have finished the game. You bought black hole and everything is gone thanks to you.... Thank you for playing',
        'Game Over',
        'Play again',
        'Do not play again',
      );

      switch (selected) {
        case 0:
          await this.endGameMessageBox.show('Are you sure you want to reset settings?', 'yes', 'no');
          break;
        case 1:
          break;

        default:
          break;
      }
    });

    this.messageBox = new MSG(this.canvas, this.messageBoxPic, 75);
    this.endGameMessageBox = new MSG(this.canvas, this.messageBoxPic, 75);

    this.vor.setButtonValues(this.values.vorlvl, this.values.vorCps, this.values.vorPrice);
    this.smallBang.setButtonValues(this.values.smallBanglvl, this.values.smallBangCps, this.values.smallBangPrice);
    this.upgrades.setButtonValues(this.values.upgradeslvl, this.values.upgradesCps, this.values.upgradesPrice);

    this.onResolutionChange();
    this.drawGame();

    this.vor.on('bought', (item: any) => {
      if (item.shopName !== 'vor') return;
      this.values.vorBought(item);
    });

    this.smallBang.on('bought', (item: any) => {
      if (item.shopName !== 'smallBang') return;
      this.values.smallBangBought(item);
    });

    this.upgrades.on('bought', (item: any) => {
      if (item.shopName !== 'upgrades') return;
      this.values.upgradesBought(item);
    });

    this.values.on('failedToBought', async (msg: string) => {
      this.msgDisableClicks();
      const result = await this.messageBox.show(
        "You don't have enough money\nto buy this item!",
        'Your wallet is empty',
        'Ok',
      );
      if (result != undefined) {
        this.msgenableClicks();
      }
    });

    this.values.on('endGame', () => {
      //msgDisableClicks();

      this.canvas.classList.add('shake');
      this.endGame = true;
    });

    this.values.on('needAction', async (msg: string) => {
      this.msgDisableClicks();
      const result = await this.messageBox.show('You need to buy other items first.', 'Hmm', 'Ok');
      if (result != undefined) {
        this.msgenableClicks();
      }
    });

    this.values.on('update', (number: number) => {
      if (number === -1) number = 0;
      if (number === 0) {
      } else {
        if (number === 1) this.money.replaceImage(this.moneyPics.money5);
        else if (number === 2) this.money.replaceImage(this.moneyPics.money10);
        else if (number === 3) this.money.replaceImage(this.moneyPics.money20);
        else if (number === 4) this.money.replaceImage(this.moneyPics.money50);
        else if (number === 5) this.money.replaceImage(this.moneyPics.money100);
        else if (number === 6) this.money.replaceImage(this.moneyPics.money200);
        else if (number === 7) this.money.replaceImage(this.moneyPics.money500);
        else throw new Error("Id of image doesn't exist. Image id: " + number);
      }
    });
  }

  private createImage(source: string) {
    if (this.images.find(i => i.src === source)) {
      throw new Error('Trying to create already existing image');
    }
    const image = new Image();
    image.addEventListener('error', ev => {
      this.imageError = ev;
    });
    image.src = source;
    this.images.push(image);
    return image;
  }

  set audio(value: boolean) {
    this.values.audio = value;
  }

  private drawGame = () => {
    this.values.update();
    //this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);

    //Draw elements
    this.background.draw();
    this.rotatingThing.setLeftLine(this.background.getLeftLineSettings());

    this.rotatingThing.draw(!this.paused);

    this.vorIcon.draw();
    this.smallBangIcon.draw();
    this.upgradeIcon.draw();

    this.money.setLeftLine(this.background.getLeftLineSettings());
    this.money.draw();

    this.textLabel.setValue(this.values.money, this.values.cps);
    this.textLabel.setLeftLine(this.background.getLeftLineSettings());
    this.textLabel.draw();

    this.vor.setValue(this.values.money);
    this.vor.setRightLine(this.background.getRightLineSettings());
    this.vor.draw();

    this.smallBang.setValue(this.values.money);
    this.smallBang.setRightLine(this.background.getRightLineSettings());
    this.smallBang.draw();

    this.upgrades.setValue(this.values.money);
    this.upgrades.setRightLine(this.background.getRightLineSettings());
    this.upgrades.draw();
    if (!this.endGame) this.messageBox.draw();

    if (this.endGame) this.blackHole.draw();
    if (this.endGame) this.endGameMessageBox.draw();

    requestAnimationFrame(this.drawGame);
  };
}
