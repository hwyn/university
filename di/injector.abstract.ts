import { Provider, Type } from './type-api';

export abstract class Injector {
  abstract get<T = any>(target: any, ...params: any[]): T;
  abstract set(token: any, provider: Provider): void;
  abstract createClass<T = any>(clazz: Type<T>): T;
  abstract clear(): void;
}
