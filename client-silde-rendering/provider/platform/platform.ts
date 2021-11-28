import { getProvider, Injector, LOCAL_STORAGE, Provider, StaticInjector } from '@di';
import { FETCH_TOKEN, IS_MICRO, MICRO_MANAGER } from '@university/token';
import { LocatorStorage } from '@university/provider/local-storage/local-storage.service';
import { cloneDeep } from 'lodash';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { APPLICATION_CONTAINER, INSERT_STYLE_CONTAINER, RENDER_SSR, RESOURCE_TOKEN } from '../../token';

export type Render = (...args: any[]) => Promise<(container: HTMLElement) => void>;

declare const microStore: any;
declare const fetchCacheData: any;

export class Platform {
  private rootInjector: Injector = getProvider(Injector as any);
  private cacheObject: Map<string, Map<string, Observable<object>>> = new Map();

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
    const injector = new StaticInjector(this.rootInjector, { isScope: 'self' });
    const _providers: Provider[] = [
      ...this.providers,
      { provide: RENDER_SSR, useValue: true },
      { provide: IS_MICRO, useValue: this.isMicro },
      { provide: LOCAL_STORAGE, useClass: LocatorStorage },
      { provide: FETCH_TOKEN, useValue: this.proxyFetch() },
      { provide: INSERT_STYLE_CONTAINER, useValue: document.head },
      { provide: RESOURCE_TOKEN, useFactory: this.factoryResourceCache.bind(this, 'file-static') },
      ...providers
    ];
    _providers.forEach((provider) => injector.set(provider.provide, provider));

    return injector;
  }

  private proxyFetch() {
    return (input: RequestInfo, init?: RequestInit) => fetch.apply(window, [input, init]);
  }

  private factoryResourceCache(type?: string) {
    if (!type || this.cacheObject.has(type)) {
      return type && this.cacheObject.get(type) || new Map();
    }

    const resourceObj = this.resource;
    const cacheResource = new Map();
    Object.keys(resourceObj).forEach((key) => {
      const { source, type: sourceType } = resourceObj[key];
      if (sourceType === type) {
        cacheResource.set(key, of(source).pipe(map(cloneDeep)));
      }
    });
    this.cacheObject.set(type, cacheResource);
    return cacheResource;
  }

  private get isMicro() {
    return typeof microStore !== 'undefined';
  }

  private get resource() {
    return typeof fetchCacheData !== 'undefined' ? fetchCacheData : {};
  }
}
