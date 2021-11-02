import fs from 'fs';
import vm from 'vm';
import path from 'path';
import NativeModule from 'module';
import { of } from 'rxjs';
import { Request, Response } from 'express';

export class SsrRender {
  private code!: string;
  private _compiledWrapp!: any;
  private serverSources: { [key: string]: any } = {};
  private currentPageSource: { [key: string]: any } = {};
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';
  private staticDir = this.isDevelopment ? '../src/app/assets' : './client';
  private _location: any = { pathname: '/', search: '?' };
  private vmModules: { [key: string]: any } = {
    querystring: require('querystring'),
    stream: require('stream'),
    buffer: require('buffer'),
    events: require('events'),
    util: require('util')
  };

  constructor(private serverDir: string, private path: string) { }

  private get global() {
    return {
      location: this._location,
      readHtmlTemplate: this.readHtmlTemplate.bind(this),
      getServerFetchData: this.getServerFetchData.bind(this),
      readFileStatic: this.readFileStatic.bind(this)
    }
  }

  private getServerFetchData() {
    return JSON.stringify(this.currentPageSource);
  }

  private readHtmlTemplate() {
    let template = fs.readFileSync(path.join(this.serverDir, `${this.staticDir}/index.html`), 'utf-8');
    if (this.isDevelopment) {
      const hotResource = `<script defer src="/javascript/main.js"></script>`;
      const rex = `<meta name="inner-style">`;
      template = template.replace(rex, `${hotResource}${rex}`);
    }
    return template;
  }

  private readFileStatic(url: string) {
    let fileCache = this.serverSources[url];
    if (!fileCache) {
      const source = fs.readFileSync(path.join(this.serverDir, `${this.staticDir}/${url}`), 'utf-8');
      fileCache = { type: 'fileStatic', source: JSON.parse(source) };
      this.serverSources[url] = fileCache;
    }
    this.currentPageSource[url] = fileCache;
    return of(fileCache.source);
  }

  private factoryVmScript() {
    try {
      this.code = fs.readFileSync(this.path, 'utf-8');
      const wrapper = NativeModule.wrap(this.code);
      const script = new vm.Script(wrapper, { filename: 'server-entry.js', displayErrors: true });
      const context = vm.createContext({ Buffer, process, console, setTimeout, setInterval });
      this._compiledWrapp = script.runInContext(context);
    } catch (e) {
      console.log(e);
    }
  }

  public async render(request: Request, response: Response) {
    this._location = { pathname: request.path, search: '?' };
    let html = '';
    try {
      const m: any = { exports: {}, require: (path: string) => this.vmModules[path] };
      (this.isDevelopment || !this._compiledWrapp) && this.factoryVmScript();
      this.currentPageSource = {};
      this._compiledWrapp(m.exports, m.require, m);
      html = await m.exports.render(this.global);
    } catch (e) {
      console.log(e);
    }
    response.send(html);
  }
}
