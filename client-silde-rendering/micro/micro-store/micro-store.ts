import { MicroManageInterface, MicroStoreInterface } from '@shared/micro';
import { StaticAssets } from '../load-assets/load-assets';

export class MicroStore implements MicroStoreInterface {
  private execFunctions: any[];
  private mountedList: any[] = [];
  private loaderStyleNodes: HTMLStyleElement[] = [];
  private execMountedList: [HTMLElement, any][] = [];
  private _renderMicro: (...args: any[]) => Promise<any>;

  constructor(private microName: string, private staticAssets: StaticAssets, private microManage: MicroManageInterface) {
    const { script } = staticAssets;
    // eslint-disable-next-line no-new-func
    this.execFunctions = script.map((source: string) => new Function('microStore', 'fetchCacheData', source));
    this.microManage.loaderStyleSubject.subscribe(this.headAppendChildProxy.bind(this));
    this._renderMicro = this.execJavascript();
  }

  public async onMounted(container: HTMLElement, options?: any): Promise<any> {
    this.execMountedList.push([container, options]);
    if (this.execMountedList.length === 1) {
      await this.execMounted();
    }
  }

  public async unMounted(container: HTMLElement) {
    const [exMicroInfo] = this.mountedList.filter(({ container: _container }: any) => container === _container);
    if (!exMicroInfo) {
      return;
    }
    this.mountedList.splice(this.mountedList.indexOf(exMicroInfo), 1);
    const { unRender } = exMicroInfo;
    await unRender();
  }

  private async execMounted() {
    const [[container, options]] = this.execMountedList;
    const ownerDocument = container.ownerDocument;
    this.mountendAppendLoadStyleNode(container);
    const unRender = await this._renderMicro(container, this.parseRenderOptions(container, options));
    this.mountedList.push({ unRender, container, document: ownerDocument });
    this.execMountedList.shift();
    if (this.execMountedList.length !== 0) {
      await this.execMounted();
    }
  }

  private execJavascript(): (...args: any[]) => Promise<any> {
    const { fetchCacheData } = this.staticAssets;
    const microStore: any = { render: () => void (0) };
    this.execFunctions.forEach((fun: any) => fun(microStore, fetchCacheData));
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
}
