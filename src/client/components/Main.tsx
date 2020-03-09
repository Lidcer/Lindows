import React, { PureComponent } from 'react';
import { Desktop } from './Desktop/Desktop';
import { Bios } from './bios/Bios';
import { BootScreen } from './bootScreen/bootScreen';
import { Webpage } from './webpage';

//interface IProps { }

interface IState {
  display: 'bootscreen' | 'bios' | 'bootanimation' | 'lidnows' | 'webpage';
}

export class Main extends PureComponent<{} /*IProps*/, IState> {
  private shouldStayInBios = false;

  constructor(props) {
    super(props);

    this.state = {
      display: 'bootscreen',
    };
  }

  render() {
    if (this.state.display === 'lidnows') return <Desktop></Desktop>;
    else if (this.state.display === 'webpage') return <Webpage></Webpage>;
    else if (this.state.display === 'bios')
      return <Bios next={this.next} shouldStayInBios={this.shouldStayInBios}></Bios>;
    else if (this.state.display === 'bootscreen') return <BootScreen next={this.next}> </BootScreen>;
  }

  next = (boot?: 'lindows' | 'webpage' | 'bios') => {
    if (boot === 'bios') this.shouldStayInBios = true;

    switch (this.state.display) {
      case 'bootscreen':
        this.setState({ display: 'bios' });
        break;
      case 'bios':
        if (boot === 'lindows') {
          this.setState({ display: 'lidnows' });
        } else this.setState({ display: 'webpage' });
        break;
      default:
        break;
    }
  };
}
