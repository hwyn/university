import { Injector } from "./abstract-injector";
import { Injectable } from "./injectable";
import { LocatorStorageImplements, Type } from "./type-api";

@Injectable()
export class LocatorStorage implements LocatorStorageImplements {
  constructor(private injector: Injector) { }

  getProvider<T = any>(token: any): T {
    return this.injector.get<T>(token);
  }

  getService<T>(target: Type<T>): T {
    return this.injector.get<T>(target);
  }
}
