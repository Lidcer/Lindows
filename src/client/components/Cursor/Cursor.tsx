import React from "react";
import { EventEmitter } from "events";
import { internal } from "../../services/internals/Internal";
import { CursorStyle } from "./CursorStyled";
interface IState {
  cursorType: CursorType;
  enabled: boolean;
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
  | "normal"
  | "verticalResize"
  | "horizontalResize"
  | "diagonalResize1"
  | "diagonalResize2";

const dynamicMouse = true;

const storageProperties = {
  enabled: "lindow-mouse-enabled",
};

declare interface IMousePointer {
  on(event: "change", listener: (type: CursorType) => void): this;
  on(event: "enableDisable", listener: (bool: boolean, callback: (result: boolean) => void) => void): this;
}

class IMousePointer extends EventEmitter {
  changeMouse(type: CursorType) {
    this.emit("change", type);
  }

  async enableDisableMouse(bool: boolean) {
    return new Promise<boolean>(resolve => {
      this.emit("enableDisable", bool, (result: boolean) => {
        resolve(result);
      });
    });
  }

  get enabled() {
    return internal.system.registry.getUserItemValue(storageProperties.enabled);
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
      cursorType: "normal",
      enabled: false,
      cursor: {
        rotate: 5,
        x: -50,
        y: -50,
      },
    };
  }

  componentDidMount() {
    window.addEventListener("mousemove", this.mouseMove, false);
    mousePointer.on("change", this.onMouseChangeFixPos);
    mousePointer.on("enableDisable", this.enableDisable);
    const enabled = !!internal.system.registry.getUserItemValue(storageProperties.enabled) as boolean;
    this.setState({ enabled });
    if (enabled) {
      document.body.style.cursor = "none";
    }
  }

  componentWillUnmount() {
    window.removeEventListener("mousemove", this.mouseMove, false);
    mousePointer.removeListener("change", this.onMouseChangeFixPos);
    mousePointer.removeListener("enableDisable", this.enableDisable);
    document.body.style.cursor = "";
  }

  enableDisable = async (bool: boolean, callback: (result: boolean) => void) => {
    await internal.system.registry.setUserItem(storageProperties.enabled, !!bool);
    this.setState({ enabled: !!bool });
    if (bool) {
      document.body.style.cursor = "none";
    } else {
      document.body.style.cursor = "";
    }
    callback(!!bool);
  };

  remoteMouseMove = (mouse: any) => {
    this.setState(mouse);
  };

  onMouseChangeFixPos = (cursorType: CursorType) => {
    if (!this.state.enabled) return;

    switch (cursorType) {
      case "diagonalResize1":
      case "diagonalResize2":
      case "verticalResize":
      case "horizontalResize":
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
    if (!this.state.enabled) return;
    if (this.state.cursorType !== "normal" || !dynamicMouse) {
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
      case "verticalResize":
        return 0;
      case "horizontalResize":
        return 90;
      case "diagonalResize1":
        return 45;
      case "diagonalResize2":
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
    if (this.state.enabled) {
      return <CursorStyle style={this.mousePos} src={this.mouseSrc}></CursorStyle>;
    }
    return null;
  }

  get mouseSrc() {
    const cursorType: CursorType = this.state.cursorType;
    switch (cursorType) {
      case "verticalResize":
      case "horizontalResize":
      case "diagonalResize1":
      case "diagonalResize2":
        return "./assets/images/cursors/resize.svg";
      default:
        return "./assets/images/cursors/normal.svg";
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
