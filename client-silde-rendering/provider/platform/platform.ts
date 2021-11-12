import { getProvider, Injectable, LOCAL_STORAGE, LocatorStorageImplements, registryProvider } from '@di';
import { FETCH_TOKEN } from '@university/common/token';
import { LocatorStorage } from '@university/provider/services';

type Render = (...args: any[]) => Promise<(continer: HTMLElement) => void>;

declare const common: any;

@Injectable()
export class Platform {
  private ls!: LocatorStorageImplements;
  constructor() {
    registryProvider([
      { provide: LOCAL_STORAGE, useClass: LocatorStorage },
      { provide: FETCH_TOKEN, useValue: fetch.bind(window) }
    ]);
    this.ls = getProvider<LocatorStorageImplements>(LOCAL_STORAGE);
  }

  bootstrapRender(render: Render) {
    this.isMicro ? common.render = render : render();
  }

  private get isMicro() {
    return typeof common !== 'undefined';
  }
}
