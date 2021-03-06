import { Keypress } from "./constants/Keypress";

declare type KeyCombination = Keypress | Keypress[];
export interface HotKeyHandler {
  onCombination();
}
export class HotKeyHandler {
  private keySequence: KeyCombination[];
  private index = 0;
  private lastKey: Keypress;
  private resetOnKeyUp: boolean;
  private enabled = true;

  constructor(keySequence: KeyCombination[], resetOnKeyUp = false) {
    this.resetOnKeyUp = resetOnKeyUp;
    this.keySequence = keySequence;

    document.addEventListener("keydown", this.onKeyDown, false);
    if (resetOnKeyUp) document.addEventListener("keyup", this.onKeyUp, false);
  }
  onKeyUp = (event: KeyboardEvent) => {
    if (!this.enable) return;
    const key = this.arrayOfCurrentCombinations;

    if (this.index > 0) this.index--;
    if (key.includes(event.keyCode)) {
      if (this.keySequence.length - 1 === this.index) {
      }
    }
    //if (this.resetOnKeyUp) this.index = 0;
  };

  onKeyDown = (event: KeyboardEvent) => {
    if (!this.enabled) return;

    // console.log(`${event.key} = ${event.keyCode},`);
    const key = this.arrayOfCurrentCombinations;
    if (this.lastKey === event.keyCode && !key.includes(event.keyCode)) return;
    this.lastKey = event.keyCode;

    if (key.includes(event.keyCode)) {
      if (this.keySequence.length - 1 === this.index) {
        this.lastKey = null;
        if (!this.resetOnKeyUp) this.index = 0;
        if (this.onCombination) this.onCombination();
      }

      this.index++;
    } else if (!this.resetOnKeyUp) this.index = 0;
  };

  private get arrayOfCurrentCombinations() {
    let key: Keypress[];
    const currentKey = this.keySequence[this.index];
    if (Array.isArray(currentKey)) key = currentKey;
    else key = [currentKey];
    return key;
  }

  reset() {
    this.index = 0;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    this.index = 0;
  }

  destroy() {
    document.removeEventListener("keydown", this.onKeyDown, false);
    if (this.resetOnKeyUp) document.removeEventListener("keyup", this.onKeyUp, false);
  }
}
