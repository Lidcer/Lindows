import { IManifest, BaseWindow, MessageBox } from "../BaseWindow/BaseWindow";
import React from "react";
import { NetworkWarper } from "./NetworkStatusStyled";
interface State {
  message: string;
}

export class AnApp extends BaseWindow<State> {
  public static readonly onlyOne = true;

  public static manifest: IManifest = {
    fullAppName: "An app",
    launchName: "anapp",
    icon: "/assets/images/unknown-app.svg",
  };

  constructor(props) {
    super(
      props,
      {
        minHeight: 300,
        minWidth: 300,
      },
      {
        message: "",
      },
    );
  }

  renderInside() {
    return <NetworkWarper></NetworkWarper>;
  }
}
