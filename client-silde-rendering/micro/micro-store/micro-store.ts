import { HttpClient } from '@university/common';
import { getProvider } from '@university/di';
import { MICRO_MANAGER } from '@university/font-end-micro/token';
import { MicroStoreInterface } from '@university/font-end-micro/types';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaticAssets } from '../load-assets/load-assets';

export class MicroStore implements MicroStoreInterface {
  private http = getProvider(HttpClient);
  private mountedList: any[] = [];
  private _renderMicro!: (...args: any[]) => any;

  constructor(private microName: string, private staticAssets: StaticAssets) { }

  public async onMounted(container: HTMLElement, options?: any): Promise<any> {
    const ownerDocument = container.ownerDocument;
    const _options = { ...options, microManage: getProvider(MICRO_MANAGER) };
    const unRender = await this._renderMicro(container, _options);
    this.mountedList.push({ unRender, container, document: ownerDocument });
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

  public exceJavascript(): Observable<MicroStore> {
    const { javascript, fetchCacheData } = this.staticAssets;
    return forkJoin(javascript.map((src: string) => this.http.getText(src))).pipe(
      map((sources: string[]) => {
        const microStore: any = { render: () => void (0) };
        sources.forEach((source: string) => {
          // tslint:disable-next-line:function-constructor
          new Function('microStore', 'fetchCacheData', source)(microStore, fetchCacheData);
        });
        this._renderMicro = microStore.render;
        return this;
      })
    );
  }
}
