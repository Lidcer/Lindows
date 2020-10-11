import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, IconDefinition } from '@fortawesome/free-solid-svg-icons';

import { ContextMenuStyled, ContextIcon, ContextSeparator, ContextMenuItem, ContextColumn } from './ContextMenuStyled';
import { popup } from '../Popup/popupRenderer';

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
      return <ContextSeparator></ContextSeparator>;
    }
    return (
      <ContextMenuItem
        className={`${!element.onClick && !element.elements ? ' context-disabled' : ''}`}
        onMouseEnter={() => this.showInnerContext(element)}
        onClick={ev => this.handleClick(ev, element)}
      >
        {this.icon(element.iconOrPicture)}
        <ContextColumn>
          <span> {element.content} </span>
        </ContextColumn>
        {this.renderArrow(element.elements)}
      </ContextMenuItem>
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
      return <ContextMenuStyled hidden>{this.elementMap(element.elements)}</ContextMenuStyled>;
    }
    return <ContextMenuStyled>{this.elementMap(element.elements)}</ContextMenuStyled>;
  };

  icon = (icon?: string | IconDefinition) => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return (
        <ContextIcon>
          <img src={icon} />
        </ContextIcon>
      );
    }
    return (
      <ContextIcon>
        <FontAwesomeIcon icon={icon}></FontAwesomeIcon>
      </ContextIcon>
    );
  };

  renderArrow = (elements?: IElement[]) => {
    if (!elements) return null;
    return <FontAwesomeIcon icon={faChevronRight}></FontAwesomeIcon>;
  };

  render() {
    return (
      <ContextMenuStyled style={this.style()} className='animated jackInTheBox faster'>
        {this.elementMap(this.state.elements)}
      </ContextMenuStyled>
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

export function showContext(elements: IElement[], x: number, y: number) {
  const element = <ContextMenu elements={elements} x={x} y={y} onAnyClick={() => popup.remove(element)} />;
  popup.add(element);
}
