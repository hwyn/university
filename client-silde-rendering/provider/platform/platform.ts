import { getProvider, Injectable, LOCAL_STORAGE, LocatorStorageImplements, registryProvider } from '@di';
import { FETCH_TOKEN, RENDER_SSR } from '@university/common/token';
import { IS_MICRO, MICRO_MANAGER } from '@university/font-end-micro/token';
import { LocatorStorage } from '@university/provider/services';
import { INSERT_STYLE_CONTAINER, RESOURCE_TOKEN } from '../../token';

type Render = (...args: any[]) => Promise<(container: HTMLElement) => void>;

declare const common: any;
declare const serverFetchData: any;

@Injectable()
export class Platform {
  private ls!: LocatorStorageImplements;
  constructor() {
    registryProvider([
      { provide: IS_MICRO, useValue: this.isMicro },
      { provide: LOCAL_STORAGE, useClass: LocatorStorage },
      { provide: FETCH_TOKEN, useValue: fetch.bind(window) },
      { provide: RESOURCE_TOKEN, useValue: this.resource },
      { provide: INSERT_STYLE_CONTAINER, useValue: document.head }
    ]);
    this.ls = getProvider<LocatorStorageImplements>(LOCAL_STORAGE);
    this.resourceExtraction();
  }

  bootstrapRender(render: Render) {
    this.isMicro ? common.render = this.proxyRender.bind(this, render) : render();
  }

  private async proxyRender(render: Render, container: HTMLElement, options: any) {
    const { microManage, ..._options } = options;
    const head = container.shadowRoot?.querySelector('[data-app="head"]');
    registryProvider([
      { provide: RENDER_SSR, useValue: true },
      { provide: MICRO_MANAGER, useValue: microManage },
      { provide: INSERT_STYLE_CONTAINER, useValue: head || document.head }
    ]);
    return render(container.shadowRoot?.querySelector('[data-app="body"]'), _options);
  }

  private resourceExtraction() {
    const fetchElement = document.querySelector('#fetch-static');
    if (fetchElement) {
      document.head.removeChild(fetchElement);
    }
  }

  private get isMicro() {
    return typeof common !== 'undefined';
  }

  private get resource() {
    if (this.isMicro) {
      return common.serverFetchData || {};
    }
    return typeof serverFetchData !== 'undefined' ? serverFetchData : {};
  }
}
