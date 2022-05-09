import { MicroManageInterface, MicroStoreInterface } from '@shared/micro';

import { StaticAssets } from '../load-assets/load-assets';

export class MicroStore implements MicroStoreInterface {
  private mountedList: any[] = [];
  private loaderStyleNodes: HTMLStyleElement[] = [];
  private execMountedList: [HTMLElement, any][] = [];
  private _renderMicro!: (...args: any[]) => Promise<any>;

  constructor(private microName: string, private staticAssets: StaticAssets, private microManage: MicroManageInterface) {
    this.microManage.loaderStyleSubject?.subscribe(this.headAppendChildProxy.bind(this));
  }

  public async onMounted(container: HTMLElement, options?: any): Promise<any> {
    this.execMountedList.push([container, options]);
    if (!this._renderMicro) {
      await this.loadScriptContext();
    }
    if (this.execMountedList.length === 1) {
      await this.execMounted();
    }
  }

  public async unMounted(container: HTMLElement) {
    const [exMicroInfo] = this.mountedList.filter(({ container: _container }: any) => container === _container);
    if (exMicroInfo) {
      this.mountedList.splice(this.mountedList.indexOf(exMicroInfo), 1);
      await exMicroInfo.unRender(container.shadowRoot?.querySelector('[data-app="body"]'));
    }
  }

  private async execMounted() {
    const [container, options] = <[HTMLElement, any]>this.execMountedList.shift();
    const unRender = await this._renderMicro(this.parseRenderOptions(container, options));
    this.mountendAppendLoadStyleNode(container);
    this.mountedList.push({ unRender, container });
    if (this.execMountedList.length !== 0) {
      await this.execMounted();
    }
  }

  private execJavascript(execFunctions: any[]): () => Promise<any> {
    const { fetchCacheData } = this.staticAssets;
    const microStore: any = { render: (): any => void (0) };
    execFunctions.forEach((fun: any) => fun(microStore, fetchCacheData));
    return microStore.render;
  }

  private parseRenderOptions(container: HTMLElement, options: { [key: string]: any } = {}) {
    const head = container.shadowRoot?.querySelector('[data-app="head"]');
    const body = container.shadowRoot?.querySelector('[data-app="body"]');
    return { ...options, head, body, microManage: this.microManage };
  }

  private headAppendChildProxy(styleNode: HTMLStyleElement) {
    if (styleNode.getAttribute('data-micro') === this.microName) {
      this.loaderStyleNodes.push(styleNode);
      this.mountedList.forEach(({ container }: any) => this.mountendAppendLoadStyleNode(container, [styleNode]));
    }
  }

  private mountendAppendLoadStyleNode(container: HTMLElement, styleNodes: HTMLStyleElement[] = this.loaderStyleNodes) {
    const styleContainer = container.shadowRoot?.querySelector('[data-app="head"]');
    if (styleContainer) {
      styleNodes.forEach((styleNode) => styleContainer.appendChild(styleNode.cloneNode(true)));
    }
  }

  private async loadScriptContext() {
    const { script, javascript } = this.staticAssets;
    return Promise.all(script.map((source: string, index) => {
      const hasSourceMap = !/[\S]+\.[\S]+\.js$/.test(javascript[index]);
      const sourceCode = this.formatSourceCode(source);
      // eslint-disable-next-line no-new-func
      return hasSourceMap ? this.loadBlobScript(sourceCode) : Promise.resolve(new Function('microStore', 'fetchCacheData', sourceCode));
    })).then((execFunctions: any[]) => this._renderMicro = this.execJavascript(execFunctions));
  }

  private async loadBlobScript(source: string) {
    return new Promise(resolve => {
      const funName = `anonymous${Math.random().toString().replace(/0.([\d]{5})\d*/ig, '$1')}`;
      const script = document.createElement('script');
      script.src = URL.createObjectURL(new Blob([`window.${funName}=function(microStore, fetchCacheData){ ${source}\n}`]));
      document.body.appendChild(script);
      script.onload = () => resolve((window as any)[funName]);
    });
  }

  protected formatSourceCode(source: string) {
    return `${source}\n`;
  }
}
