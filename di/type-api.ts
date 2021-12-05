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

