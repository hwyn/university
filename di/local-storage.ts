// eslint-disable-next-line max-classes-per-file
import { Injectable } from "./injectable";
import { Injector } from "./injector.abstract";
import { LocatorStorageImplements } from "./local-storage.abstract";
import { Type } from "./type-api";

@Injectable()
export class LocatorStorage implements LocatorStorageImplements {
  constructor(private injector: Injector) { }

  getProvider<T = any>(token: any, ...params: any[]): T {
    return this.injector.get<T>(token, ...params);
  }

  getService<T>(target: Type<T>): T {
    return this.injector.get<T>(target);
  }
}
