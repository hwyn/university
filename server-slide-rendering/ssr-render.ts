import { Request, Response } from 'express';
import fs from 'fs';
import NativeModule from 'module';
import path from 'path';
import { of } from 'rxjs';
import vm from 'vm';

const vmModules: { [key: string]: any } = {
  querystring: require('querystring'),
  stream: require('stream'),
  buffer: require('buffer'),
  events: require('events'),
  util: require('util')
};
export class SsrRender {
  private code!: string;
  private _compiledWrapp!: any;
  private serverSources: { [key: string]: any } = {};
  private currentPageSource: { [key: string]: any } = {};
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';
  private staticDir = this.isDevelopment ? '../src/app/assets' : './client';
  private _location: any = { pathname: '/', search: '?' };

  constructor(private serverDir: string, private entryPath: string) { }

  private get global() {
    return {
      location: this._location,
      readFileStatic: this.readFileStatic.bind(this)
    };
  }

  private getServerFetchData() {
    return (
      `<script id="fetch-static">var serverFetchData = ${JSON.stringify(this.currentPageSource)}</script>`
    );
  }

  private readHtmlTemplate() {
    let template = fs.readFileSync(path.join(this.serverDir, `${this.staticDir}/index.html`), 'utf-8');
    if (this.isDevelopment) {
      const hotResource = `<script defer src="/javascript/main.js"></script>`;
      const rex = `<!-- inner-style -->`;
      template = template.replace(rex, `${hotResource}${rex}`);
    }
    return template;
  }

  private readFileStatic(url: string) {
    let fileCache = this.serverSources[url];
    if (!fileCache) {
      const source = fs.readFileSync(path.join(this.serverDir, `${this.staticDir}/${url}`), 'utf-8');
      fileCache = { type: 'file-static', source: JSON.parse(source) };
      this.serverSources[url] = fileCache;
    }
    this.currentPageSource[url] = fileCache;
    return of(fileCache.source);
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

  private async _render(request: Request) {
    try {
      const m: any = { exports: {}, require: (modelName: string) => vmModules[modelName] };
      if (this.isDevelopment || !this._compiledWrapp) {
        this.factoryVmScript();
      }
      this.currentPageSource = {};
      this._compiledWrapp(m.exports, m.require, m);
      return await m.exports.render(this.global);
    } catch (e) {
      console.log(e);
    }
    return { html: ``, styles: `` };
  }

  public async renderMicro(request: Request, response: Response) {
    this._location = { pathname: '/', search: '?' };
    const { js, css } = this.readAssets();
    const { html, styles } = await this._render(request);
    response.json({ html, styles, js, css });
  }

  public async render(request: Request, response: Response) {
    this._location = { pathname: request.path, search: '?' };
    const { styles, html } = await this._render(request);
    const fetchData = this.getServerFetchData();
    const _html = this.readHtmlTemplate()
      .replace('<!-- inner-html -->', html)
      .replace('<!-- inner-style -->', `${styles}${fetchData}`);
    response.send(_html);
  }
}
