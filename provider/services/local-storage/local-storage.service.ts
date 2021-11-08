import { Injectable, Injector, LocatorStorageImplements, Type } from '@di';

@Injectable()
export class LocatorStorage implements LocatorStorageImplements {
  constructor(private injector: Injector) { }

  getService<T = any>(target: Type<T>): T {
    return this.injector.get<T>(target);
  }

  getProvider<T>(token: any) {
    return this.injector.get<T>(token);
  }
}
