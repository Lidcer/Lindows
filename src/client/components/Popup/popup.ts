import { EventEmitter } from 'events';

export declare interface IPopup {
  on(event: 'update', listener: (elements: PopupElement[]) => void): this;
}
export type PopupElement = { jsx: JSX.Element; darken: boolean; blockEvents: boolean; forceExit: () => void };

export class IPopup extends EventEmitter {
  private _elements: PopupElement[] = [];

  add(jsx: JSX.Element, darken = true, blockEvents = true, forceExit?: () => void) {
    if (!forceExit) {
      forceExit = () => {
        this.remove(jsx);
      };
    }
    this._elements.push({ jsx, darken, blockEvents, forceExit });
    this.emit('update', this._elements);
  }

  remove(jsx: JSX.Element) {
    const element = this._elements.find(e => e.jsx === jsx);

    const index = this._elements.indexOf(element);
    if (index !== -1) {
      this._elements.splice(index, 1);
      this.emit('update', this._elements);
    } else {
      this._elements = [];
      this.emit('update', this._elements);
      console.error(new Error('Popup element cannot be removed'));
    }
  }

  get elements() {
    return this._elements;
  }
}
