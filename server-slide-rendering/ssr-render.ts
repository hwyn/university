import e, { Request, Response } from 'express';
import fs from 'fs';
import NativeModule from 'module';
import fetch, { RequestInit } from 'node-fetch';
import path from 'path';
import vm from 'vm';

const vmModules: { [key: string]: any } = {
  querystring: require('querystring'),
  stream: require('stream')
};

export class SsrRender {
  private code!: string;
  private _compiledWrapp!: any;
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';
  private staticDir = this.isDevelopment ? '../src/app/assets' : './client';

  constructor(private port: number, private serverDir: string, private entryPath: string) { }

  private get global() {
    return {
      fetch: this.proxyFetch.bind(this),
      readStaticFile: this.readStaticFile.bind(this),
      readAssets: this.readAssets.bind(this)
    };
  }

  private proxyFetch(url: string, init?: RequestInit) {
    return fetch(`http://127.0.0.1:${this.port}/${url.replace(/^[\/]+/, '')}`, init).then((res) => {
      const { status, statusText } = res;
      if (![404, 504].includes(status)) {
        return res;
      }
      throw new Error(`${status}: ${statusText}`);
    });
  }

  private readHtmlTemplate() {
    let template = fs.readFileSync(path.join(this.serverDir, `${this.staticDir}/index.html`), 'utf-8');
    if (this.isDevelopment) {
      const { js } = this.readAssets();
      const hotResource = js.map((src: string) => `<script defer src="${src}"></script>`).join('');
      const rex = `<!-- inner-style -->`;
      template = template.replace(rex, `${hotResource}${rex}`);
    }
    return template;
  }

  private readStaticFile(url: string) {
    return fs.readFileSync(path.join(this.serverDir, `${this.staticDir}/${url}`), 'utf-8');
  }

  private factoryVmScript() {
    try {
      this.code = fs.readFileSync(this.entryPath, 'utf-8');
      const wrapper = NativeModule.wrap(this.code);
      const script = new vm.Script(wrapper, { filename: 'server-entry.js', displayErrors: true });
      const context = vm.createContext({ Buffer, process, console, setTimeout, setInterval });
      this._compiledWrapp = script.runInContext(context);
    } catch (e) {
      console.log(e);
    }
  }

  private readAssets() {
    const assetsResult = fs.readFileSync(path.join(this.serverDir, '/client/static/assets.json'), 'utf-8');
    const { entrypoints = {} } = JSON.parse(assetsResult);
    const staticAssets: any = { js: [], css: [] };
    Object.keys(entrypoints).forEach((key: string) => {
      const { js = [], css = [] } = entrypoints[key].assets as { js: string[], css: string[] };
      staticAssets.js.push(...js);
      staticAssets.css.push(...css);
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
    const { html, styles, css, js, fetchData, microFetchData } = await this._render(request, true);
    microFetchData.push({ microName: 'micro', source: fetchData });
    response.json({ html, styles, css, js, microFetchData });
  }

  public async render(request: Request, response: Response) {
    const { html, styles, css = [], fetchData, microFetchData = [] } = await this._render(request);
    const _fetchData = `<script id="fetch-static">var serverFetchData = ${fetchData}</script>`;
    const microData = `<script id="micro-fetch-static">var microFetchData = ${JSON.stringify(microFetchData)}</script>`;
    const microCss = css.map((href: string) => `<link href="${href}" rel="styleSheet" type="text/css">`).join('');
    const _html = this.readHtmlTemplate()
      .replace('<!-- inner-html -->', html)
      .replace('<!-- inner-style -->', `${styles}${microCss}${_fetchData}${microData}`);
    response.send(_html);
  }
}
