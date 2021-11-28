import { Provider } from './type-api';

export abstract class Injector {
  abstract get<T = any>(target: any): T;
  abstract set(token: any, provider: Provider): void;
}
