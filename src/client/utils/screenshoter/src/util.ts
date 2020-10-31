import { Options, getOptions } from "./options";
import Axios from "axios";

const requestCache = new Map<string, string>();

function mimes() {
  /*
   * Only WOFF and EOT mime types for fonts are 'real'
   * see http://www.iana.org/assignments/media-types/media-types.xhtml
   */
  const WOFF = "application/font-woff";
  const JPEG = "image/jpeg";

  return {
    woff: WOFF,
    woff2: WOFF,
    ttf: "application/font-truetype",
    eot: "application/vnd.ms-fontobject",
    png: "image/png",
    jpg: JPEG,
    jpeg: JPEG,
    gif: "image/gif",
    tiff: "image/tiff",
    svg: "image/svg+xml",
  };
}

function parseExtension(url: string) {
  const match = /\.([^\.\/]*?)(\?|$)/g.exec(url);
  if (match) return match[1];
  else return "";
}

function mimeType(url: string) {
  const extension = parseExtension(url).toLowerCase();
  return mimes()[extension] || "";
}

function isDataUrl(url: string) {
  return url.search(/^(data:)/) !== -1;
}

function toBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>(resolve => {
    const binaryString = window.atob(canvas.toDataURL().split(",")[1]);
    const length = binaryString.length;
    const binaryArray = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      binaryArray[i] = binaryString.charCodeAt(i);
    }

    resolve(
      new Blob([binaryArray], {
        type: "image/png",
      }),
    );
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  if (canvas.toBlob)
    return new Promise(resolve => {
      canvas.toBlob(resolve);
    });

  return toBlob(canvas);
}

function resolveUrl(url: string, baseUrl: string) {
  const doc = document.implementation.createHTMLDocument();
  const base = doc.createElement("base");
  doc.head.appendChild(base);
  const anchor = doc.createElement("a");
  doc.body.appendChild(anchor);
  base.href = baseUrl;
  anchor.href = url;
  return anchor.href;
}

function uid() {
  let index = 0;

  return () => {
    return "u" + fourRandomChars() + index++;

    function fourRandomChars() {
      /* see http://stackoverflow.com/a/6248722/2519373 */
      return ("0000" + ((Math.random() * Math.pow(36, 4)) << 0).toString(36)).slice(-4);
    }
  };
}

function makeImage(uri: string, options: Options): Promise<HTMLImageElement> {
  options = getOptions(options);
  if (uri === "data:,") return Promise.resolve(new Image());
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (options.useCredentials) {
      image.crossOrigin = "use-credentials";
    }
    const justResolve = () => {
      resolve(image);
      image.removeEventListener("load", justResolve);
      image.removeEventListener("error", justResolve);
    };
    image.addEventListener("load", justResolve);
    image.addEventListener("error", justResolve);
    image.src = uri;
  });
}

