import { clamp, random } from "lodash";
import { Food } from "./Food";
import { CordsData, Snake } from "./Snake";
import { Controls, SnakeInput } from "./SnakeInput";
import { Renderer } from "./SnakeRender";
import { fragmentShader, vertexShader, vertexShaderTest } from "./SnakeShader";
import { SnakeGame } from "./SnakeGame";
import { AppClient } from "../BaseWindow/NetworkBaseWindow";
import { RGB } from "../../../shared/interfaces";
import { removeFromArray } from "../../../shared/utils";

enum GameControls {
  Up,
  Down,
  Left,
  Right,
  None,
}

export interface IPoint {
  x: number;
  y: number;
}

export interface IWindowInfo {
  height: number;
  width: number;
  pixelHeight: number;
  pixelWidth: number;
}

type SnakeArray = Snake[];
interface Multiplayer {
  player?: AppClient;
  playerId: string;
  snake: SnakeArray;
  color: RGB;
  direction: GameControls;
  dead: boolean;
}

interface BroadcastObject {
  playerID: string;
  cords: CordsData[];
  color: RGB;
  direction: GameControls;
  dead: boolean;
}

interface SnakeWindowInfo {
  height: number;
  width: number;
  pixelWidth: number;
  pixelHeight: number;
}

export class SnakeGameLogic {
  static readonly DEFAULT_SPEED = 300;
  private height = 500;
  private width = 500;
  private pixelWidth = 12;
  private pixelHeight = 12;
  public static readonly predefinedColours: RGB[] = [
    { r: 90, g: 156, b: 255 },
    { r: 255, g: 90, b: 90 },
    { r: 255, g: 255, b: 255 },
  ];
  private speed = SnakeGameLogic.DEFAULT_SPEED;
  private time = 0;
  private now = performance.now();
  private border = false;
  private renderer: Renderer;
  private food: Food;
  private destroyed = false;

  private direction = GameControls.None;

  private snake: SnakeArray = [];
  private players: Multiplayer[] = [];
  private multiPlayerMode = false;

  private paused = false;
  private showFps = true;
  private dead = false;
  //Game options
  private snakeAnimation = true;
  private amIClient = false;

  constructor(
    private input: SnakeInput,
    private gameWindow: SnakeGame,
    canvas: HTMLCanvasElement,
    private setX: (x: number) => void,
    private setY: (x: number) => void,
    private clientEmit: (...args: any[]) => void,
    private showDead: () => void,
  ) {
    this.renderer = new Renderer(canvas, this.height, this.width);
    //this.renderer.loadShader('vertex', vertexShader, this.gl.VERTEX_SHADER, false);
    this.renderer.loadShader("vertex", vertexShaderTest, this.gl.VERTEX_SHADER, false);

    this.renderer.loadShader("fragment", fragmentShader, this.gl.FRAGMENT_SHADER);
    if (this.speed !== SnakeGameLogic.DEFAULT_SPEED) {
      //this.speed = this.speed;
    }

    this.restartGame();

    this.input.on(this.control);

    const triangleVertexBufferObject = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, triangleVertexBufferObject);

    const positionAttributeLocation = this.gl.getAttribLocation(this.renderer.program, "vertPosition");
    const colorAttributeLocation = this.gl.getAttribLocation(this.renderer.program, "vertColor");
    this.gl.vertexAttribPointer(
      positionAttributeLocation,
      2,
      this.gl.FLOAT,
      false,
      5 * Float32Array.BYTES_PER_ELEMENT,
      0,
    );

    this.gl.vertexAttribPointer(
      colorAttributeLocation,
      3,
      this.gl.FLOAT,
      false,
      5 * Float32Array.BYTES_PER_ELEMENT,
      2 * Float32Array.BYTES_PER_ELEMENT,
    );

    this.gl.enableVertexAttribArray(positionAttributeLocation);
    this.gl.enableVertexAttribArray(colorAttributeLocation);

