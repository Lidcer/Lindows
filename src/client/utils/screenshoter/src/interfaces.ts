export type HTMLNode = HTMLElement | Node;

export interface HTMLUseElement extends HTMLElement {
  href: {
    baseVal: string;
  };
}
