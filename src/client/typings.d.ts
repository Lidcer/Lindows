/* SystemJS module definition */
declare const DEVELOPMENT: boolean;
declare const STATIC: boolean;


declare const twemoji: {
  parse(str: string, options?: { folder?: string; ext?: string; className?: string; size?: string | number }): string;
  size: string;
};