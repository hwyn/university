import { Request, Response } from 'express';
import fs from 'fs';
import { createRequire, Module as NativeModule } from 'module';
import fetch, { RequestInit } from 'node-fetch';
import path from 'path';
import vm from 'vm';

import { SSROptions } from './type-api';

export class SSRRender {
  private host: string;
  private index: string;
  private microName: string;
  private manifestFile: string;
  private _compiledRender!: any;
  private vmContext: { [key: string]: any };
  private microSSRPathPrefix: string;
  private staticDir: string | ((url: string) => string);
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';

  constructor(private entryFile: string, options: SSROptions) {
    const { index, manifestFile, staticDir, microName, proxyTarget, microSSRPathPrefix } = options;
    this.index = index || '';
    this.host = proxyTarget || 'http://127.0.0.1:3000';
    this.staticDir = staticDir || '';
    this.microName = microName || '';
    this.manifestFile = manifestFile;
    this.microSSRPathPrefix = microSSRPathPrefix || '';
    this.vmContext = options.vmContext || {};
  }

  private microSSRPath(microName: string, pathname: string) {
    return `/${this.microSSRPathPrefix}/${microName}${pathname}`;
  }

  private get global() {
    return {
      proxyHost: this.host,
      microSSRPath: this.microSSRPath.bind(this),
      fetch: this.proxyFetch.bind(this),
      readStaticFile: this.readStaticFile.bind(this),
      readAssets: this.readAssets.bind(this)
    };
  }

  private proxyFetch(url: string, init?: RequestInit) {
    const _url = /http|https/.test(url) ? url : `${this.host}/${url.replace(/^[/]+/, '')}`;
    return fetch(_url, init).then((res) => {
      const { status, statusText } = res;
      if (![404, 504].includes(status)) {
        return res;
      }
      throw new Error(`${status}: ${statusText}`);
    });
  }

  private readHtmlTemplate() {
    let template = `<!-- inner-style --><!-- inner-html -->`;
    if (this.index && fs.existsSync(this.index)) {
      template = fs.readFileSync(this.index, 'utf-8');
    }

    if (this.isDevelopment) {
      const { js } = this.readAssets();
      const hotResource = js.map((src: string) => `<script defer src="${src}"></script>`).join('');
      const rex = `<!-- inner-style -->`;
      template = template.replace(rex, `${hotResource}${rex}`);
    }
    return template;
  }

  private readStaticFile(url: string) {
    let staticDir = this.staticDir;
    if (typeof staticDir === 'function') {
      staticDir = staticDir(url);
    }
    const filePath = staticDir ? path.join(staticDir, url) : '';
    return filePath && fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
  }

  private readAssets() {
    let assetsResult = '{}';
    if (this.manifestFile && fs.existsSync(this.manifestFile)) {
      assetsResult = fs.readFileSync(this.manifestFile, 'utf-8');
    }

    const entrypoints = JSON.parse(assetsResult);
    const staticAssets: any = { js: [], links: [], linksToStyle: [] };
    Object.keys(entrypoints).forEach((key: string) => {
      const { js = [], css = [] } = entrypoints[key] as { js: string[], css: string[] };
      staticAssets.js.push(...js);
      staticAssets.links.push(...css);
    });
    return staticAssets;
  }

  private factoryVmScript() {
    const m: any = { exports: {}, require: createRequire(this.entryFile) };
    const wrapper = NativeModule.wrap(fs.readFileSync(this.entryFile, 'utf-8'));
    const script = new vm.Script(wrapper, { filename: 'server-entry.js', displayErrors: true });
    const vmContext = { Buffer, process, console, setTimeout, setInterval, clearInterval, clearTimeout, ...this.vmContext };
    const context = vm.createContext(vmContext);
    const compiledWrapper = script.runInContext(context);
    compiledWrapper(m.exports, m.require, m);
    this._compiledRender = m.exports.render;
  }

  private async _render(request: Request, isMicro?: boolean) {
    try {
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
    // eslint-disable-next-line max-len
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
