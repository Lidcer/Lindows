import { Options, getOptions, OptionalOptions } from './options';
import { HTMLNode, HTMLUseElement } from './interfaces';
import fontFaces from './fontFaces';
import Util from './util';
import Images from './images';
//import { saveAs } from 'file-saver';

async function toSvg(node: HTMLElement, options?: OptionalOptions) {
    const removeScripts = (nodeWithScripts: HTMLElement) => {
        let scripts = nodeWithScripts.getElementsByTagName('script');
        while (scripts[0]) {
            scripts[0].parentElement.removeChild(scripts[0]);
            scripts = nodeWithScripts.getElementsByTagName('script');
        }
        return nodeWithScripts;
    };

    const applyOptions = (clone: HTMLElement) => {
        if (options.bgcolor) clone.style.backgroundColor = options.bgcolor;
        if (options.width) clone.style.width = options.width + 'px';
        if (options.height) clone.style.height = options.height + 'px';

        if (options.style)
            Object.keys(options.style).forEach(property => {
                clone.style[property] = options.style[property];
            });

        return clone;
    };

    const inlineImages = async (node: HTMLNode) => {
        await Images.inlineAll(node, options);
        return node;
    };

    const embedFonts = async (node: HTMLElement) => {
        const cssText = await fontFaces.resolveAll(options);

        const styleNode = document.createElement('style');
        node.appendChild(styleNode);
        styleNode.appendChild(document.createTextNode(cssText));
        return node;
    };

    const makeSvgDataUri = (node: HTMLElement, width: number, height: number) => {
        node.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
        const xml = new XMLSerializer().serializeToString(node);
        const xhtml = Util.escapeXhtml(xml);
        const foreignObject = `<foreignObject x="0" y="0" width="100%" height="100%">${xhtml}</foreignObject>`;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${foreignObject}</svg>`;
        return `data:image/svg+xml;charset=utf-8,${svg}`;
    };


    options = getOptions(options);
    const clonedNode = await cloneNode(node, options.filter, true);
    const sanitized = removeScripts(clonedNode);
    const somethingNew = await embedFonts(sanitized);
    const images = await inlineImages(somethingNew);
    const clone = await applyOptions(images as HTMLImageElement);
    const svg = await makeSvgDataUri(clone, options.width || Util.width(node), options.height || Util.height(node));
    return svg;
}

async function toPixelData(node: HTMLElement, options?: OptionalOptions) {
    const canvas = await draw(node, options || {});
    return canvas.getContext('2d').getImageData(
        0,
        0,
        Util.width(node),
        Util.height(node)
    ).data;
}

async function toPng(node: HTMLElement, options?: OptionalOptions) {
    const canvas = await draw(node, options || {});
    return canvas.toDataURL();
}

async function toJpeg(node: HTMLElement, options?: OptionalOptions) {
    const canvas = await draw(node, options || {});
    return canvas.toDataURL('image/jpeg', options.quality || 1.0);
}

async function toBlob(node: HTMLElement, options?: OptionalOptions) {
    const canvas = await draw(node, options || {});
    return Util.canvasToBlob(canvas);
}

async function toCanvas(node: HTMLElement, options?: OptionalOptions) {
    return await draw(node, options || {});
}

async function draw(domNode: HTMLElement, options: OptionalOptions) {
    options = getOptions(options);
    const svg = await toSvg(domNode, options);
    const image = await Util.makeImage(svg, options);
    await Util.delay(1000);

    const scale = typeof (options.scale) !== 'number' ? 1 : options.scale;

    const canvas = newCanvas(domNode, scale);
    const ctx = canvas.getContext('2d');
    if (image) {
        ctx.scale(scale, scale);

        if (options.canvas && options.canvas.width) {
            canvas.width = options.canvas.width;
        }

        if (options.canvas && options.canvas.height) {
            canvas.height = options.canvas.height;
        }

        if (options.canvas) {
            ctx.drawImage(
                image,
                options.canvas.sx || 0,
                options.canvas.sy || 0,
                options.canvas.sw || options.width,
                options.canvas.sh || options.height,
                options.canvas.dx || 0,
                options.canvas.dy || 0,
                options.canvas.dw || options.width,
                options.canvas.dh || options.height
            );
        } else {
            (window as any).broken = image.src;
            ctx.drawImage(image, 0, 0);
        }
    }
    return canvas;

    function newCanvas(domNode: HTMLElement, scale: number) {
        const canvas = document.createElement('canvas');
        canvas.width = (options.width || Util.width(domNode)) * scale;
        canvas.height = (options.height || Util.height(domNode)) * scale;

        if (options.bgcolor) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = options.bgcolor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        return canvas;
    }
}

async function cloneNode(node: HTMLNode, filter?: OptionalOptions['filter'], root?: boolean, options?: Options) {
    if (!root && filter && !filter(node)) return;
    if (node instanceof HTMLIFrameElement) {
        try {
            const iFrame = node as HTMLIFrameElement;
            const doc = iFrame.contentWindow ? iFrame.contentWindow.document : iFrame.contentDocument;
            const docElement = doc.documentElement;
            const base64 = await toPng(docElement, options);
            const img = document.createElement('img');
            img.style.cssText = iFrame.style.cssText;
            img.src = base64;
            node = img;
        } catch (error) {
            if (options && options.verbose) {
                console.error(error.message);
            }
        }
    }

    const clone = await makeNodeCopy(node);
    const clone2 = await cloneChildren(node, clone, filter);
    return processClone(node as HTMLElement, clone2 as HTMLElement);

    function makeNodeCopy(node: HTMLNode) {
        if (node instanceof HTMLCanvasElement) return Util.makeImage(node.toDataURL(), options);
        return node.cloneNode(false);
    }

    async function cloneChildren(original: HTMLNode, clone?: HTMLNode, filter?: OptionalOptions['filter']) {
        const children = (original as HTMLElement).tagName === 'use' ? copyShadowChild(original as HTMLUseElement) : original.childNodes;
        if (children.length === 0) return clone;

        return cloneChildrenInOrder(clone, Util.asArray(children), filter)
            .then(() => {
                return clone;
            });

        async function cloneChildrenInOrder(parent: HTMLNode, children: HTMLNode[], filter: OptionalOptions['filter']) {
            for (const child of children) {
                const childClone = await cloneNode(child, filter, root, options);
                if (childClone) parent.appendChild(childClone);
            }
        }
    }


    function copyShadowChild(original: HTMLUseElement) {
        const child = document.getElementById(original.href.baseVal.replace('#', ''));
        return [child.cloneNode(true)];
    }

    function processClone(original: HTMLElement, clone: HTMLElement) {
        if (!(clone instanceof Element)) return clone;
        cloneStyle();
        clonePseudoElements();
        copyUserInput();
        fixSvg();
        return clone;

        function cloneStyle() {
            copyStyle(window.getComputedStyle(original), clone.style);

            if ((Util.isChrome() || Util.isSafari()) && clone.style.marker && (clone.tagName === 'line' || clone.tagName === 'path')) {
                clone.style.marker = '';
            }

            function copyStyle(source: CSSStyleDeclaration, target: CSSStyleDeclaration) {
                if (source.cssText) {
                    target.cssText = source.cssText;

                    // Fix strange box-shadow in Safari
                    if (Util.isSafari()) {
                        target.cssText = target.cssText.replace(/box-shadow(.*?);/, 'box-shadow: none!important;');
                    }

                    target.font = source.font; // here, we re-assign the font prop.
                } else copyProperties(source, target);

                function copyProperties(source: CSSStyleDeclaration, target: CSSStyleDeclaration) {
                    Util.asArray(source).forEach(function (name) {
                        target.setProperty(
                            name,
                            source.getPropertyValue(name),
                            source.getPropertyPriority(name)
                        );
                    });
                }
            }
        }

        function clonePseudoElements() {
            [':before', ':after'].forEach((element) => {
                clonePseudoElement(element);
            });

            function clonePseudoElement(element: string) {
                const style = window.getComputedStyle(original, element);
                const content = style.getPropertyValue('content');

                if (content === '' || content === 'none') return;

                const className = Util.uid();
                const currentClass = clone.getAttribute('class');
                if (currentClass) {
                    clone.setAttribute('class', currentClass + ' ' + className);
                }

                const styleElement = document.createElement('style');
                styleElement.appendChild(formatPseudoElementStyle(className, element, style));
                clone.appendChild(styleElement);

                function formatPseudoElementStyle(className: string, element: string, style: CSSStyleDeclaration) {
                    const selector = '.' + className + ':' + element;
                    const cssText = style.cssText ? formatCssText(style) : formatCssProperties(style);
                    return document.createTextNode(selector + '{' + cssText + '}');

                    function formatCssText(style: CSSStyleDeclaration) {
                        const content = style.getPropertyValue('content');
                        return style.cssText + ' content: ' + content + ';';
                    }

                    function formatCssProperties(style: CSSStyleDeclaration) {

                        return Util.asArray(style)
                            .map(formatProperty)
                            .join('; ') + ';';

                        function formatProperty(name: string) {
                            return name + ': ' +
                                style.getPropertyValue(name) +
                                (style.getPropertyPriority(name) ? ' !important' : '');
                        }
                    }
                }
            }
        }

        function copyUserInput() {
            if (original instanceof HTMLTextAreaElement) clone.innerHTML = original.value;
            if (original instanceof HTMLInputElement) clone.setAttribute('value', original.value);
        }

        function fixSvg() {
            if (!(clone instanceof SVGElement)) return;
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            if (!(clone instanceof SVGRectElement)) return;
            const attributes = ['width', 'height'];
            for (const attribute of attributes) {
                const value = clone.getAttribute(attribute);
                if (!value) continue;

                clone.style.setProperty(attribute, value);
            }
        }
    }
}
export {toPixelData};