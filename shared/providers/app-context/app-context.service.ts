import { Inject, InjectorToken, LocatorStorage } from '@di';
import { MicroManageInterface } from '@shared/micro/types';
import { ENVIRONMENT } from '@shared/token';
import { cloneDeep } from 'lodash';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export const APP_CONTEXT = InjectorToken.get('APP_CONTEXT');

export abstract class AppContextService {
  private resourceCache: Map<string, Map<string, Observable<object>>> = new Map();

  constructor(@Inject(LocatorStorage) protected ls: LocatorStorage) { }

  public getContext<T = any>(): T {
    return this.ls.getProvider<T>(APP_CONTEXT) || {} as T;
  }

  public getEnvironment() {
    return this.ls.getProvider(ENVIRONMENT);
  }

  public getResourceCache(type?: string) {
    if (!type || this.resourceCache.has(type)) {
      return type && this.resourceCache.get(type) || new Map();
    }

    const resource = this.getContext().resource;
    const cacheResource = new Map();
    Object.keys(resource).forEach((key) => {
      const { source, type: sourceType } = resource[key];
      if (sourceType === type) {
        cacheResource.set(key, of(source).pipe(map(cloneDeep)));
      }
    });
    this.resourceCache.set(type, cacheResource);
    return cacheResource;
  }

  get microManage(): MicroManageInterface {
    return this.getContext().useMicroManage();
  }

  get fetch(): Fetch {
    return this.getContext().fetch;
  }

  get isMicro(): boolean {
    return this.getContext().isMicro;
  }
}
