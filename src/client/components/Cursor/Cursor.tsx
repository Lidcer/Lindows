import React from 'react';
import './Cursor.scss';
import { EventEmitter } from 'events';
interface IState {
  cursorType: CursorType;
  cursor: {
    x: number;
    y: number;
    rotate: number;
  };
}

interface IMouseHistory {
  x: number;
  y: number;
}
export declare type CursorType =
  | 'normal'
  | 'verticalResize'
  | 'horizontalResize'
  | 'diagonalResize1'
  | 'diagonalResize2';

const dynamicMouse = true;

declare interface IMousePointer {
  on(event: 'change', listener: (type: CursorType) => void): this;
}

class IMousePointer extends EventEmitter {
  changeMouse(type: CursorType) {
    this.emit('change', type);
  }
}
export const mousePointer = new IMousePointer();

export class Cursor extends React.Component<{}, IState> {
  private readonly MAX_MOUSE_HISTORY = 20;
  private monitorInterval: number;

  anchorPointX = 0;
  anchorPointY = 0;
  private mouseHistory: IMouseHistory[] = [];

  constructor(props) {
    super(props);

    this.state = {
      cursorType: 'normal',
      cursor: {
        rotate: 5,
        x: -50,
        y: -50,
      },
    };
  }

  componentDidMount() {
    window.addEventListener('mousemove', this.mouseMove, false);
    mousePointer.on('change', this.onMouseChangeFixPos);
  }

  componentWillUnmount() {
    window.removeEventListener('mousemove', this.mouseMove, false);
    mousePointer.removeListener('change', this.onMouseChangeFixPos);
  }

  onMouseChangeFixPos = (cursorType: CursorType) => {
    switch (cursorType) {
      case 'diagonalResize1':
      case 'diagonalResize2':
      case 'verticalResize':
      case 'horizontalResize':
        this.anchorPointX = 0;
        this.anchorPointY = 0;

        break;
      default:
        this.anchorPointX = 0;
        this.anchorPointY = 0;
        break;
    }
    this.setState({ cursorType });
  };

  mouseMove = (event: MouseEvent) => {
    if (this.state.cursorType !== 'normal' || !dynamicMouse) {
      this.setState({
        //        cursorType,
        cursor: {
          rotate: this.updateMouseAngle(),
          x: event.clientX,
          y: event.clientY,
        },
      });
      return;
    }

    if (this.mouseHistory.length >= this.MAX_MOUSE_HISTORY) this.mouseHistory.shift();

    const x = event.clientX;
    const y = event.clientY;
    this.mouseHistory.push({ x, y });
    let deg = this.state.cursor.rotate;

    let avgX = 0;
    let avgY = 0;

    this.mouseHistory.forEach(e => {
      avgX += e.x;
      avgY += e.y;
    });

    avgX = avgX / this.MAX_MOUSE_HISTORY;
    avgY = avgY / this.MAX_MOUSE_HISTORY;

    if (avgY > y && avgX < x) {
      const sumY = avgY - y;
      const sumX = x - avgX;
      deg = this.radiansToDegrees(Math.atan(sumX / sumY));
    }
    if (avgY > y && avgX > x) {
      const sumY = avgY - y;
      const sumX = avgX - x;
      deg = this.radiansToDegrees(Math.atan(sumY / sumX)) + 270;
    }
    if (avgY < y && avgX > x) {
      const sumY = y - avgY;
      const sumX = avgX - x;
      deg = this.radiansToDegrees(Math.atan(sumX / sumY)) + 180;
    }
    if (avgY < y && avgX < x) {
      const sumY = y - avgY;
      const sumX = x - avgX;
      deg = this.radiansToDegrees(Math.atan(sumY / sumX)) + 90;
    }

    deg = this.correctAngle(deg);

    this.setState({
      cursor: {
        x,
        y,
        rotate: deg,
      },
    });
  };

  radiansToDegrees(radians: number) {
    return radians * (180 / Math.PI);
  }

  updateMouseAngle = () => {
    switch (this.state.cursorType) {
      case 'verticalResize':
        return 0;
      case 'horizontalResize':
        return 90;
      case 'diagonalResize1':
        return 45;
      case 'diagonalResize2':
        return 135;
      default:
        return 336;
    }
  };

  correctAngle(angle: number) {
    const FULL_ANGLE = 360;
    const negative = angle < 0;
    if (negative) angle *= -1;
    angle = this.getOneSegment(angle, FULL_ANGLE);
    if (negative) angle = FULL_ANGLE - angle;

    return angle;
  }

  getOneSegment(value: number, maxNumber: number) {
    const result = Math.floor(value / maxNumber) * maxNumber + maxNumber;
    return maxNumber - (result - value);
  }

  render() {
    return <img className='cursor' style={this.mousePos} src={this.mouseSrc}></img>;
  }

  get mouseSrc() {
    const cursorType: CursorType = this.state.cursorType;
    switch (cursorType) {
      case 'verticalResize':
      case 'horizontalResize':
      case 'diagonalResize1':
      case 'diagonalResize2':
        return './assets/images/cursors/resize.svg';
      default:
        return './assets/images/cursors/normal.svg';
    }
  }

  get mousePos() {
    return {
      left: `${this.state.cursor.x + this.anchorPointX}px`,
      top: `${this.state.cursor.y + this.anchorPointY}px`,
      transform: `translateX(-30px) translateY(-30px) rotate(${this.state.cursor.rotate}deg)`,
    };
  }
}
