import { Inject, InjectorToken, LocatorStorage } from '@di';
import { ENVIRONMENT } from '@shared/token';

export type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export const APP_CONTEXT = InjectorToken.get('APP_CONTEXT');

export abstract class AppContextService {
  constructor(@Inject(LocatorStorage) protected ls: LocatorStorage) { }

  getContext<T = any>(): T {
    return this.ls.getProvider<T>(APP_CONTEXT) || {} as T;
  }

  getEnvironment() {
    return this.ls.getProvider(ENVIRONMENT);
  }

  get fetch(): Fetch {
    return (input: RequestInfo, init?: RequestInit) => fetch.apply(window, [input, init]);
  }

  get isMicro(): boolean {
    return this.getContext().isMicro;
  }

  get body(): HTMLElement {
    return this.getContext().body;
  }

  get head(): HTMLElement {
    return this.getContext().head;
  }
}
