import { getProvider, Injectable, LOCAL_STORAGE, LocatorStorageImplements, registryProvider } from '@di';
import { FETCH_TOKEN, RENDER_SSR } from '@university/common/token';
import { IS_MICRO, MICRO_MANAGER } from '@university/font-end-micro/token';
import { LocatorStorage } from '@university/provider/services';

type Render = (...args: any[]) => Promise<(continer: HTMLElement) => void>;

declare const common: any;

@Injectable()
export class Platform {
  private ls!: LocatorStorageImplements;
  constructor() {
    registryProvider([
      { provide: LOCAL_STORAGE, useClass: LocatorStorage },
      { provide: FETCH_TOKEN, useValue: fetch.bind(window) },
      { provide: IS_MICRO, useValue: this.isMicro }
    ]);
    this.ls = getProvider<LocatorStorageImplements>(LOCAL_STORAGE);
  }

  bootstrapRender(render: Render) {
    this.isMicro ? common.render = this.proxyRender.bind(this, render) : render();
  }

  private async proxyRender(render: Render, continer: HTMLElement, options: any) {
    const { microManage, ..._options } = options;
    registryProvider([
      { provide: RENDER_SSR, useValue: true },
      { provide: MICRO_MANAGER, useValue: microManage }
    ]);
    return render(continer, _options);
  }

  private get isMicro() {
    return typeof common !== 'undefined';
  }
}
