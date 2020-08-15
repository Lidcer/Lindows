import { HTMLNode } from './interfaces';

export interface Options {
    imagePlaceholder?: string;
    cache?: boolean;
    cacheBust?: boolean;
    useCredentials?: boolean;
    skipExternalFileMatch?: boolean;
    verbose?: boolean;
}
export interface OptionalOptions extends Options {
    filter? : (node: HTMLNode) => boolean;
    bgcolor?: string;
    width?: number;
    height?: number;
    style?: Object;
    quality?: number;
    scale?: number;
    canvas?: {
        height: number;
        width: number;
        sx: number;
        sy: number;
        sw: number;
        sh: number;
        dx: number;
        dy: number;
        dw: number;
        dh: number;
    };
}

export function getOptions(options: Options = {}): Required<Options> | OptionalOptions {
    const requiredOptions: Partial<Options> =  {};
    if (options.imagePlaceholder !== undefined) {
        requiredOptions.imagePlaceholder = undefined;
    } else {
        requiredOptions.imagePlaceholder = options.imagePlaceholder;
    }

    if (options.cacheBust !== undefined) {
        requiredOptions.cacheBust = false;
    } else {
        requiredOptions.cacheBust = options.cacheBust;
    }

    if (options.useCredentials !== undefined) {
        requiredOptions.useCredentials = false;
    } else {
        requiredOptions.useCredentials = options.useCredentials;
    }

    if (options.skipExternalFileMatch !== undefined) {
        requiredOptions.skipExternalFileMatch = false;
    } else {
        requiredOptions.skipExternalFileMatch = options.skipExternalFileMatch;
    }

    if (options.verbose !== undefined) {
        requiredOptions.verbose = false;
    } else {
        requiredOptions.verbose = options.verbose;
    }

    return {
        ...options,
        ...requiredOptions
    };

}
