import { getProvider, Injector, Provider, StaticInjector } from '@di';
import { APP_CONTEXT, AppContextService } from '@shared/providers/app-context';
import { JsonConfigService } from '@shared/providers/json-config';

import { CONTAINER, STYLE_CONTAINER } from '../../token';
import { AppContextService as ClientAppContextService } from '../app-context';
import { JsonConfigService as ClientJsonConfigService } from '../json-config';

export type Render = (...args: any[]) => Promise<(container: HTMLElement) => void>;

export class Platform {
  private rootInjector: Injector = getProvider(Injector as any);

  constructor(private providers: Provider[]) { }

  bootstrapRender(render: Render) {
    if (!this.isMicro) {
      return this.importMicro(this.beforeBootstrapRender()).then(render);
    }
    microStore.render = this.proxyRender.bind(this, render);
  }

  private async proxyRender(render: Render, options: any) {
    const { microManage, head, body, ..._options } = options;
    const microConfig = {
      useMicroManage: () => microManage
    };
    const injector = this.beforeBootstrapRender(microConfig, [
      { provide: CONTAINER, useValue: body },
      { provide: STYLE_CONTAINER, useValue: head }
    ]);
    const unRender = await render(injector, _options);
    return (_container: HTMLElement) => { unRender(_container); injector.clear(); }
  }

  private beforeBootstrapRender(context: object = {}, providers: Provider[] = []) {
    const injector = new StaticInjector(this.rootInjector, { isScope: 'self' });
    const appContext = { fetch, renderSSR: true, resource: this.resource, isMicro: this.isMicro, ...context };
    const _providers: Provider[] = [
      ...this.providers,
      { provide: STYLE_CONTAINER, useValue: document.head },
      { provide: APP_CONTEXT, useValue: appContext },
      { provide: JsonConfigService, useClass: ClientJsonConfigService },
      { provide: AppContextService, useClass: ClientAppContextService },
      ...providers
    ];
    _providers.forEach((provider) => injector.set(provider.provide, provider));

    return injector;
  }

  private async importMicro(injector: Injector): Promise<Injector> {
    const { registryMicro, MicroManage } = await import('../../micro/import-micro');
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
