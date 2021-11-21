import { getProvider, Injectable, JSON_CONFIG, LOCAL_STORAGE, LocatorStorageImplements, registryProvider } from '@di';
import { FETCH_TOKEN, HISTORY_TOKEN } from '@university/common/token';
import { IS_MICRO, MICRO_MANAGER } from '@university/font-end-micro/token';
import { LocatorStorage } from '@university/provider/services';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { MicroManage } from '../../micro';
import { PROXY_HOST, READ_FILE_STATIC, REGISTRY_MICRO_MIDDER, REQUEST_TOKEN, SSR_MICRO_PATH } from '../../token';
import { JsonConfigService } from '../json-config/json-config.service';

type Render = (...args: any[]) => Promise<{ html: string, styles: string }>;
type MicroMiddleware = () => Observable<any>;

@Injectable()
export class Platform {
  private ls!: LocatorStorageImplements;
  private microMiddlewareList: MicroMiddleware[] = [];
  private staticFileSourceList: { [key: string]: any } = {};
  private currentPageFileSourceList: { [key: string]: any } = {};

  constructor() {
    registryProvider([
      { provide: MICRO_MANAGER, useClass: MicroManage },
      { provide: LOCAL_STORAGE, useClass: LocatorStorage },
      { provide: JSON_CONFIG, useClass: JsonConfigService },
      { provide: HISTORY_TOKEN, useValue: { location: {}, listen: () => () => void (0) } },
    ]);
    this.ls = getProvider<LocatorStorageImplements>(LOCAL_STORAGE);
  }

  bootstrapRender(render: Render) {
    return async (global: any, isMicro: boolean = false) => {
      const { fetch, request, location, readAssets, readStaticFile, proxyHost, ssrMicroPath, ..._global } = global;
      registryProvider([
        { provide: IS_MICRO, useValue: isMicro },
        { provide: PROXY_HOST, useValue: proxyHost },
        { provide: REQUEST_TOKEN, useValue: request },
        { provide: SSR_MICRO_PATH, useValue: ssrMicroPath },
        { provide: FETCH_TOKEN, useValue: this.proxyFetch(fetch) },
        { provide: READ_FILE_STATIC, useValue: this.proxyReadStaticFile(readStaticFile) },
        { provide: REGISTRY_MICRO_MIDDER, useValue: this.registryMicroMiddleware.bind(this) }
      ]);
      this.microMiddlewareList = [];
      this.currentPageFileSourceList = {};
      this.ls.getProvider(HISTORY_TOKEN).location = this.getLocation(request, isMicro);
      const { js = [], links = [] } = readAssets();
      const { html, styles } = await render({ request, ..._global });
      const execlResult = await this.execlMicroMiddleware({ html, styles, js, links, microTags: [], microFetchData: [] });
      return { ...execlResult, fetchData: this.getStaticFileData() };
    };
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
        fileCache = { type: 'file-static', source: JSON.parse(readStaticFile(url)) };
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
    return this.microMiddlewareList.reduce((input, middleware) => {
      return input.pipe(switchMap(this.mergeMicroToSSR(middleware)));
    }, of(options)).toPromise();
  }

  private registryMicroMiddleware(middleware: MicroMiddleware) {
    this.microMiddlewareList.push(middleware);
  }

  private getLocation(request: any, isMicro?: boolean) {
    const { pathname = '' } = request.params;
    return { pathname: isMicro ? `/${pathname}` : request.path, search: '?' };
  }
}
