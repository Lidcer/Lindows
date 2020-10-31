/* SystemJS module definition */
declare const DEV: boolean;
declare const STATIC: boolean;

declare const twemoji: {
  parse(str: string, options?: { folder?: string; ext?: string; className?: string; size?: string | number }): string;
  size: string;
};

declare module "compress-str" {
  export function gzip(string: string): Promise<string>;
  export function gzip(string: string, callback: (error: Error, compressed: string) => void);

  export function gunzip(string: string): Promise<string>;
  export function gunzip(string: string, callback: (error: Error, compressed: string) => void);
}
