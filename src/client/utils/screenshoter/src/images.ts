import util from "./util";
import inliner from "./inliner";
import { HTMLNode } from "./interfaces";
import { Options } from "./options";

async function newImage(element: HTMLImageElement, options: Options, get?: (url: string) => string) {
  if (util.isDataUrl(element.src)) return;
  const data = get ? get(element.src) : await util.getAndEncode(element.src, options);
  const dataUrl = util.dataAsUrl(data, util.mimeType(element.src));
  return new Promise<HTMLImageElement>(resolve => {
    const justResolve = () => {
      resolve(element);
      element.removeEventListener("load", justResolve);
    };
    element.addEventListener("load", justResolve);
    // for any image with invalid src(such as <img src />), just ignore it
    element.addEventListener("error", justResolve);
    element.src = dataUrl;
  });
}

async function fromVideoToImage(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataURL = canvas.toDataURL();
  const img = document.createElement("img");
  img.src = dataURL;
  img.style.cssText = video.style.cssText;
  const parent = video.parentElement;
  parent.removeChild(video);
  parent.appendChild(img);
  return img;
}

async function inlineAll(node: HTMLNode, options: Options): Promise<HTMLNode | HTMLNode[]> {
  const inlineBackground = async (node: HTMLElement) => {
    const background = node.style.getPropertyValue("background");
    if (!background) return node;
    const inlined = await inliner.inlineAll(background, undefined, undefined, options);
    node.style.setProperty("background", inlined, node.style.getPropertyPriority("background"));
    return node;
  };

  if (!(node instanceof Element)) {
    return node;
  }
  await inlineBackground(node);

  if (node instanceof HTMLImageElement) {
    return await newImage(node, options);
  } else if (node instanceof HTMLVideoElement) {
    return await fromVideoToImage(node);
  } else {
    const childNodesArray = util.asArray(node.childNodes);
    for (const child of childNodesArray) {
      await inlineAll(child, options);
    }
    return childNodesArray;
  }
}

export default { inlineAll };
