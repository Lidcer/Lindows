import { BaseWindow, IBaseWindowProps, IManifest } from "../BaseWindow/BaseWindow";
import React from "react";
import { LypeWebpage } from "./LypeWebpage";

export class Lype extends BaseWindow {
  public static readonly onlyOne = true;
  public static manifest: IManifest = {
    fullAppName: "Lype",
    launchName: "lype",
    icon: "/assets/images/appsIcons/Lype.svg",
  };

  constructor(props: IBaseWindowProps) {
    super(props, {
      title: "Lype",
      redirectToWebpageButton: "lype",
      minHeight: 400,
      minWidth: 500,
    });
  }

  shown() {
    if (this.isPhone) {
      const options = { ...this.options };
      options.maximized = true;
      this.changeOptions(options);
    }
  }

  renderInside() {
    return <LypeWebpage window={this} destroy={this.exit}></LypeWebpage>;
  }
}
