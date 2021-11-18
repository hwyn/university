import { HttpClient } from '@university/common';
import { getProvider } from '@university/di';
import { MICRO_MANAGER } from '@university/font-end-micro/token';
import { MicroStoreInterface } from '@university/font-end-micro/types';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaticAssets } from '../load-assets/load-assets';

declare const microFetchData: any[];

export class MicroStore implements MicroStoreInterface {
  private http = getProvider(HttpClient);
  private mountedList: any[] = [];
  private _renderMicro!: (...args: any[]) => any;
  public isFirstMounted = true;

  constructor(private microName: string, private staticAssets: StaticAssets) { }

  private getMicroStaticData() {
    const microStaticNode = document.querySelector('#micro-fetch-static');
    if (microStaticNode) {
      document.head.removeChild(microStaticNode);
    }
    if (typeof microFetchData !== 'undefined') {
      const microData = microFetchData.find(({ microName }) => microName === this.microName);
      return microData ? JSON.parse(microData.source) : {};
    }
  }

  public exceJavascript(): Observable<MicroStore> {
    const { javascript } = this.staticAssets;
    return forkJoin(javascript.map((src: string) => this.http.getText(src))).pipe(
      map((sources: string[]) => {
        const common: any = { render: () => void (0), serverFetchData: this.getMicroStaticData() };
        // tslint:disable-next-line:function-constructor
        sources.forEach((source: string) => new Function('common', source)(common));
        this._renderMicro = common.render;
        return this;
      })
    );
  }

  public async onMounted(container: HTMLElement, options?: any): Promise<any> {
    const ownerDocument = container.ownerDocument;
    const _options = { ...options, microManage: getProvider(MICRO_MANAGER) };
    const unRender = await this._renderMicro(container, _options);
    this.mountedList.push({ unRender, container, document: ownerDocument });
    this.isFirstMounted = false;
    return unRender;
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
}
