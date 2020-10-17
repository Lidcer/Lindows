import { IManifest, BaseWindow } from '../BaseWindow/BaseWindow';
import React from 'react';
import { SnakeGameWarper } from './SnakeGameStyle';
import { SnakeGameLogic } from './SnakeGameLogic';
import { SnakeInput } from './SnakeInput';

export class SnakeGame extends BaseWindow {
  public static readonly onlyOne = true;

  public static manifest: IManifest = {
    fullAppName: 'Snake game',
    launchName: 'webGlSnake',
    icon: '/assets/images/appsIcons/SnakeGameIcon.svg',
  };

  private ref = React.createRef<HTMLCanvasElement>();
  snakeGame: SnakeGameLogic;
  snakeGameInput: SnakeInput;

  constructor(props) {
    super(
      props,
      {
        minHeight: 500,
        minWidth: 500,
        resizable: false,
        startPos: 'center',
        showIcon: false,
        maximizeRestoreDownButton: 'disabled',
      },
      {
        message: '',
      },
    );
  }
  shown() {
    this.snakeGameInput = new SnakeInput();
    this.snakeGame = new SnakeGameLogic(
      this.snakeGameInput,
      this,
      this.ref.current,
      (x: number) => this.setX(x),
      (y: number) => this.setY(y),
    );
    requestAnimationFrame(this.snakeGame.draw);
  }
  closing() {
    this.snakeGameInput.destroy();
    this.snakeGame.destroy();
  }
  onKeyDown(event) {
    if (this.snakeGameInput) {
      this.snakeGameInput.onKeypress(event);
    }
  }

  renderInside() {
    return (
      <SnakeGameWarper>
        <canvas ref={this.ref} style={{ height: `100%`, width: `100%` }}></canvas>
      </SnakeGameWarper>
    );
  }
}
