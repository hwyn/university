import { getProvider, Injectable, JSON_CONFIG, LOCAL_STORAGE, LocatorStorageImplements, registryProvider } from '@di';
import { FETCH_TOKEN, HISTORY_TOKEN } from '@university/common/token';
import { IS_MICRO, MICRO_MANAGER } from '@university/font-end-micro/token';
import { LocatorStorage } from '@university/provider/services';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { MicroManage } from '../../micro';
import { PROXY_MICRO_URL, READ_FILE_STATIC, REGISTRY_MICRO_MIDDER, REQUEST_TOKEN } from '../../token';
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
    return async (_global: any, isMicro: boolean = false) => {
      const { fetch, request, location, readAssets, readStaticFile, proxyMicroUrl, ...__global } = _global;
      registryProvider([
        { provide: IS_MICRO, useValue: isMicro },
        { provide: FETCH_TOKEN, useValue: fetch },
        { provide: REQUEST_TOKEN, useValue: request },
        { provide: PROXY_MICRO_URL, useValue: proxyMicroUrl },
        { provide: READ_FILE_STATIC, useValue: this.proxyReadStaticFile(readStaticFile) },
        { provide: REGISTRY_MICRO_MIDDER, useValue: this.registryMicroMiddleware.bind(this) }
      ]);
      this.microMiddlewareList = [];
      this.currentPageFileSourceList = {};
      this.ls.getProvider(HISTORY_TOKEN).location = this.getLocation(request, isMicro);
      const { html, styles } = await render({ request, ...__global });
      const { js = [], links = [], linksToStyle = [] } = readAssets();
      const excelResult = await this.excelMicroMiddleware({ html, styles, js, links, microTags: [], microFetchData: [] });
      return { ...excelResult, linksToStyle, fetchData: this.getStaticFileData() };
    };
  }

  private getStaticFileData() {
    return JSON.stringify(this.currentPageFileSourceList);
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
        links: links.concat(...microResult.links || []),
        js: js.concat(...microResult.js || []),
        microTags: microTags.concat(...microResult.microTags || []),
        microFetchData: microFetchData.concat(...microResult.microFetchData || [])
      })));
  }

  private excelMicroMiddleware(options: any): Promise<any> {
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
