import { MicroManageInterface, MicroStoreInterface } from '@shared/common/micro';
import { StaticAssets } from '../load-assets/load-assets';

export class MicroStore implements MicroStoreInterface {
  private mountedList: any[] = [];
  private _renderMicro!: (...args: any[]) => Promise<any>;
  private execMountedList: [HTMLElement, any][] = [];
  private execFunctions: any[];

  constructor(private microName: string, private staticAssets: StaticAssets, private microManage: MicroManageInterface) {
    const { script } = staticAssets;
    // tslint:disable-next-line:function-constructor
    this.execFunctions = script.map((source: string) => new Function('microStore', 'fetchCacheData', source));
    this._renderMicro = this.execJavascript();
  }

  public async onMounted(container: HTMLElement, options?: any): Promise<any> {
    this.execMountedList.push([container, options]);
    if (this.execMountedList.length === 1) {
      await this.execMounted();
    }
  }

  public async unMounted(container: HTMLElement) {
    const [exMicroInfo] = this.mountedList.filter((c) => container === c.container);
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
    const _options = { ...options, microManage: this.microManage };
    const unRender = await this._renderMicro(container, _options);
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
}
