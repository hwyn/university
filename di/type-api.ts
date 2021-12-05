/* eslint-disable max-classes-per-file */
import { Observable } from 'rxjs';

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

// tslint:disable-next-line:max-classes-per-file
export abstract class LocatorStorageImplements {
  abstract getProvider<T = any>(target: any, ...params: any[]): T;
  abstract getService<T>(target: Type<T>) : T;
}
