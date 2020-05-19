import React from 'react';
import './popup.scss';
import { IPopup, PopupElement } from './popup';

export const popup = new IPopup();

interface IStatePopup {
  elements: PopupElement[];
  darken: boolean;
}

export class PopupRenderer extends React.Component<{}, IStatePopup> {
  constructor(props) {
    super(props);
    this.state = {
      elements: popup.elements,
      darken: false,
    };
  }
  componentDidMount() {
    popup.on('update', this.updateElements);
  }
  componentWillUnmount() {
    popup.removeListener('update', this.updateElements);
  }
  updateElements = (elements: PopupElement[]) => {
    this.setState({ elements });
  };

  get element() {
    return popup.elements[0];
  }

  get blocker() {
    const exit = this.element ? this.element.forceExit : null;
    const shouldBlockEvents = this.element ? this.element.blockEvents : false;

    return (
      <div
        className={`overlay-blocker${shouldBlockEvents ? ' block-events' : ''}${this.state.darken ? ' darken' : ''}`}
        onClick={exit}
      ></div>
    );
  }

  render() {
    if (this.state.elements.length === 0) return null;
    return (
      <>
        <div className='popup-element'>{this.element.jsx}</div>
        {this.blocker}
      </>
    );
  }
}
