/* SystemJS module definition */
declare const window: Window;
interface IWindow {
  DEV?: boolean;
}

declare const twemoji: {
  parse(str: string, options?: { folder?: string; ext?: string; className?: string; size?: string | number }): string;
  size: string;
};
