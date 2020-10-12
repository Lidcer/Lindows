import { EventEmitter } from 'events';

interface valuesShop {
  shopName: string;
  lvl: number[];
  cps: number[];
  price: number[];
  boughtElementIndex: number;
}

const templateGame = {
  tier: 0,
  actualMoney: 0,
  counter: 0,
  moneyCounter: 1,

  vorlvl: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  vorCps: [1, 4, 8, 3.1, 50, 100, 250, 500, 1000, 999999, 0.1],
  vorPrice: [
    1000,
    15000,
    20000,
    30000,
    35000000,
    50000000,
    1000000000,
    8000000000,
    10000000000,
    100000000000,
    800000000000,
  ],

  smallBanglvl: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  smallBangCps: [
    1,
    10,
    50,
    100,
    500,
    1000,
    5000,
    10000,
    50000,
    100000,
    500000,
    1000000,
    5000000,
    10000000,
    100000000,
    500000000,
    1000000000,
    30000000000,
    50000000000,
    99999999999,
  ],
  smallBangPrice: [
    1000,
    5609,
    65468,
    165465,
    1654654,
    8647911,
    536870911,
    17179869183,
    274877906943,
    4398046511103,
    8796093022207,
    17592186044415,
    35184372088831,
    70368744177663,
    140737488355327,
    281474976710655,
    562949953421311,
    1125899906842623,
    2251799813685247,
    9007199254740991,
  ],

  upgradeslvl: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  upgradesCps: [-1, -1, -1, -1, -1, -1, -1, -1],
  upgradesPrice: [10000, 100000, 500000, 1000000, 350000000, 8500000000, 45000000000, 650000000000],
};

export class Values extends EventEmitter {
  public money = 0;
  private actualMoney = 0;
  private counter = 0;
  public cps = 0;
  private moneyCounter = 1;

  private lastCPS = 0;
  public vorlvl: number[] = [];
  public vorCps: number[] = [];
  public vorPrice: number[] = [];

  public smallBanglvl: number[] = [];
  public smallBangCps: number[] = [];
  public smallBangPrice: number[] = [];

  public upgradeslvl: number[] = [];
  public upgradesCps: number[] = [];
  public upgradesPrice: number[] = [];

  constructor(private setItem: (text: string) => void, private getItem: () => string) {
    super();
    this.restoreFromBrowser();

    this.update();
    this.cpsCalculator();
    this.updateTimer();
  }

  public updateTimer(): any {
    this.storageDataToBrowser();
    setTimeout(() => {
      this.actualMoney += this.counter * this.moneyCounter * 0.1;
      this.updateTimer();
    }, 100);
  }

  //100

  public isVorUnlocked() {
    if (this.upgradeslvl[0]) return true;
    else return false;
  }

  public cpsCalculator() {
    const moneyNow = this.money;
    setTimeout(() => {
      let cps = this.money - moneyNow;
      if (cps < 0) cps = 0 + Math.floor(this.counter);

      this.cps = this.counter + (cps - this.counter);
      this.cpsCalculator();
    }, 1000);
  }

  public update() {
    this.money = Math.floor(this.actualMoney);
  }

  public addMoney(money: number): void {
    this.actualMoney += money;
  }

  public getMoney(): number {
    return this.money;
  }

  public getCPS(): number {
    return this.cps;
  }

  public setCPS(cps: number): void {
    this.cps = cps;
  }

  public setCounter(value: number): void {
    this.counter = value;
  }
  public getCounter(): number {
    return this.counter;
  }

  public moneyClick() {
    this.actualMoney += this.moneyCounter;
  }

  public smallBangBought(obj: valuesShop) {
    if (obj.shopName !== 'smallBang') return;

    if (this.smallBangPrice[obj.boughtElementIndex] <= this.actualMoney) {
      const purchaseAudio = new Audio('sounds/ill With Bell.wav');
      purchaseAudio.play();

      this.actualMoney -= this.smallBangPrice[obj.boughtElementIndex];
      this.smallBanglvl[obj.boughtElementIndex]++;

      if (obj.boughtElementIndex === this.smallBangPrice.length - 1) {
        this.emit('endGame');
        return;
      }

      this.smallBangPrice[obj.boughtElementIndex] = Math.floor(this.smallBangPrice[obj.boughtElementIndex] * 1.01);
      this.counter += this.smallBangCps[obj.boughtElementIndex];
    } else if (this.smallBangPrice[obj.boughtElementIndex] > this.actualMoney) {
      this.emit('failedToBought', 'Not Eught money');
    }
  }

