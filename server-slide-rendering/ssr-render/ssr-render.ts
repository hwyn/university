import { Request, Response } from 'express';
import fs from 'fs';
import NativeModule from 'module';
import fetch, { RequestInit } from 'node-fetch';
import path from 'path';
import vm from 'vm';
import { ProxyMicroUrl } from './type-api';
import { vmModules } from './vm-modules';

export class SSRRender {
  private microName: string;
  private proxyMicroUrl?: ProxyMicroUrl;
  private code!: string;
  private _compiledWrapp!: any;
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';

  constructor(private port: number, private entryFile: string, private assetFile: string, private staticDir: string, options?: any) {
    this.microName = options && options.microName;
    this.proxyMicroUrl = options.proxyMicroUrl;
  }

  private get global() {
    return {
      proxyMicroUrl: this.proxyMicroUrl,
      fetch: this.proxyFetch.bind(this),
      readStaticFile: this.readStaticFile.bind(this),
      readAssets: this.readAssets.bind(this)
    };
  }

  private proxyFetch(url: string, init?: RequestInit) {
    const _url = /http|https/.test(url) ? url : `http://127.0.0.1:${this.port}/${url.replace(/^[\/]+/, '')}`;
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

  private factoryVmScript() {
    try {
      this.code = fs.readFileSync(this.entryFile, 'utf-8');
      const wrapper = NativeModule.wrap(this.code);
      const script = new vm.Script(wrapper, { filename: 'server-entry.js', displayErrors: true });
      const context = vm.createContext({ Buffer, process, console, setTimeout, setInterval });
      this._compiledWrapp = script.runInContext(context);
    } catch (e) {
      console.log(e);
    }
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

  private async _render(request: Request, isMicro?: boolean) {
    try {
      const m: any = { exports: {}, require: (modelName: string) => vmModules[modelName] };
      if (this.isDevelopment || !this._compiledWrapp) {
        this.factoryVmScript();
      }
      this._compiledWrapp(m.exports, m.require, m);
      return await m.exports.render({ ...this.global, request }, isMicro);
    } catch (e: any) {
      console.log(e);
      return { html: e.message, styles: '' };
    }
  }

  public async renderMicro(request: Request, response: Response) {
    const { html, styles, links, js, fetchData, microTags, microFetchData = [] } = await this._render(request, true);
    microFetchData.push({ microName: this.microName, source: fetchData });
    response.json({ html, styles, links, js, microTags, microFetchData });
  }

  public async render(request: Request, response: Response) {
    const { html, styles, links = [], fetchData, microTags = [], microFetchData = [] } = await this._render(request);
    const _fetchData = `<script id="fetch-static">var serverFetchData = ${fetchData}</script>`;
    const microData = `<script id="micro-fetch-static">var microFetchData = ${JSON.stringify(microFetchData)}</script>`;
    const _html = this.readHtmlTemplate()
      .replace('<!-- inner-html -->', html)
      .replace('<!-- inner-style -->', `${styles}${microTags.join('')}${_fetchData}${microData}`);
    response.send(_html);
  }
}
