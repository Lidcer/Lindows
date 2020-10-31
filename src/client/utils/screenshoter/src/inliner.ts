import util from "./util";
import { Options } from "./options";

const URL_REGEX = /url\(['"]?([^'"]+?)['"]?\)/g;

function shouldProcess(string: string) {
  return string.search(URL_REGEX) !== -1;
}

function readUrls(string: string): string[] {
  const result = [];
  let match: RegExpExecArray | null;
  while ((match = URL_REGEX.exec(string)) !== null) {
    result.push(match[1]);
  }
  return result.filter(url => {
    return !util.isDataUrl(url);
  });
}

async function inline(string: string, url: string, baseUrl: string, get: string, options: Options) {
  baseUrl = baseUrl ? util.resolveUrl(url, baseUrl) : url;
  const data = get || (await util.getAndEncode(url, options));
  const dataUrl = util.dataAsUrl(data, util.mimeType(url));
  const result = string.replace(urlAsRegex(url), "$1" + dataUrl + "$3");
  return result;

  function urlAsRegex(url: string) {
    return new RegExp("(url\\(['\"]?)(" + util.escape(url) + ")(['\"]?\\))", "g");
  }
}

async function inlineAll(string: string, baseUrl?: string, get?: string, options?: Options): Promise<string> {
  if (nothingToInline() || util.isSrcAsDataUrl(string)) {
    return string;
  }
  const urls = readUrls(string);

  let result = "";
  for (const url of urls) {
    result += await inline(string, url, baseUrl, get, options);
  }

  function nothingToInline() {
    return !shouldProcess(string);
  }

  return result;
}

export default {
  inlineAll,
  shouldProcess,
};