    this.gl.useProgram(this.program);
  }

  restartGame(y?: number, x?: number) {
    this.snake = [];
    if (y === undefined) {
      y = random(1, this.pixelHeight - 2);
    }
    if (x === undefined) {
      x = random(1, this.pixelWidth - 2);
    }
    this.addSnake(y, x, this.snake, Snake.snakeColour);
    //this.addSnake(this.pixelHeight - 5, this.pixelWidth - 1);
    this.spawnRandomFood();
    this.paused = false;
  }

  addSnake(y: number, x: number, snakeArray: Snake[], colour = Snake.snakeColour) {
    this.food = undefined;
    const snake = new Snake(this.renderer, this.windowInfo, { gameSpeed: this.speed, x, y, colour });
    snakeArray.push(snake);
    if (this.snake === snakeArray) {
      this.gameWindow.changeOptions({ title: `Snake game: ${this.snake.length}` });
    }
  }

  private control = (control: Controls, snake?: Snake[], direction?: GameControls) => {
    const foreign = snake || direction;
    snake = snake || this.snake;
    direction = direction || this.direction;

    if (!this.multiPlayerMode && !foreign && control === Controls.Confirm && this.paused) {
      return this.restartGame();
    }
    if (this.paused && !foreign) return;
    const behind = (yOffset = 0, xOffset = 0): boolean => {
      const head = snake[0];
      const neck = snake[1];
      if (!head || !neck) return true;
      const hX = clamp(head.onGridX, 0, this.pixelHeight) + xOffset;
      const hY = clamp(head.onGridY, 0, this.pixelHeight) + yOffset;
      const nX = clamp(neck.onGridX, 0, this.pixelHeight);
      const nY = clamp(neck.onGridY, 0, this.pixelHeight);
      let horizontalColliding = false;
      if (
        (hX === 0 && nX === this.pixelWidth) ||
        (hX === this.pixelWidth && nX === 0) ||
        (hX === 1 && nX === 0) ||
        Math.abs(hX - nX) > 2 ||
        hX === nX
      ) {
        horizontalColliding = true;
      }
      let verticalColliding = false;
      if (
        (hY === 0 && nY === this.pixelHeight) ||
        (hY === this.pixelHeight && nY === 0) ||
        (hY === 1 && nY === 0) ||
        Math.abs(hY - nY) > 2 ||
        hY === nY
      ) {
        verticalColliding = true;
      }
      return !(horizontalColliding && verticalColliding);
    };

    if (control === Controls.Up && direction !== GameControls.Up && behind(-1, 0)) {
      direction = GameControls.Up;
      if (!foreign) this.bounce("top", true);
    } else if (control === Controls.Down && direction !== GameControls.Down && behind(1, 0)) {
      direction = GameControls.Down;
      if (!foreign) this.bounce("top", false);
    } else if (control === Controls.Left && direction !== GameControls.Left && behind(0, -1)) {
      direction = GameControls.Left;
      if (!foreign) this.bounce("left", true);
    } else if (control === Controls.Right && direction !== GameControls.Right && behind(0, 1)) {
      direction = GameControls.Right;
      if (!foreign) this.bounce("left", false);
    }

    if (foreign) {
      return direction;
    } else {
      this.direction = direction;
    }
    if (this.multiPlayerMode && this.amIClient) {
      this.clientEmit("direction", control);
    }
  };
  bounce(direction: "top" | "left", minus = false) {
    const boundingClientRect = this.gameWindow.getBoundingRect();
    const distance = 5;
    const time = 50;
    const m = minus ? -1 : 1;
    //this.div.style[direction] = `${boundingClientRect[xy] + (distance  * m)}px`;
    if (direction === "top") {
      this.setY(boundingClientRect.y + distance * m);
      //this.gameWindow.changeOptions({x}) //{boundingClientRect[xy] + (distance  * m)
      //this.div.style.top = `${boundingClientRect[xy] + (distance  * m)}px`;
      //this.renderer.canvas.style.marginTop = `${distance * 2 * -m}px`;
    } else {
      this.setX(boundingClientRect.x + distance * m);
      //this.div.style.left = `${boundingClientRect[xy] + (distance  * m)}px`;
      //this.renderer.canvas.style.marginLeft = `${distance * 2 * -m}px`;
    }
    setTimeout(() => {
      if (direction === "top") {
        this.setY(boundingClientRect.y);
      } else {
        this.setX(boundingClientRect.x);
      }

      // if (direction === 'top') {
      //     this.renderer.canvas.style.marginTop = '';
      // } else {
      //     this.renderer.canvas.style.marginLeft = '';
      // }
    }, time);
  }

  updateSnakePos(snake: Snake[], direction: GameControls, color?: RGB): boolean {
    let updateScore = false;
    const head = snake[0];
    if (!head) return false;
    let onGridX = head.onGridX;
    let onGridY = head.onGridY;

    if (!this.food) return;
    if (!this.amIClient && head.onGridX === this.food.onGridX && head.onGridY === this.food.onGridY) {
      const tail = snake[snake.length - 1];
      this.addSnake(tail.pos.y, tail.pos.x, snake, color);
      this.food = undefined;
      this.spawnRandomFood();
      updateScore = true;
    }

    if (direction === GameControls.Up) {
      head.moveY(1);
    } else if (direction === GameControls.Down) {
      head.moveY(-1);
    } else if (direction === GameControls.Left) {
      head.moveX(+1);
    } else if (direction === GameControls.Right) {
      head.moveX(-1);
    }

    //  skipping head
    for (let i = 1; i < snake.length; i++) {
      const onGridXBackup = snake[i].onGridX;
      const onGridYBackup = snake[i].onGridY;
      if (!this.border && this.pixelWidth - 1 === snake[i].onGridX - onGridX) {
        snake[i]._onGridX = this.pixelWidth;
      } else if (!this.border && this.pixelWidth - 1 === onGridX - snake[i].onGridX) {
        snake[i]._onGridX = -1;
      } else {
        snake[i].onGridX = onGridX;
      }

      if (!this.border && this.pixelHeight - 1 === snake[i].onGridY - onGridY) {
        snake[i]._onGridY = this.pixelHeight;
      } else if (!this.border && this.pixelHeight - 1 === onGridY - snake[i].onGridY) {
        snake[i]._onGridY = -1;
      } else {
        snake[i].onGridY = onGridY;
      }

      onGridX = onGridXBackup;
      onGridY = onGridYBackup;
    }
    return updateScore;
  }

  startMultiplayer = (players: AppClient[]) => {
    if (players.length > SnakeGameLogic.predefinedColours.length) return;
    this.players = [];
    this.snake = [];
    this.food = undefined;
    this.dead = false;
    this.multiPlayerMode = true;
    this.restartGame(1, 1);
    for (let i = 0; i < players.length; i++) {
      const color = SnakeGameLogic.predefinedColours[i];
      const player: Multiplayer = {
        color,
        player: players[i],
        playerId: players[i].id,
        snake: [],
        direction: GameControls.Up,
        dead: false,
      };
      let x = 0;
      let y = 0;
      const offset = 2;
      switch (i) {
        case 0:
          y = 1;
          x = this.pixelWidth - offset;
          break;
        case 1:
          y = this.pixelHeight - offset;
          x = 1;
        case 2:
          y = this.pixelHeight - offset;
          x = this.pixelWidth - offset;
          break;
        default:
          break;
      }
      this.direction = GameControls.Up;
      this.addSnake(y, x, player.snake, color);
      this.players.push(player);
    }
    const win: SnakeWindowInfo = {
      height: this.height,
      pixelHeight: this.pixelHeight,
      pixelWidth: this.pixelWidth,
      width: this.width,
    };
    this.broadcast("game-start", win);
    this.spawnRandomFood();
    this.broadcastSnakes();
  };

  draw = () => {
    if (this.destroyed) return;
    const now = performance.now();
    const delta = now - this.now;
    this.now = now;

    if (delta <= 0) return requestAnimationFrame(this.draw);
    if (this.paused) return requestAnimationFrame(this.draw);

    this.time += delta;
    if (this.showFps) {
      //const fps = Math.round(1 / (delta / 1000));
      //this.gameDom.fps = fps;
    }

    if (this.time > this.speed) {
      if (!this.multiPlayerMode) {
        for (const snake of this.snake) {
          snake.correctPos();
        }
      } else {
        if (!this.amIClient) {
          for (const snake of this.snake) {
            snake.correctPos();
          }
        }
        for (const { snake } of this.players) {
          for (const s of snake) {
            s.correctPos();
          }
        }
      }
      this.updateSnakePos(this.snake, this.direction);
      if (this.multiPlayerMode) {
        for (const player of this.players) {
          const updateScore = this.updateSnakePos(player.snake, player.direction, player.color);
          if (updateScore) {
            player.player.emit("update-score", player.snake.length);
          }
        }
      }
      if (!this.multiPlayerMode) {
        if (this.isColliding()) {
          this.paused = true;
          return requestAnimationFrame(this.draw);
        }
      } else if (this.multiPlayerMode && !this.amIClient) {
        this.isAnySnakeColliding();
        this.broadcastSnakes();
      }
      this.time = 0;
    }

    const triangleVertices = [];
    let count = 0;

    if (this.food) {
      this.food.vertices.forEach(vertex => {
        triangleVertices.push(vertex);
      });
      count += this.food.shapes;
    }
    if (!this.amIClient && !this.dead) {
      for (let i = 0; i < this.snake.length; i++) {
        if (this.snakeAnimation) this.snake[i].move(this.time / this.speed);

        if (i === 0) {
          this.snake[i].size = 1;
        } else {
          const invertedI = this.snake.length - i;
          let percentage = invertedI / (this.snake.length * 1.1);
          percentage = percentage * 0.5 + 0.5;
          this.snake[i].size = percentage;
        }

        this.snake[i].vertices.forEach(vertex => {
          triangleVertices.push(vertex);
        });
        count += this.snake[i].shapes;
      }
    }
    if (this.multiPlayerMode) {
      for (const player of this.players) {
        if (player.dead) continue;
        for (let i = 0; i < player.snake.length; i++) {
          if (this.snakeAnimation) player.snake[i].move(this.time / this.speed);

          if (i === 0) {
            player.snake[i].size = 1;
          } else {
            const invertedI = player.snake.length - i;
            let percentage = invertedI / (player.snake.length * 1.1);
            percentage = percentage * 0.5 + 0.5;
            player.snake[i].size = percentage;
          }

          player.snake[i].vertices.forEach(vertex => {
            triangleVertices.push(vertex);
          });
          count += player.snake[i].shapes;
        }
      }
    }

    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(triangleVertices), this.gl.STATIC_DRAW);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6 * count);

    requestAnimationFrame(this.draw);
  };

  isColliding() {
    const head = this.snake[0];

    // skipping head and end of the snake
    for (let i = 1; i < this.snake.length; i++) {
      if (head.onGridX === this.snake[i].onGridX && head.onGridY === this.snake[i].onGridY) {
        return true;
      }
    }
    return false;
  }

  isAnySnakeColliding() {
    let update = false;
    if (!this.dead && this.isSnakeColliding(this.snake)) {
      this.dead = true;
      this.snake = [];
      update = true;
      this.showDead();
    }
    for (const player of this.players.filter(e => !e.dead)) {
      if (!player.dead && this.isSnakeColliding(player.snake)) {
        player.player.emit("dead");
        player.snake = [];
        player.dead = true;
        update = true;
      }
    }

    return update;
  }
  isSnakeColliding(snakeCheck: SnakeArray) {
    const snakes: SnakeArray[] = [];
    if (!this.dead) {
      snakes.push(this.snake);
    }
    this.players
      .filter(e => !e.dead)
      .forEach(e => {
        snakes.push(e.snake);
      });

    for (const blockCheck of snakeCheck) {
      const head = snakeCheck[0];
      if (!head) continue;

      const x = blockCheck.onGridX;
      const y = blockCheck.onGridY;
      if (head !== blockCheck && head.onGridX === x && head.onGridY === y) {
        return true;
      } /* else {
        const block = snakes[0][0];
        if (!block || !blockCheck || block === blockCheck) {
          continue;
        }
        if (block.onGridX === head.onGridX && block.onGridY === head.onGridY) {
          //return true;
        }
        // for (const snake of snakes) {
        //   for (const block of snake) {
        //     if (!block || !blockCheck || block === blockCheck) {
        //       continue;
        //     } else if (block.onGridX === blockCheck.onGridX && block.onGridY === blockCheck.onGridY) {
        //       return true;
        //     }
        //   }
        // }
      }*/
    }
    return false;
  }

  spawnRandomFood() {
    if (this.multiPlayerMode && this.amIClient) return;
    if (!this.food) {
      const result = Food.randomPos(this.pixelHeight, this.pixelWidth, this.snake);
      if (!result) {
        this.food = undefined;
        this.paused = true;
      } else {
        this.food = new Food(this.renderer, this.windowInfo, result.y, result.x);
      }
    }
    this.broadcastFood();
  }

  destroy() {
    this.input.destroy();
    this.renderer.destroy();
    this.destroyed = true;
  }
  private get windowInfo(): IWindowInfo {
    return {
      height: this.height,
      width: this.width,
      pixelHeight: this.pixelHeight,
      pixelWidth: this.pixelWidth,
    };
  }

  onClient(client: AppClient, type: "update", object: any): void;
  onClient(client: AppClient, type: string, object: any) {
    if (!this.multiPlayerMode) return;
    if (type === "direction") {
      const direction = object as GameControls;
      const found = this.players.find(e => e.player === client);
      if (found) {
        if (found.direction !== direction) {
          found.direction = this.control(object, found.snake, found.direction) as GameControls;
        }
      }
    }
  }

  onHost(type: "game-start", object: SnakeWindowInfo): void;
  onHost(type: "food", object: IPoint): void;
  onHost(type: "snakes-update", object: BroadcastObject[]): void;
  onHost(type: string, object: any) {
    this.multiPlayerMode = true;
    this.paused = false;
    this.amIClient = true;
    if (type === "game-start") {
      this.players = [];
      const o = object as SnakeWindowInfo;
      this.pixelWidth = o.pixelWidth;
      this.pixelHeight = o.pixelHeight;
      this.width = o.width;
      this.height = o.height;
      this.food = undefined;
    } else if (type === "food-update") {
      this.food = new Food(this.renderer, this.windowInfo, object.y, object.x);
    } else if (type === "snakes-update") {
      for (const player of object as BroadcastObject[]) {
        const found = this.players.find(p => p.playerId === player.playerID);
        if (!found) {
          const p: Multiplayer = {
            color: player.color,
            playerId: player.playerID,
            dead: player.dead,
            snake: player.dead
              ? []
              : player.cords.map(e => {
                  return new Snake(this.renderer, this.windowInfo, {
                    gameSpeed: this.speed,
                    x: e._onGridX,
                    y: e._onGridY,
                    colour: player.color,
                  });
                }),
            direction: player.direction,
          };
          this.players.push(p);
        } else {
          for (let i = 0; i < player.cords.length; i++) {
            const x = player.cords[i]._onGridX;
            const y = player.cords[i]._onGridY;
            if (found.snake[i]) {
              found.snake[i].cordsValues = player.cords[i];
            } else {
              found.snake[i] = new Snake(this.renderer, this.windowInfo, {
                gameSpeed: this.speed,
                x,
                y,
                colour: player.color,
              });
            }
            if (player.dead) {
              found.snake = [];
            }
            found.direction = player.direction;
          }
          found.dead = player.dead;
        }
      }
    } else if (type === "update-score") {
      this.gameWindow.changeOptions({ title: `Snake game: ${object}` });
    }
  }

  broadcast(type: string, object: any) {
    const toRemove: Multiplayer[] = [];
    for (const client of this.players) {
      if (client.player.disconnected) {
        toRemove.push(client);
      } else {
        client.player.emit(type, object);
      }
    }
    for (const r of toRemove) {
      removeFromArray(this.players, r);
    }
  }

  broadcastFood = () => {
    if (!this.food && !this.multiPlayerMode && this.amIClient) return;
    const { onGridX, onGridY } = this.food;
    this.broadcast("food-update", { x: onGridX, y: onGridY });
  };

  broadcastSnakes() {
    const players: BroadcastObject[] = [];
    players.push({
      color: Snake.snakeColour,
      cords: this.snake.map(e => e.cordsValues),
      playerID: "Host",
      direction: this.direction,
      dead: this.dead,
    });
    for (const p of this.players) {
      players.push({
        color: p.color,
        cords: p.snake.map(e => e.cordsValues),
        playerID: p.player.id,
        direction: p.direction,
        dead: p.dead,
      });
    }
    this.broadcast("snakes-update", players);
  }

  pause() {
    this.paused = true;
  }

  startSinglePlayer() {
    this.dead = false;
    this.multiPlayerMode = false;
    this.amIClient = false;
    this.paused = false;
  }

  private get gl() {
    return this.renderer.gl;
  }
  private get program() {
    return this.renderer.program;
  }
}
