import { Injectable, Injector, LOCAL_STORAGE, registryProvider } from '@di';
import { IS_MICRO, MICRO_MANAGER } from '@font-end-micro/token';
import { FETCH_TOKEN, RENDER_SSR } from '@university/common/token';
import { LocatorStorage } from '@university/provider/services';
import { APPLICATION_CONTAINER, INSERT_STYLE_CONTAINER, RESOURCE_TOKEN } from '../../token';

export type Render = (...args: any[]) => Promise<(container: HTMLElement) => void>;

declare const microStore: any;
declare const fetchCacheData: any;

@Injectable()
export class Platform {
  constructor(private injector: Injector) {
    registryProvider([
      { provide: RENDER_SSR, useValue: true },
      { provide: IS_MICRO, useValue: this.isMicro },
      { provide: LOCAL_STORAGE, useClass: LocatorStorage },
      { provide: FETCH_TOKEN, useValue: this.proxyFetch() },
      { provide: RESOURCE_TOKEN, useValue: this.resource },
      { provide: INSERT_STYLE_CONTAINER, useValue: document.head }
    ]);
  }

  bootstrapRender(render: Render) {
    !this.isMicro ? render() : microStore.render = this.proxyRender.bind(this, render);
  }

  private async proxyRender(render: Render, container: HTMLElement, options: any) {
    const { microManage, ..._options } = options;
    const head = container.shadowRoot?.querySelector('[data-app="head"]') || document.head;
    const shadowContainer = container.shadowRoot?.querySelector('[data-app="body"]');
    this.injector.set(APPLICATION_CONTAINER, { provide: APPLICATION_CONTAINER, useValue: shadowContainer });
    registryProvider([
      { provide: MICRO_MANAGER, useValue: microManage },
      { provide: INSERT_STYLE_CONTAINER, useValue: head }
    ]);
    return render(this.injector, _options);
  }

  private proxyFetch() {
    return (input: RequestInfo, init?: RequestInit) => fetch.apply(window, [input, init]);
  }

  private get isMicro() {
    return typeof microStore !== 'undefined';
  }

  private get resource() {
    return typeof fetchCacheData !== 'undefined' ? fetchCacheData : {};
  }
}