  public vorBought(obj: valuesShop) {
    if (obj.shopName !== 'vor') return;

    if (this.vorPrice[obj.boughtElementIndex] <= this.actualMoney) {
      this.actualMoney -= this.vorPrice[obj.boughtElementIndex];
      this.vorlvl[obj.boughtElementIndex]++;
      this.vorPrice[obj.boughtElementIndex] = Math.floor(this.vorPrice[obj.boughtElementIndex] * 1.01);

      const purchaseAudio = new Audio('sounds/ill With Bell.wav');
      purchaseAudio.play();
    } else if (this.vorPrice[obj.boughtElementIndex] > this.actualMoney) {
      this.emit('failedToBought');
    }
  }
  public upgradesBought(obj: valuesShop) {
    if (obj.shopName !== 'upgrades') return;

    for (let i = 0; i < obj.boughtElementIndex; i++) {
      if (this.upgradeslvl[i] == 0) {
        this.emit('needAction');
        return;
      }
    }

    if (
      this.upgradesPrice[obj.boughtElementIndex] <= this.actualMoney &&
      this.upgradeslvl[obj.boughtElementIndex] == 0
    ) {
      this.actualMoney -= this.upgradesPrice[obj.boughtElementIndex];
      this.upgradeslvl[obj.boughtElementIndex]++;
      this.upgradesPrice[obj.boughtElementIndex] = -1;

      if (obj.boughtElementIndex === 1) this.moneyCounter = 5;
      else if (obj.boughtElementIndex === 2) this.moneyCounter = 10;
      else if (obj.boughtElementIndex === 3) this.moneyCounter = 20;
      else if (obj.boughtElementIndex === 4) this.moneyCounter = 50;
      else if (obj.boughtElementIndex === 5) this.moneyCounter = 100;
      else if (obj.boughtElementIndex === 6) this.moneyCounter = 200;
      else if (obj.boughtElementIndex === 7) this.moneyCounter = 500;
      else if (obj.boughtElementIndex !== 0) throw new Error('This value is not programed!!!');

      this.emit('update', obj.boughtElementIndex);
    }
    const purchaseAudio = new Audio('sounds/ill With Bell.wav');
    purchaseAudio.play();
  }

  private storageDataToBrowser() {
    const dataToStore = {
      actualMoney: this.actualMoney,
      counter: this.counter,
      moneyCounter: this.moneyCounter,

      vorlvl: this.vorlvl,
      vorCps: this.vorCps,
      vorPrice: this.vorPrice,

      smallBanglvl: this.smallBanglvl,
      smallBangCps: this.smallBangCps,
      smallBangPrice: this.smallBangPrice,

      upgradeslvl: this.upgradeslvl,
      upgradesCps: this.upgradesCps,
      upgradesPrice: this.upgradesPrice,
    };
    const dataToStoreString = JSON.stringify(dataToStore);

    //console.log(dataToStoreString);
    this.setItem(dataToStoreString);
  }

  private restoreFromBrowser() {
    const moneyClickerDataGame = this.getItem();

    const userData = null;

    if (userData) {
      const clickerData = JSON.parse(userData).gameJson;

      this.actualMoney = clickerData.actualMoney;
      this.counter = clickerData.counter;
      this.moneyCounter = clickerData.moneyCounter;

      this.vorlvl = clickerData.vorlvl;
      this.vorCps = clickerData.vorCps;
      this.vorPrice = clickerData.vorPrice;

      this.smallBanglvl = clickerData.smallBanglvl;
      this.smallBangCps = clickerData.smallBangCps;
      this.smallBangPrice = clickerData.smallBangPrice;

      this.upgradeslvl = clickerData.upgradeslvl;
      this.upgradesCps = clickerData.upgradesCps;
      this.upgradesPrice = clickerData.upgradesPrice;
    }
    if (moneyClickerDataGame) {
      const clickerData = JSON.parse(moneyClickerDataGame);

      this.actualMoney = clickerData.actualMoney;
      this.counter = clickerData.counter;
      this.moneyCounter = clickerData.moneyCounter;

      this.vorlvl = clickerData.vorlvl;
      this.vorCps = clickerData.vorCps;
      this.vorPrice = clickerData.vorPrice;

      this.smallBanglvl = clickerData.smallBanglvl;
      this.smallBangCps = clickerData.smallBangCps;
      this.smallBangPrice = clickerData.smallBangPrice;

      this.upgradeslvl = clickerData.upgradeslvl;
      this.upgradesCps = clickerData.upgradesCps;
      this.upgradesPrice = clickerData.upgradesPrice;
    } else {
      this.actualMoney = templateGame.actualMoney;
      this.counter = templateGame.counter;
      this.moneyCounter = templateGame.moneyCounter;

      this.vorlvl = templateGame.vorlvl;
      this.vorCps = templateGame.vorCps;
      this.vorPrice = templateGame.vorPrice;

      this.smallBanglvl = templateGame.smallBanglvl;
      this.smallBangCps = templateGame.smallBangCps;
      this.smallBangPrice = templateGame.smallBangPrice;

      this.upgradeslvl = templateGame.upgradeslvl;
      this.upgradesCps = templateGame.upgradesCps;
      this.upgradesPrice = templateGame.upgradesPrice;
    }

    const lvl = this.upgradeslvl.filter(a => a);
    setTimeout(() => {
      this.emit('update', lvl.length - 1);
    }, 1);
    this.actualMoney = 99999;
  }

  static templateGameJsonObject() {
    return templateGame;
  }
}
