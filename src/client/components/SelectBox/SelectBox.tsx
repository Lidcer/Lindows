import React from 'react';
import { BoxSelection } from './SelectBoxStyled';

export interface IPos {
  pos: {
    x: number;
    y: number;
  };
}

interface IState {
  x: number;
  y: number;
}

export class SelectBox extends React.Component<IPos, IState> {
  constructor(props: IPos) {
    super(props);
    this.state = {
      x: props.pos.x,
      y: props.pos.y,
    };
  }

  componentDidMount() {
    window.addEventListener('mousemove', this.mouseMove, false);
  }

  componentWillUnmount() {
    window.removeEventListener('mousemove', this.mouseMove, false);
  }

  mouseMove = (event: MouseEvent) => {
    this.setState({
      x: event.clientX,
      y: event.clientY,
    });
    //   console.log('test', this.a);
  };

  render() {
    return <BoxSelection style={this.style}></BoxSelection>;
  }

  get style() {
    let top = this.props.pos.y;
    let left = this.props.pos.x;
    let width = this.state.x - this.props.pos.x;
    let height = this.state.y - this.props.pos.y;
    if (this.state.x < this.props.pos.x) {
      width = this.props.pos.x - this.state.x;
      left -= width;
    }
    if (this.state.y < this.props.pos.y) {
      height = this.props.pos.y - this.state.y;
      top -= height;
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  }
}
