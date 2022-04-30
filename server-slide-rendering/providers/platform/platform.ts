import { getProvider, Injector, Provider, StaticInjector } from '@di';
import { APP_CONTEXT,AppContextService } from '@shared/providers/app-context';
import { JsonConfigService } from '@shared/providers/json-config';
import { HISTORY, IS_MICRO, MICRO_MANAGER } from '@shared/token';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { MicroManage } from '../../micro';
import { PROXY_HOST, READ_FILE_STATIC, REGISTRY_MICRO_MIDDER, REQUEST, SSR_MICRO_PATH } from '../../token';
import { AppContextService as ServerAppContextService } from '../app-context';
import { JsonConfigService as ServerJsonConfigService } from '../json-config';


type Render = (...args: any[]) => Promise<{ html: string, styles: string }>;
type MicroMiddleware = () => Observable<any>;

export class Platform {
  private rootInjector: Injector;
  private microMiddlewareList: MicroMiddleware[] = [];
  private staticFileSourceList: { [key: string]: any } = {};
  private currentPageFileSourceList: { [key: string]: any } = {};

  constructor(private providers: Provider[] = []) {
    this.rootInjector = getProvider(Injector as any);
  }

  bootstrapRender(render: Render): void {
    exports.render = this.proxyRender.bind(this, render);
  }

  private async proxyRender(render: Render, global: any, isMicro = false) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fetch, request, location, readAssets, readStaticFile, proxyHost, microSSRPath, ..._global } = global;
    const injector = this.beforeBootstrapRender([
      { provide: REQUEST, useValue: request },
      { provide: IS_MICRO, useValue: isMicro },
      { provide: PROXY_HOST, useValue: proxyHost },
      { provide: SSR_MICRO_PATH, useValue: microSSRPath },
      { provide: APP_CONTEXT, useValue: { fetch } },
      { provide: READ_FILE_STATIC, useValue: this.proxyReadStaticFile(readStaticFile) },
      { provide: HISTORY, useValue: { location: this.getLocation(request, isMicro), listen: () => () => void (0) } }
    ]);
    this.microMiddlewareList = [];
    this.currentPageFileSourceList = {};
    const { js = [], links = [] } = readAssets();
    const { html, styles } = await render(injector, { request, ..._global });
    const execlResult = await this.execlMicroMiddleware({ html, styles, js, links, microTags: [], microFetchData: [] });
    injector.clear();
    return { ...execlResult, fetchData: this.getStaticFileData() };
  }

  private beforeBootstrapRender(providers: Provider[] = []): Injector {
    const injector = new StaticInjector(this.rootInjector, { isScope: 'self' });
    const _providers: Provider[] = [
      ...this.providers,
      { provide: MICRO_MANAGER, useClass: MicroManage },
      { provide: REGISTRY_MICRO_MIDDER, useValue: this.registryMicroMiddleware.bind(this) },
      { provide: JsonConfigService, useClass: ServerJsonConfigService },
      { provide: AppContextService, useClass: ServerAppContextService },
      ...providers
    ];
    _providers.forEach((provider) => injector.set(provider.provide, provider));
    return injector;
  }

  private getStaticFileData() {
    return JSON.stringify(this.currentPageFileSourceList);
  }

  private proxyFetch(fetch: any) {
    return (...args: any[]) => fetch(...args);
  }

  private proxyReadStaticFile(readStaticFile: (url: string) => string) {
    return (url: string) => {
      let fileCache = this.staticFileSourceList[url];
      if (!fileCache) {
        const fileSource = readStaticFile(url) || '{}';
        fileCache = { type: 'file-static', source: JSON.parse(fileSource) };
        this.staticFileSourceList[url] = fileCache;
      }
      this.currentPageFileSourceList[url] = fileCache;
      return of(fileCache.source);
    };
  }

  private mergeMicroToSSR(middleware: MicroMiddleware) {
    return ({ html = ``, styles = ``, js = [], links = [], microTags = [], microFetchData = [] }: any) =>
      middleware().pipe(map(({ microName, microResult }) => ({
        html: html.replace(`<!-- ${microName} -->`, microResult.html),
        styles: styles + microResult.styles,
        js: js.concat(...microResult.js || []),
        links: links.concat(...microResult.links || []),
        microTags: microTags.concat(...microResult.microTags || []),
        microFetchData: microFetchData.concat(...microResult.microFetchData || [])
      })));
  }

  private execlMicroMiddleware(options: any): Promise<any> {
    return this.microMiddlewareList.reduce((input, middleware) => (
      input.pipe(switchMap(this.mergeMicroToSSR(middleware)))
    ), of(options)).toPromise();
  }

  private registryMicroMiddleware(middleware: MicroMiddleware) {
    this.microMiddlewareList.push(middleware);
  }

  private getLocation(request: any, isMicro?: boolean) {
    const { pathname = '' } = request.params;
    return { pathname: isMicro ? `/${pathname}` : request.path, search: '?' };
  }
}
