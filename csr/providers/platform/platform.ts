import { getProvider, Injector, Provider, StaticInjector } from '@fm/di';
import { APP_CONTEXT, AppContextService } from '@fm/shared/providers/app-context';
import { JsonConfigService } from '@fm/shared/providers/json-config';
import { LAZY_MICRO } from 'university/shared/token';

import { AppContextService as ClientAppContextService } from '../app-context';
import { JsonConfigService as ClientJsonConfigService } from '../json-config';

export type Render = (...args: any[]) => Promise<(container: HTMLElement) => void>;

export class Platform {
  private rootInjector: Injector = getProvider(Injector as any);

  constructor(private providers: Provider[]) { }

  public bootstrapRender(render: Render) {
    if (!this.isMicro) {
      return this.importMicro(this.beforeBootstrapRender()).then(render);
    }
    microStore.render = this.proxyRender.bind(this, render);
  }

  private async proxyRender(render: Render, options: any) {
    const { microManage, head, body, ..._options } = options;
    const microConfig = { container: body, styleContainer: head, useMicroManage: () => microManage };
    const injector = this.beforeBootstrapRender(microConfig);
    const unRender = await render(injector, _options);
    return (_container: HTMLElement) => { unRender(_container); injector.clear(); }
  }

  private beforeBootstrapRender(context: object = {}, providers: Provider[] = []) {
    const injector = new StaticInjector(this.rootInjector, { isScope: 'self' });
    const container = document.getElementById('app');
    const styleContainer = document.head;
    const appContext = { fetch, container, styleContainer, renderSSR: true, resource: this.resource, isMicro: this.isMicro, ...context };
    const _providers: Provider[] = [
      ...this.providers,
      { provide: APP_CONTEXT, useValue: appContext },
      { provide: JsonConfigService, useClass: ClientJsonConfigService },
      { provide: AppContextService, useClass: ClientAppContextService },
      ...providers
    ];
    _providers.forEach((provider) => injector.set(provider.provide, provider));

    return injector;
  }

  private async importMicro(injector: Injector): Promise<Injector> {
    const { registryMicro, MicroManage } = await injector.get(LAZY_MICRO);
    registryMicro(injector);
    injector.get(APP_CONTEXT).useMicroManage = () => injector.get(MicroManage);
    return injector;
  }

  private get isMicro() {
    return typeof microStore !== 'undefined';
  }

  private get resource() {
    return typeof fetchCacheData !== 'undefined' ? fetchCacheData : {};
  }
}
