import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, IconDefinition } from '@fortawesome/free-solid-svg-icons';

import './ContextMenu.scss';

export interface IElements {
  elements: IElement[];
  x: number;
  y: number;
  onAnyClick?: (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export interface IElement {
  content?: string | JSX.Element;
  onClick?: (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  iconOrPicture?: string | IconDefinition;
  elements?: IElement[];
}

export interface IState extends IElements {
  hidden?: boolean;
}

export interface IStateElement extends IElement {
  hidden?: boolean;
  id?: number;
}

export class ContextMenu extends React.Component<IElements, IState> {
  private id = 0;
  constructor(props: IElements) {
    super(props);

    const state: IState = { ...props };
    state.hidden = false;
    if (!state.x) state.x = 0;
    if (!state.y) state.y = 0;
    if (state.elements) state.elements.forEach(this.hideAllInside);
    this.state = state;
  }

  hideAllInside = (state: IStateElement | IElement) => {
    const element: IStateElement = state;
    element.id = ++this.id;
    element.hidden = true;
    if (element.elements) element.elements.forEach(this.hideAllInside);
  };

  elementMap = (element: IElement[]) => {
    return element.map(this.getElement);
  };

  getElement = (element: IElement, index: number) => {
    return (
      <div key={this.id++}>
        {this.item(element)}
        {element.elements ? this.contextInContext(element) : null}
      </div>
    );
  };

  handleClick = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>, element: IElement) => {
    if (this.props.onAnyClick) this.props.onAnyClick(ev);
    if (element.onClick) element.onClick(ev);
  };

  item(element: IElement) {
    if (!element.content) {
      return <div className='context-separator'></div>;
    }
    return (
      <div
        className={`context-menu-item${!element.onClick && !element.elements ? ' context-disabled' : ''}`}
        onMouseEnter={() => this.showInnerContext(element)}
        onClick={ev => this.handleClick(ev, element)}
      >
        {this.icon(element.iconOrPicture)}
        <div className='context-column'>
          <span className='context-content'> {element.content} </span>
        </div>
        {this.renderArrow(element.elements)}
      </div>
    );
  }

  showInnerContext = (element: IStateElement) => {
    const state = { ...this.state };
    let iStateElement: IStateElement;
    state.elements.forEach(this.hideContexts);

    for (const el of state.elements) {
      iStateElement = this.findElementAndDisable(el, element.id);
      if (iStateElement) break;
    }
    iStateElement.hidden = false;
    this.setState(state);
  };

  hideContexts = (element: IStateElement) => {
    element.hidden = true;
    if (element.elements) element.elements.forEach(this.hideContexts);
  };

  findElementAndDisable = (element: IStateElement, searchIndex: number): IStateElement | null => {
    if (element.id === searchIndex) return element;
    if (!element.elements) return null;
    for (const el of element.elements) {
      const result = this.findElementAndDisable(el, searchIndex);
      if (result) {
        element.hidden = false;
        return result;
      }
    }
  };

  contextInContext = (element: IStateElement) => {
    if (!element) return null;
    if (element.hidden) {
      return (
        <div className='context-menu' hidden>
          {this.elementMap(element.elements)}
        </div>
      );
    }
    return <div className='context-menu'>{this.elementMap(element.elements)}</div>;
  };

  icon = (icon?: string | IconDefinition) => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return (
        <span className='context-icon'>
          <img src={icon} />
        </span>
      );
    }
    return (
      <span className='context-icon'>
        <FontAwesomeIcon icon={icon}></FontAwesomeIcon>
      </span>
    );
  };

  renderArrow = (elements?: IElement[]) => {
    if (!elements) return null;
    return <FontAwesomeIcon icon={faChevronRight}></FontAwesomeIcon>;
  };

  render() {
    return (
      <div style={this.style()} className='animated jackInTheBox faster context-menu'>
        {this.elementMap(this.state.elements)}
      </div>
    );
  }

  style(cords?: { x: number; y: number }) {
    if (!cords)
      cords = {
        x: this.state.x,
        y: this.state.y,
      };
    return {
      top: `${this.state.y | 0}px`,
      left: `${this.state.x | 0}px`,
    };
  }
}
