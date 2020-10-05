import { EventEmitter } from 'events';

export enum Controls {
  Up,
  Down,
  Left,
  Right,
  Confirm,
  None,
}

interface IPoint {
  x: number;
  y: number;
}

export class SnakeInput {
  private lastTouch?: IPoint;
  private moveTouch?: IPoint;
  private eventEmitter = new EventEmitter();

  on(listener: (control: Controls) => void) {
    this.eventEmitter.on('keypress', listener);
  }

  private touchStart = (ev: TouchEvent) => {
    if (!ev.touches[0]) return;
    const x = ev.touches[0].clientX;
    const y = ev.touches[0].clientY;
    this.lastTouch = { x, y };
  };
  private touchMove = (ev: TouchEvent) => {
    if (!ev.touches[0]) return;
    const x = ev.touches[0].clientX;
    const y = ev.touches[0].clientY;
    this.moveTouch = { x, y };
  };

  private touchEnd = () => {
    if (this.lastTouch && this.moveTouch) {
      const horizontal = Math.abs(this.lastTouch.x - this.moveTouch.x) > Math.abs(this.lastTouch.y - this.moveTouch.y);

      if (horizontal && this.lastTouch.x > this.moveTouch.x) {
        this.eventEmitter.emit('keypress', Controls.Left);
      } else if (horizontal && this.lastTouch.x < this.moveTouch.x) {
        this.eventEmitter.emit('keypress', Controls.Right);
      } else if (this.lastTouch.y < this.moveTouch.y) {
        this.eventEmitter.emit('keypress', Controls.Down);
      } else if (this.lastTouch.y > this.moveTouch.y) {
        this.eventEmitter.emit('keypress', Controls.Up);
      }
    } else {
      this.eventEmitter.emit('keypress', Controls.Confirm);
    }
    this.lastTouch = undefined;
    this.moveTouch = undefined;
  };
  onKeypress = (ev: KeyboardEvent) => {
    switch (ev.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.eventEmitter.emit('keypress', Controls.Up);
        break;
      case 's':
      case 'arrowdown':
        this.eventEmitter.emit('keypress', Controls.Down);
        break;
      case 'a':
      case 'arrowleft':
        this.eventEmitter.emit('keypress', Controls.Left);
        break;
      case 'd':
      case 'arrowright':
        this.eventEmitter.emit('keypress', Controls.Right);
        break;
      case ' ':
        this.eventEmitter.emit('keypress', Controls.Confirm);
        break;
    }
  };

  destroy() {
    this.eventEmitter.removeAllListeners();
  }
}
