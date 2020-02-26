import { EventEmitter } from 'events';

import * as Axios from 'axios';

console.log('sending')
Axios.default.post('/api/v1/users', {
  firstName: 'Finn',
  lastName: 'Williams'
})

export enum Keypress {
  Q = 81,
  W = 87,
  E = 69,
  R = 82,
  T = 84,
  Y = 89,
  U = 85,
  I = 73,
  O = 79,
  P = 80,

  A = 65,
  S = 83,
  D = 68,
  F = 70,
  G = 71,
  H = 72,
  J = 74,
  K = 75,
  L = 76,

  Z = 90,
  X = 88,
  C = 67,
  V = 86,
  B = 66,
  N = 78,
  M = 77,

  One = 49,
  Two = 50,
  Tree = 51,
  Four = 52,
  Five = 53,
  Six = 54,
  Seven = 55,
  Eight = 56,
  Nine = 57,
  Zero = 48,

  NumpadOne = 97,
  NumpadTwo = 98,
  NumpadTree = 99,
  NumpadFour = 100,
  NumpadFive = 101,
  NumpadSix = 102,
  NumpadSeven = 203,
  NumpadEight = 204,
  NumpadNine = 205,
  NumpadZero = 96,

  NumpadDevice = 111,
  NumpadMultiply = 106,
  NumpadSubtract = 109,
  NumpadAdd = 107,
  NumpadEnter = 13,
  NumpadDecimal = 110,
  NumLock = 144,

  NumpadEnd = 35,

  Clear = 12,
  F1 = 112,
  F2 = 113,
  F3 = 114,
  F4 = 115,
  F5 = 116,
  F6 = 117,
  F7 = 118,
  F8 = 119,
  F9 = 120,
  F10 = 121,
  F11 = 122,
  F12 = 123,

  ScrollLock = 145,
  Pause = 19,
  Inters = 45,
  Home = 36,
  PageUp = 33,
  PageDown = 34,
  PageEnd = 35,
  Delete = 46,

  Backquote = 192,

  Tab = 9,
  CapsLock = 20,
  Shift = 16,
  Control = 17,
  AltLeft = 18,
  MetaLeft = 91,
  Space = 32,
  Alt = 18,
  ContextMenu = 93,

  Backspace = 8,
  Backslash = 220,
  Enter = 13,
  Minus = 189,
  Equal = 187,

  BracketLeft = 219,
  BracketRight = 221,
  Semicolon = 186,
  Quote = 222,
  Comma = 188,
  Period = 190,
  Slash = 191,

  ArrowUp = 38,
  ArrowLeft = 37,
  ArrowDown = 40,
  ArrowRight = 39,
}

declare type KeyCombination = Keypress | Keypress[];
// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface HotKeyHandler {
  on(event: 'combination', listener: () => void): this;
}
export class HotKeyHandler extends EventEmitter {
  private keySequence: KeyCombination[];
  private index = 0;
  private lastKey: Keypress;
  private resetOnKeyUp: boolean;
  private enabled = true;

  constructor(keySequence: KeyCombination[], resetOnKeyUp = false) {
    super();
    this.resetOnKeyUp = resetOnKeyUp;
    this.keySequence = keySequence;

    document.addEventListener('keydown', this.onKeyDown, false);
    if (resetOnKeyUp) document.addEventListener('keyup', this.onKeyUp, false);
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
        this.emit('combination');
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
    this.removeAllListeners();
    document.removeEventListener('keydown', this.onKeyDown, false);
    if (this.resetOnKeyUp) document.removeEventListener('keyup', this.onKeyUp, false);
  }
}
