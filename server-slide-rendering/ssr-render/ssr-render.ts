import { Request, Response } from 'express';
import fs from 'fs';
import { Module as NativeModule } from 'module';
import fetch, { RequestInit } from 'node-fetch';
import path from 'path';
import vm from 'vm';
import { ProxyMicroUrl, SSROptions } from './type-api';
import { vmRequire } from './vm-modules';

export class SSRRender {
  private host: string;
  private microName: string;
  private _compiledRender!: any;
  private assetFile: string;
  private staticDir: string;
  private ssrMicroPath?: ProxyMicroUrl;
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';

  constructor(private entryFile: string, options: SSROptions) {
    const { assetFile, staticDir, microName, proxyTarget = 'http://127.0.0.1:3000', ssrMicroPath } = options;
    this.assetFile = assetFile;
    this.staticDir = staticDir;
    this.microName = microName || '';
    this.host = proxyTarget;
    this.ssrMicroPath = ssrMicroPath;
  }

  private get global() {
    return {
      proxyHost: this.host,
      ssrMicroPath: this.ssrMicroPath,
      fetch: this.proxyFetch.bind(this),
      readStaticFile: this.readStaticFile.bind(this),
      readAssets: this.readAssets.bind(this)
    };
  }

  private proxyFetch(url: string, init?: RequestInit) {
    const _url = /http|https/.test(url) ? url : `${this.host}/${url.replace(/^[\/]+/, '')}`;
    return fetch(_url, init).then((res) => {
      const { status, statusText } = res;
      if (![404, 504].includes(status)) {
        return res;
      }
      throw new Error(`${status}: ${statusText}`);
    });
  }

  private readHtmlTemplate() {
    let template = fs.readFileSync(path.join(this.staticDir, 'index.html'), 'utf-8');
    if (this.isDevelopment) {
      const { js } = this.readAssets();
      const hotResource = js.map((src: string) => `<script defer src="${src}"></script>`).join('');
      const rex = `<!-- inner-style -->`;
      template = template.replace(rex, `${hotResource}${rex}`);
    }
    return template;
  }

  private readStaticFile(url: string) {
    return fs.readFileSync(path.join(this.staticDir, url), 'utf-8');
  }

  private readAssets() {
    const assetsResult = fs.readFileSync(this.assetFile, 'utf-8');
    const { entrypoints = {} } = JSON.parse(assetsResult);
    const staticAssets: any = { js: [], links: [], linksToStyle: [] };
    Object.keys(entrypoints).forEach((key: string) => {
      const { js = [], css = [] } = entrypoints[key].assets as { js: string[], css: string[] };
      staticAssets.js.push(...js);
      staticAssets.links.push(...css);
    });
    return staticAssets;
  }

  private factoryVmScript() {
    const m: any = { exports: {}, require: vmRequire };
    const wrapper = NativeModule.wrap(fs.readFileSync(this.entryFile, 'utf-8'));
    const script = new vm.Script(wrapper, { filename: 'server-entry.js', displayErrors: true });
    const context = vm.createContext({ Buffer, process, console, setTimeout, setInterval });
    const compiledWrapper = script.runInContext(context);
    compiledWrapper(m.exports, m.require, m);
    this._compiledRender = m.exports.render;
  }

  private async _render(request: Request, isMicro?: boolean) {
    try {
      const m: any = { exports: {}, require: vmRequire };
      if (this.isDevelopment || !this._compiledRender) {
        this.factoryVmScript();
      }
      return await this._compiledRender({ ...this.global, request }, isMicro);
    } catch (e: any) {
      console.log(e);
      return { html: e.message, styles: '' };
    }
  }

  private createScriptTemplate(scriptId: string, insertInfo: string) {
    return `<script id="${scriptId}">${insertInfo}(function(){ const script = document.querySelector('#${scriptId}');script.parentNode.removeChild(script);}());</script>`;
  }

  public async renderMicro(request: Request, response: Response) {
    const { html, styles, links, js, fetchData, microTags, microFetchData = [] } = await this._render(request, true);
    microFetchData.push({ microName: this.microName, source: fetchData });
    response.json({ html, styles, links, js, microTags, microFetchData });
  }

  public async render(request: Request, response: Response) {
    const { html, styles, fetchData, microTags = [], microFetchData = [] } = await this._render(request);
    const _fetchData = this.createScriptTemplate('fetch-static', `var fetchCacheData = ${fetchData};`);
    const microData = this.createScriptTemplate('micro-fetch-static', `var microFetchData = ${JSON.stringify(microFetchData)};`);
    const _html = this.readHtmlTemplate()
      .replace('<!-- inner-html -->', html)
      .replace('<!-- inner-style -->', `${styles}${_fetchData}${microData}${microTags.join('')}`);
    response.send(_html);
  }
}
