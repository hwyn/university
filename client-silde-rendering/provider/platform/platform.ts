import { getProvider, Injector, LOCAL_STORAGE, Provider, StaticInjector } from '@di';
import { IS_MICRO, MICRO_MANAGER } from '@font-end-micro/token';
import { FETCH_TOKEN, RENDER_SSR } from '@university/common/token';
import { LocatorStorage } from '@university/provider/services/local-storage/local-storage.service';
import { APPLICATION_CONTAINER, INSERT_STYLE_CONTAINER, RESOURCE_TOKEN } from '../../token';

export type Render = (...args: any[]) => Promise<(container: HTMLElement) => void>;

declare const microStore: any;
declare const fetchCacheData: any;

export class Platform {
  constructor(private providers: Provider[]) { }

  bootstrapRender(render: Render) {
    !this.isMicro ? render(this.beforeBootstrapRender()) : microStore.render = this.proxyRender.bind(this, render);
  }

  private async proxyRender(render: Render, container: HTMLElement, options: any) {
    const { microManage, ..._options } = options;
    const head = container.shadowRoot?.querySelector('[data-app="head"]') || document.head;
    const shadowContainer = container.shadowRoot?.querySelector('[data-app="body"]');
    const injector = this.beforeBootstrapRender([
      { provide: MICRO_MANAGER, useValue: microManage },
      { provide: APPLICATION_CONTAINER, useValue: shadowContainer },
      { provide: INSERT_STYLE_CONTAINER, useValue: head }
    ]);
    return render(injector, _options);
  }

  private beforeBootstrapRender(providers: Provider[] = []) {
    const rootInjector = getProvider(Injector as any);
    const injector = this.isMicro ? new StaticInjector(rootInjector, { isScope: 'self' }) : rootInjector;
    const _providers: Provider[] = [
      ...this.providers,
      { provide: RENDER_SSR, useValue: true },
      { provide: IS_MICRO, useValue: this.isMicro },
      { provide: LOCAL_STORAGE, useClass: LocatorStorage },
      { provide: FETCH_TOKEN, useValue: this.proxyFetch() },
      { provide: RESOURCE_TOKEN, useValue: this.resource },
      { provide: INSERT_STYLE_CONTAINER, useValue: document.head },
      ...providers
    ];
    _providers.forEach((provider) => injector.set(provider.provide, provider));

    return injector;
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
