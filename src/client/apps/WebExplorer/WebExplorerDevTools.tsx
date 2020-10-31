import { BaseWindow, IManifest } from "../BaseWindow/BaseWindow";
import React from "react";

export class WebExplorerDevTools extends BaseWindow {
  constructor(props) {
    super(props);
  }

  renderInside() {
    return <div>test</div>;
  }
}
