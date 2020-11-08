import { IManifest, BaseWindow, MessageBox } from "../BaseWindow/BaseWindow";
import React from "react";
import { SnakeGameButtons, SnakeGameOptions, SnakeGameWarper, SnakeMenuButton } from "./SnakeGameStyle";
import { SnakeGameLogic } from "./SnakeGameLogic";
import { SnakeInput } from "./SnakeInput";
import { NetworkBaseWindow } from "../BaseWindow/NetworkBaseWindow";

interface State {
  paused: boolean;
  multiplayerMenu: boolean;
  hostMenu: boolean;
  joinMenu: boolean;
  joinCode: string;
  dead: boolean;
}

export class SnakeGame extends NetworkBaseWindow<State> {
  public static readonly onlyOne = true;
  public readonly offlineMode = STATIC;

  public static manifest: IManifest = {
    fullAppName: "Snake game",
    launchName: "webGlSnake",
    icon: "/assets/images/appsIcons/SnakeGameIcon.svg",
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
        startPos: "center",
        showIcon: false,
        maximizeRestoreDownButton: "disabled",
      },
      {
        paused: !STATIC,
        multiplayerMenu: false,
        hostMenu: false,
        joinMenu: false,
        dead: false,
        joinCode: "",
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
      (...args) => this.emit.apply(this, args),
      () => this.setVariables({ dead: true }),
    );
    if (this.state.variables.paused) {
      this.snakeGame.pause();
    }

