import { Observable } from 'rxjs';
import { InjectorToken } from './injector-token';

export type Type<T = any> = new (...args: any[]) => T;

interface AbstractProvider {
  provide: any;
  deps?: any[];
}

export interface ClassProvider<T = any> extends AbstractProvider {
  useNew?: boolean;
  useClass: Type<T>;
}

export interface ValueProvider extends AbstractProvider {
  multi?: boolean;
  useValue: any;
}

export interface FactoryProvider extends AbstractProvider {
  useFactory: (...args: any[]) => any;
}

export type Provider = ValueProvider | ClassProvider | FactoryProvider;

export abstract class JsonConfigImplements {
  abstract getJsonConfig(jsonName: string): Observable<any>;
}

export abstract class LocatorStorageImplements {
  abstract getService<T>(target: Type<T> | InjectorToken): T;
  abstract getProvider<T = any>(target: any): T;
}