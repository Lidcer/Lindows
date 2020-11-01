import { IManifest, BaseWindow, MessageBox } from "../BaseWindow/BaseWindow";
import React from "react";
import {
  Frame,
  VirtualCrateWarper,
  OSSelection,
  OSSelections,
  OSSelected,
  OsDetails,
  OptionButton,
  OptionCaption,
} from "./VirtualCrateStyled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCertificate, faCog, faStar, faArrowDown, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { VirtualOs } from "./VirtualOs";
import { WindowEvent } from "../BaseWindow/WindowEvent";
import { inIframe } from "../../utils/util";
import { internal } from "../../services/internals/Internal";
import { sanitizeName } from "../../utils/FileSystemDirectory";
import { SystemServiceStatus } from "../../services/internals/BaseSystemService";
import { initial } from "lodash";

export interface WebsiteOperationSystems {
  url: string;
  icon: string;
  name: string;
}

interface VirtualCreateState {
  selected?: number;
  os: Map<WebsiteOperationSystems, VirtualOs>;
  freeze: boolean;
}

export class VirtualCreate extends BaseWindow<VirtualCreateState> {
  public static manifest: IManifest = {
    fullAppName: "Virtual Crate",
    launchName: "VirtualCrate",
    icon: "/assets/images/appsIcons/VirtualCreate.svg",
  };
  private websiteOperationSystems: WebsiteOperationSystems[] = [
    { icon: "/assets/images/LindowsOs.svg", url: origin, name: "Lindows" },
  ];

  constructor(props) {
    super(
      props,
      {
        minHeight: 500,
        minWidth: 600,
      },
      {
        selected: undefined,
        os: new Map(),
        freeze: false,
      },
    );
  }

  onExit(event: WindowEvent) {
    if (this.variables.os.size) {
      event.preventDefault();
      if (!this.minimized) {
        this.minimize();
      }
    }
  }

  getOses() {
    return this.websiteOperationSystems.map((os, i) => {
      if (this.variables.selected === i) {
        return (
          <OSSelected key={i} onClick={() => this.setVariables({ selected: undefined })}>
            <img src={os.icon} width='25' />
            {os.name}
          </OSSelected>
        );
      }
      return (
        <OSSelection key={i} onClick={() => this.setVariables({ selected: i })}>
          <img src={os.icon} width='25' />
          {os.name}
        </OSSelection>
      );
    });
  }

  startButton = async () => {
    if (this.variables.freeze) return;
    if (this.variables.selected !== undefined) {
      const wos = this.websiteOperationSystems[this.variables.selected];
      return this.startOs(wos);
    }
  };

  async startOs(wos: WebsiteOperationSystems) {
    const existingOs = this.variables.os.get(wos);
    if (existingOs) {
      existingOs.focus();
      return;
    }

    if (inIframe()) {
      await MessageBox.Show(this, "This machine does not support hyper-L technology");
      return;
    }
    if (internal.broadcaster.status() !== SystemServiceStatus.Ready) {
      await MessageBox.Show(this, "This machine does not support brodcaster technology");
      return;
    }

    const usr = internal.system.user.userSymbol;
    const usrDirectory = internal.system.user.userDirectory;
    let vm = usrDirectory.getDirectory("vm", usr);
    if (!vm) {
      vm = await usrDirectory.createDirectory("vm", usr);
    }

    this.setVariables({ freeze: true });

    const killOs = () => {
      internal.broadcaster.removeListener("vm", communicator);
      const vars = { ...this.variables };
      vars.os.delete(wos);
      this.setVariables(vars);
    };

    const communicator = async data => {
      if (data && data.type === "request-data") {
        const os = this.websiteOperationSystems.find(o => o.url === data.origin);
        if (!os) return;
        const fileName = `${sanitizeName(os.name)}.vmc`;
        let osDir = vm.getFile(fileName, usr);
        if (!osDir) {
          osDir = await vm.createFile(fileName, "text", "", usr);
        }
        const contnet = osDir.getContent(usr);
        if (typeof contnet === "string") {
          internal.broadcaster.emit("vm", { type: "response-data", response: contnet, key: data.key });
        } else {
          internal.broadcaster.emit("vm", { type: "response-data", response: null, key: data.key });
        }
        return;
      }

      if (data && data.type === "request-store" && data.origin && data.compressed) {
        const os = this.websiteOperationSystems.find(o => o.url === data.origin);
        if (!os) return;
        const fileName = `${sanitizeName(os.name)}.vmc`;
        let osDir = vm.getFile(fileName, usr);
        if (!osDir) {
          osDir = await vm.createFile(fileName, "text", data.compressed, usr);
        } else {
          await osDir.setContent(data.compressed, usr);
        }
      }

      if (data && data.type === "request-clear-data") {
        const os = this.websiteOperationSystems.find(o => o.url === data.origin);
        if (!os) return;
        const rOs = this.variables.os.get(os);
        const fileName = `${sanitizeName(os.name)}.vmc`;
        let osDir = vm.getFile(fileName, usr);
        if (!osDir) {
          osDir = await vm.createFile(fileName, "text", "", usr);
        } else {
          await osDir.setContent("", usr);
        }
        await rOs.exit();
        killOs();
        this.startOs(os);
      }
    };

    internal.broadcaster.on("vm", communicator);

    const os = (await VirtualOs.New(this.props.launchFile)) as VirtualOs;
    os.onExit = () => killOs();
    this.variables.os.set(wos, os);
    os.loadSystem(wos);
    this.setVariables({ freeze: false });
  }

  newButton() {
    const enabled = false;
    const style = enabled ? { color: "blue" } : { color: "gray" };
    return (
      <OptionButton style={style} disabled={enabled}>
        <FontAwesomeIcon icon={faCertificate}></FontAwesomeIcon>
        <OptionCaption>New</OptionCaption>
      </OptionButton>
    );
  }
  settings() {
    const enabled = false;
    const style = enabled ? { color: "blue" } : { color: "gray" };
    return (
      <OptionButton style={style} disabled={enabled}>
        <FontAwesomeIcon icon={faCog}></FontAwesomeIcon>
        <OptionCaption>Settings</OptionCaption>
      </OptionButton>
    );
  }
  discard() {
    const enabled = false;
    const style = enabled ? { color: "blue" } : { color: "gray" };
    return (
      <OptionButton style={style} disabled={enabled}>
        <FontAwesomeIcon icon={faArrowDown}></FontAwesomeIcon>
        <OptionCaption>Discard</OptionCaption>
      </OptionButton>
    );
  }
  start() {
    const enabled = this.variables.selected !== undefined;
    const style = enabled ? { color: "#98f145" } : { color: "gray" };
    const owd = this.websiteOperationSystems[this.variables.selected];
    const text = enabled && this.variables.os.get(owd) ? "Show" : "Start";
    return (
      <OptionButton onClick={this.startButton} style={style} disabled={enabled}>
        <FontAwesomeIcon icon={faArrowRight}></FontAwesomeIcon>
        <OptionCaption>{text}</OptionCaption>
      </OptionButton>
    );
  }

  renderRight() {
    return (
      <>
        {this.newButton()}
        {this.settings()}
        {this.discard()}
        {this.start()}
      </>
    );
  }

  renderInside() {
    return (
      <VirtualCrateWarper>
        <OSSelections>{this.getOses()}</OSSelections>
        <OsDetails>{this.renderRight()}</OsDetails>
      </VirtualCrateWarper>
    );
  }
}
