import React from 'react';
import './StartMenu.scss';
import { navBarPos } from '../TaskBar/TaskBar';

interface IStartMenu {
  height: number;
}

export class StartMenu extends React.Component<{}, IStartMenu> {
  constructor(props) {
    super(props);
    this.state = {
      height: 0,
    };
  }

  render() {
    return (
      <div className={`start-menu start-menu-${navBarPos}`} style={this.style}>
        <div></div>
      </div>
    );
  }
  componentDidMount() {
    setTimeout(() => {
      this.setState({
        height: 500,
      });
    });
  }

  get style() {
    return {
      height: `${this.state.height}px`,
    };
  }
}