    requestAnimationFrame(this.snakeGame.draw);
  }
  closing() {
    this.disconnectHost();
    this.snakeGameInput.destroy();
    this.snakeGame.destroy();
  }
  onKeyDown(event) {
    if (this.variables.paused) return;
    if (this.snakeGameInput) {
      this.snakeGameInput.onKeypress(event);
    }
  }
  onSocketConnectionDestroy(...args) {
    this.changeOptions({ title: "Connection lost" });
    this.mainMenu();
  }

  onSocketHostDisconnected(...args) {
    console.log("?")
    if (!this.destroyed) {
      this.mainMenu();
    }
  }

  onSocketClientConnected(...args) {
    //   console.log(args);
    this.forceUpdate();
  }

  onSocketClientReceived(...args: any[]) {
    if (this.snakeGame && this.hostId) {
      this.snakeGame.onClient.apply(this.snakeGame, args);
    }
  }
  onSocketHostReceived(...args: any[]) {
    if (args[0] === "dead") {
      this.setVariables({ dead: true });
      return;
    }
    if (this.snakeGame && this.connectionId) {
      this.snakeGame.onHost.apply(this.snakeGame, args);
      if (args[0] === "game-start") {
        this.setVariables({
          multiplayerMenu: false,
          hostMenu: false,
          joinCode: "",
          joinMenu: false,
          paused: false,
          dead: false,
        });
      }
    }
  }

  private startMultiplayer = () => {
    if (this.snakeGame) {
      this.snakeGame.startMultiplayer(this.clients);
      this.setVariables({
        multiplayerMenu: false,
        hostMenu: false,
        joinCode: "",
        joinMenu: false,
        paused: false,
        dead: false,
      });
    }
  };

  private pause = () => {
    if (this.snakeGame) {
      this.snakeGame.pause();
      this.setVariables({ paused: true });
    }
  };
  private startSinglePlayer = () => {
    if (this.snakeGame) {
      this.snakeGame.startSinglePlayer();
      this.setVariables({ paused: false });
    }
  };

  copyGameID = (ev: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
    const copyText = ev.target as HTMLInputElement;
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    this.raiseNotification("Copy", "Copied to clipboard");
  };

  mainMenu = () => {
    this.disconnectHost();
    this.setVariables({
      paused: true,
      multiplayerMenu: false,
      hostMenu: false,
      joinMenu: false,
      dead: false,
      joinCode: "",
    });
  };

  get dead() {
    if (!this.variables.dead) return null;
    let content = <SnakeMenuButton onClick={this.mainMenu}>Back</SnakeMenuButton>;

    if (this.hostId) {
      content = <SnakeMenuButton onClick={this.startMultiplayer}>Restart</SnakeMenuButton>;
    }

    return (
      <SnakeGameOptions>
        <SnakeGameButtons>
          <div> Game over</div>
          {content}
        </SnakeGameButtons>
      </SnakeGameOptions>
    );
  }

  get onlineMenu() {
    if (this.offlineMode) return null;
    const vars = this.variables;
    if (!vars.paused) return null;
    let content: JSX.Element = (
      <>
        <SnakeMenuButton onClick={this.startSinglePlayer}>SinglePlayer</SnakeMenuButton>
        <SnakeMenuButton onClick={() => this.setVariables({ multiplayerMenu: true })}>Multiplayer</SnakeMenuButton>
      </>
    );

    if (this.connectionId) {
      const d = () => {
        this.disconnectHost().then(e => this.forceUpdate());
      };
      content = (
        <>
          <div>
            <div>Waiting for host to start the game</div>
            <SnakeMenuButton onClick={d}>Disconnect</SnakeMenuButton>
          </div>
        </>
      );
    } else if (vars.hostMenu) {
      if (this.hostId) {
        const uh = () => {
          this.destroyHost();
          this.forceUpdate();
        };

        const clients = this.clients.length ? (
          <SnakeMenuButton onClick={this.startMultiplayer}>Start game</SnakeMenuButton>
        ) : (
          <div>awating for players</div>
        );

        content = (
          <>
            <div>
              <div>
                Game id: <input value={this.hostId} onClick={this.copyGameID} readOnly></input>
              </div>
              <div>Send this id to your friends and start playing</div>
              {this.clients.map((e, i) => {
                const colours = SnakeGameLogic.predefinedColours;

                const r = colours[i].r;
                const g = colours[i].g;
                const b = colours[i].b;

                return (
                  <div key={i} style={{ color: `rgb(${r},${g},${b})` }}>
                    Player {i + 1}
                  </div>
                );
              })}
            </div>
            {clients}
            <SnakeMenuButton onClick={uh}>Stop Hosting</SnakeMenuButton>
          </>
        );
      } else {
        const h = () => {
          this.host(3)
            .then(() => {
              this.forceUpdate();
            })
            .catch(e => {
              MessageBox.Show(this, `Unable to host ${e.message}`);
            });
        };

        content = (
          <>
            <SnakeMenuButton onClick={h}>Host game</SnakeMenuButton>
            <SnakeMenuButton onClick={() => this.setVariables({ multiplayerMenu: true, hostMenu: false })}>
              Back
            </SnakeMenuButton>
          </>
        );
      }
    } else if (vars.joinMenu) {
      const j = () => {
        this.connectHost(this.variables.joinCode)
          .then(() => {
            this.forceUpdate();
          })
          .catch(e => MessageBox.Show(this, "Invalid code"));
      };

      content = (
        <>
          <input
            onChange={e => this.setVariables({ joinCode: e.target.value })}
            value={this.variables.joinCode}
            placeholder='Game ID'
          ></input>
          <SnakeMenuButton onClick={j}>Join game</SnakeMenuButton>
          <SnakeMenuButton onClick={() => this.setVariables({ multiplayerMenu: true, joinMenu: false })}>
            Back
          </SnakeMenuButton>
        </>
      );
    } else if (vars.multiplayerMenu) {
      content = (
        <>
          <SnakeMenuButton onClick={() => this.setVariables({ hostMenu: true })}>Host game</SnakeMenuButton>
          <SnakeMenuButton onClick={() => this.setVariables({ joinMenu: true })}>Join game</SnakeMenuButton>
          <SnakeMenuButton onClick={() => this.setVariables({ multiplayerMenu: false })}>Back</SnakeMenuButton>
        </>
      );
    }
    return (
      <SnakeGameOptions>
        <SnakeGameButtons>{content}</SnakeGameButtons>
      </SnakeGameOptions>
    );
  }

  renderInside() {
    return (
      <SnakeGameWarper>
        {this.onlineMenu}
        {this.dead}
        <canvas ref={this.ref} style={{ height: `100%`, width: `100%` }}></canvas>
      </SnakeGameWarper>
    );
  }
}
