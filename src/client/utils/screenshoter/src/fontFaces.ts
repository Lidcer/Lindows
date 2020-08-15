import util from './util';
import inliner from './inliner';import { Options } from './options';


const brokenStyleSheets = new Set<string>(); 
const fontCache = new Map<string,string>();
const fontBlocked = new Set<string>(); 
const fontCache2 = new Map<string,string>();

async function resolveAll(options: Options) {
    const fonts = await readAll(options);
    let cssStrings = '';
    for (const font of fonts) {
        let cssString = fontCache.get(font.src()); 
        if(!cssString){
            cssString = await font.resolve();
        }
        cssStrings += `${cssString}\n`;
    }
    return cssStrings;
}

async function readAll(options: Options) {
    const selectWebFontRules = (cssRules: CSSRule[]) => {
        return cssRules
            .filter((rule) => {
                return rule.type === CSSRule.FONT_FACE_RULE;
            })
            .filter((rule) => {
                //@ts-ignore 
                const style = rule.style;
                if (style) {
                    return inliner.shouldProcess(style.getPropertyValue('src'));
                }
                return false;
            });
    }

    const loadExternalStyleSheets = async (styleSheets:CSSStyleSheet[], options: Options) => {
        const setBaseHref = (base: string) => {
            if (base.endsWith('/')){
                base = base.slice(0, -1);
            }

            function resolveURL(url:string, base?:any): string {

                if('string' !== typeof url || !url){
                    return null; // wrong or empty url
                } else if(url.match(/^[a-z]+\:\/\//i)){
                    return url; // url is absolute already
                } else if(url.match(/^\/\//)){
                    return 'http:'+url; // url is absolute already
                } else if(url.match(/^[a-z]+\:/i)){
                    return url; // data URI, mailto:, tel:, etc.
                } else if('string' !== typeof base){
                    const a = document.createElement('a');
                    a.href = url; // try to resolve url without base

                    if (!a.pathname) {
                        return null; // url not valid
                    }

                    return `http://${url}`;
                } else {
                    if (resolveURL(base) === null){ // check base
                        return null; // wrong base
                    }
                }

                const a = document.createElement('a');
                a.href = base;

                let baseSplit = [];
                if (url[0] !== '/') {
                    baseSplit = a.pathname.split('/'); // relative path
                    baseSplit.pop();
                }

                const urlSplit = url.split('/');
                for (let  i = 0; i < urlSplit.length; ++i){
                    if (urlSplit[i] === '.') { // current directory
                        continue;
                    }

                    if (urlSplit[i] === '..') { // parent directory
                        if ('undefined' === typeof baseSplit.pop() || baseSplit.length === 0) {
                            return null; // wrong url accessing non-existing parent directories
                        }
                    } else { // child directory
                        baseSplit.push(urlSplit[i]);
                    }
                }
                return `${a.protocol}//${a.hostname}${baseSplit.join('/')}`;
            }

            const addBaseHrefToUrl = (_: string, p1: string) => {
                const url = /^http/i.test(p1) ? p1 : resolveURL(p1, base);
                return `url(\'${url}\');`
            }

            return (text: string) => {
                return util.isSrcAsDataUrl(text) ? text : text.replace(
                    /url\(['"]?([^'"]+?)['"]?\)/g, addBaseHrefToUrl
                );
            };
        }

        const toStyleSheet = (text: string) => {
            const doc = document.implementation.createHTMLDocument('');
            const styleElement = document.createElement('style');
            styleElement.textContent = text;
            doc.body.appendChild(styleElement);
            return styleElement.sheet;
        }
        
        const processedStyleSheets: CSSStyleSheet[] = [];
        for (const sheet of styleSheets) {

            if (!sheet.href) {
                processedStyleSheets.push(sheet);
                continue;
            }
            if(fontBlocked.has(sheet.href)){
                processedStyleSheets.push(sheet);
                continue;
            }

            try {
                let css = '';
                if (options.cache) {
                    css = fontCache.get(sheet.href);
                }
                if (!css) {
                    const result = await fetch(sheet.href);
                    if (result.status !== 200) {
                        if (options.verbose) {
                            console.error(`Request for stylesheet ${sheet.href} result in error code ${result.status}`);
                        }
                        if (options.cache) {
                            fontBlocked.add(sheet.href);
                        }

                        processedStyleSheets.push(sheet);
                    }
                    const text = await result.text(); 
                    css = setBaseHref(sheet.href)(text);
                }
                fontCache.set(sheet.href,css);
                const fontSheet = toStyleSheet(css);
                processedStyleSheets.push(sheet);
                processedStyleSheets.push(fontSheet);
                
            } catch (error) {
                if (options.verbose) {
                    console.error(`Request for stylesheet ${sheet.href} result in error code ${error.message}`);
                }
                if (options.cache) {
                    fontBlocked.add(sheet.href);
                }
            }
        }

        return processedStyleSheets;
    }


    const getCssRules = (styleSheets: CSSStyleSheet[]) => {
        const cssRules: CSSRule[] = [];
        for (const sheet of styleSheets) {
            try {
                if(brokenStyleSheets.has(sheet.href)) {
                    continue;
                }
                if (sheet.cssRules && typeof sheet.cssRules === 'object') {
                    const cssRulesArray = util.asArray(sheet.cssRules || []);
                    for (const cssRule of cssRulesArray) {
                        cssRules.push(cssRule);
                    }
                }
            } catch (error) {
                brokenStyleSheets.add(sheet.href);
                if (options.verbose) { // some of the style sheets have blocked cssRule property
                    console.error(`Error while reading CSS rules from ${sheet.href}, ${error.toString()}. Added to ignore list`);
                }
            }
        }
        return cssRules;
    }

    const newWebFont = (webFontRule: any) => {
        return {
            resolve: () => {
                const baseUrl = (webFontRule.parentStyleSheet || {}).href;
                return inliner.inlineAll(webFontRule.cssText, baseUrl, undefined, options);
            },
            src: () => {
                return webFontRule.style.getPropertyValue('src');
            }
        };
    }

    const array = util.asArray(document.styleSheets);
    const externalStyle = await loadExternalStyleSheets(array, options);
    const cssRules = getCssRules(externalStyle as any);
    const rules = selectWebFontRules(cssRules);
    const result = rules.map(newWebFont);
    return result;
}

export default { resolveAll };

