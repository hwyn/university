import { Injector } from "./abstract-injector";
import { Injectable } from "./injectable";
import { LocatorStorageImplements, Type } from "./type-api";

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