async function getAndEncode(url: string, options: Options) {
  return new Promise<string>(async resolve => {
    options = getOptions(options);

    const TIMEOUT = 30000;
    if (options.cacheBust) {
      // Cache bypass so we don't have CORS issues with cached images
      // Source: https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
      url += (/\?/.test(url) ? "&" : "?") + new Date().getTime();
    }
    try {
      let placeholder: string;
      if (options.imagePlaceholder) {
        const split = options.imagePlaceholder.split(/,/);
        if (split && split[1]) {
          placeholder = split[1];
        }
      }
      if (options.cache) {
        const content = requestCache.get(url);
        if (content) {
          return resolve(content);
        }
      }

      const withCredentials = !!options.useCredentials;
      let blob: Blob;
      if (url.startsWith("blob")) {
        blob = await fetch(url).then(r => r.blob());
      } else {
        const data = await Axios.get<Blob>(url, { responseType: "blob", withCredentials, timeout: TIMEOUT });
        blob = data.data;
      }

      const encoder = new FileReader();

      const loadEnd = () => {
        const result = encoder.result;
        if (typeof result === "string") {
          const content = result.split(/,/)[1];
          if ((options.cache, options.cache)) {
            requestCache.set(url, content);
          }

          resolve(content);
        } else {
          const stringResult = String.fromCharCode.apply(null, new Uint16Array(result));
          const content = stringResult.split(/,/)[1];
          if (options.cache) {
            requestCache.set(url, content);
          }
          resolve(content);
        }
        encoder.removeEventListener("loadend", loadEnd);
      };

      encoder.addEventListener("loadend", loadEnd);
      encoder.readAsDataURL(blob);
      return placeholder;
    } catch (error) {
      console.error(error);
      resolve();
    }
  });

  // return new Promise<string>((resolve) => {

  //     const request = new XMLHttpRequest();

  //     request.onreadystatechange = done;
  //     request.ontimeout = timeout;
  //     request.responseType = 'blob';
  //     request.timeout = TIMEOUT;

  //     if (options.useCredentials) {
  //         request.withCredentials = true;
  //     }
  //     request.open('GET', url, true);
  //     request.send();

  //     let placeholder:string;
  //     if (options.imagePlaceholder) {
  //         const split = options.imagePlaceholder.split(/,/);
  //         if (split && split[1]) {
  //             placeholder = split[1];
  //         }
  //     }

  //     function done() {
  //         if (request.readyState !== 4) return;

  //         if (request.status !== 200) {
  //             if (placeholder) {
  //                 resolve(placeholder);
  //             } else {
  //                 console.error(request)
  //                 fail('cannot fetch resource: ' + url + ', status: ' + request.status);
  //             }

  //             return;
  //         }

  //         const encoder = new FileReader();
  //         encoder.onloadend = () => {
  //             const result = encoder.result;
  //             if (typeof result === 'string') {
  //                 const content = result.split(/,/)[1];
  //                 resolve(content);
  //             } else {
  //                 const stringResult = String.fromCharCode.apply(null, new Uint16Array(result));
  //                 const content = stringResult.split(/,/)[1];
  //                 resolve(content);
  //             }
  //         };
  //         encoder.readAsDataURL(request.response);
  //     }

  //     function timeout() {
  //         if (placeholder) {
  //             resolve(placeholder);
  //         } else {
  //             fail('timeout of ' + TIMEOUT + 'ms occurred while fetching resource: ' + url);
  //         }
  //     }

  //     function fail(message) {
  //         console.error(message);
  //         resolve('');
  //     }
  // });
}

function dataAsUrl(content: string, type: string) {
  return "data:" + type + ";base64," + content;
}

function escape(string: string) {
  return string.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
}

function isChrome() {
  return /chrome/i.test(navigator.userAgent);
}

function isSafari() {
  return /safari/i.test(navigator.userAgent);
}

function delay(ms: number) {
  return <T>(arg: T): Promise<T> => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(arg);
      }, ms);
    });
  };
}

function asArray<T>(arrayLike: ArrayLike<T>): T[] {
  const array = [];
  const length = arrayLike.length;
  for (let i = 0; i < length; i++) {
    array.push(arrayLike[i]);
  }
  return array;
}

function escapeXhtml(string: string) {
  return string.replace(/#/g, "%23").replace(/\n/g, "%0A");
}

function width(node: HTMLElement) {
  const leftBorder = px(node, "border-left-width");
  const rightBorder = px(node, "border-right-width");
  return node.scrollWidth + leftBorder + rightBorder;
}

function height(node: HTMLElement) {
  const topBorder = px(node, "border-top-width");
  const bottomBorder = px(node, "border-bottom-width");
  return node.scrollHeight + topBorder + bottomBorder;
}

function px(node: HTMLElement, styleProperty: string) {
  const value = window.getComputedStyle(node).getPropertyValue(styleProperty);
  return parseFloat(value.replace("px", ""));
}

function isSrcAsDataUrl(text: string) {
  const DATA_URL_REGEX = /url\(['"]?(data:)([^'"]+?)['"]?\)/;
  return text.search(DATA_URL_REGEX) !== -1;
}

export default {
  escape,
  parseExtension,
  mimeType,
  dataAsUrl,
  isDataUrl,
  canvasToBlob,
  resolveUrl,
  getAndEncode,
  delay,
  asArray,
  isChrome,
  isSafari,
  escapeXhtml,
  makeImage,
  width,
  height,
  uid: uid(),
  isSrcAsDataUrl,
};
