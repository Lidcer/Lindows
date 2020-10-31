import React, { PureComponent } from "react";
import { Desktop } from "./Desktop/Desktop";
import { Bios, showTermsOfPolicy } from "../Boot/bios/Bios";
import { attachToWindowIfDev } from "../essential/requests";
import { BootLindows } from "../Boot/BootLindows/BootLindows";
import { BootScreen } from "../Boot/bootScreen/bootScreen";

//interface IProps { }

interface IState {
  display: "bootscreen" | "bootos" | "lidnows" | "bios";
}

export class Main extends PureComponent<{} /*IProps*/, IState> {
  private sequence = ["bootscreen", "bootos", "lindows"];

  constructor(props) {
    super(props);

    this.state = {
      display: "bootscreen",
    };
    attachToWindowIfDev("b", this);
  }

  next = () => {
    console.log("?");
    const index = this.sequence.indexOf(this.state.display);
    if (index === -1) return;
    const next = this.sequence[index + 1];
    console.log(next);
    if (!next) return;

    switch (this.state.display) {
      case "bootscreen":
        if (showTermsOfPolicy()) {
          this.setState({ display: "bios" });
        } else {
          this.setState({ display: "bootos" });
        }
        break;
      case "bootos":
        if (showTermsOfPolicy()) {
          this.setState({ display: "bios" });
        } else {
          this.setState({ display: "bootos" });
        }
      case "lidnows":
        if (showTermsOfPolicy()) {
          this.setState({ display: "bios" });
        } else {
          this.setState({ display: "lidnows" });
        }
      default:
        break;
    }
  };
  gotoBios = () => {
    this.setState({ display: "bios" });
  };

  render() {
    switch (this.state.display) {
      case "lidnows":
        return <Desktop></Desktop>;
      case "bios":
        return <Bios next={this.next}></Bios>;
      case "bootos":
        return <BootLindows next={this.next}></BootLindows>;
      case "bootscreen":
        return <BootScreen next={this.next} goToBios={this.gotoBios}></BootScreen>;
    }
    return <div className='text-danger'>Internal error</div>;
  }
}
