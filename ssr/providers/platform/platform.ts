import { getProvider, Injector, Provider, StaticInjector } from '@fm/di';
import { APP_CONTEXT, AppContextService } from '@fm/shared/providers/app-context';
import { JsonConfigService } from '@fm/shared/providers/json-config';
import { HISTORY } from '@fm/shared/token';
import { Observable, of } from '@fm/import-rxjs';
import { map, switchMap } from '@fm/import-rxjs';

import { MicroManage } from '../../micro';
import { AppContextService as ServerAppContextService } from '../app-context';
import { JsonConfigService as ServerJsonConfigService } from '../json-config';


type Render = (...args: any[]) => Promise<{ html: string, styles: string }>;
type MicroMiddleware = () => Observable<any>;

declare const registryRender: (render: any) => void;

export class Platform {
  private rootInjector: Injector;
  private resource: { [key: string]: any } = {};

  constructor(private providers: Provider[] = []) {
    this.rootInjector = getProvider(Injector as any);
  }

  public bootstrapRender(render: Render): void {
    registryRender(this.proxyRender.bind(this, render));
  }

  private async proxyRender(render: Render, global: any, isMicro = false) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fetch, request, location, readAssets, readStaticFile, proxyHost, microSSRPath, ..._global } = global;
    const microConfig = { fetch, isMicro, request, proxyHost, microSSRPath, readStaticFile, renderSSR: true, resource: this.resource };
    const injector = this.beforeBootstrapRender(microConfig, [
      { provide: HISTORY, useValue: { location: this.getLocation(request, isMicro), listen: () => (): any => void (0) } }
    ]);
    const { js = [], links = [] } = readAssets();
    const { html, styles } = await render(injector, { request, ..._global });
    const execlResult = await this.execlMicroMiddleware(injector, { html, styles, js, links, microTags: [], microFetchData: [] });
    injector.clear();
    return execlResult;
  }

  private beforeBootstrapRender(context: object, providers: Provider[] = []): Injector {
    const injector = new StaticInjector(this.rootInjector, { isScope: 'self' });
    const appContext = { useMicroManage: () => injector.get(MicroManage), ...context };
    const _providers: Provider[] = [
      ...this.providers,
      { provide: APP_CONTEXT, useValue: appContext },
      { provide: JsonConfigService, useClass: ServerJsonConfigService },
      { provide: AppContextService, useClass: ServerAppContextService },
      ...providers
    ];
    _providers.forEach((provider) => injector.set(provider.provide, provider));
    return injector;
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

  private async execlMicroMiddleware(injector: Injector, options: any): Promise<any> {
    const appContext = injector.get(AppContextService) as ServerAppContextService;
    const fetchData = appContext.getAllFileSource();
    return lastValueFrom(appContext.getpageMicroMiddleware().reduce((input, middleware) => (
      input.pipe(switchMap(this.mergeMicroToSSR(middleware)))
    ), of(options))).then((execlResult) => ({ ...execlResult, fetchData }));
  }

  private getLocation(request: any, isMicro?: boolean) {
    const { pathname = '' } = request.params;
    return { pathname: isMicro ? `${pathname}` : request.path, search: '?' };
  }
}
