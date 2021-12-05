/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
import { isUndefined } from 'lodash';
import 'reflect-metadata';
import { Injector } from './injector.abstract';
import { ClassProvider, FactoryProvider, Provider, Type, ValueProvider } from './type-api';

interface Record { token: any; fn: (...args: any[]) => any; }

const designParamtypes = `design:paramtypes`;
const __provide__inject__ = `design:__provide__inject__`;

export const __PROVIDER_TYPE__ = '__PROVIDER_TYPE__';
export const __USECLASS__ = '__USECLASS__';

export const Inject = (token: any) => (target: any, name: string, index: number) => {
  if (!target[__provide__inject__]) {
    target[__provide__inject__] = [];
  }
  target[__provide__inject__].push({ token, index });
};

export class StaticInjector implements Injector {
  protected isSelfContext = false;
  private _recors: Map<any, Record> = new Map<any, Record>();
  protected _instanceRecors: Map<any, Type> = new Map<any, Type>();

  constructor(protected parentInjector?: Injector, options?: { [key: string]: any }) {
    this._recors.set(Injector, { token: Injector, fn: () => this });
    this.isSelfContext = options ? options.isScope === 'self' : false;
  }

  get<T>(token: any, ...params: any[]): T {
    const record = this._recors.get(token) || (this.parentInjector as this)?._recors.get(token);
    return record ? record.fn.apply(this, params) : null;
  }

  set(token: any, provider: Provider) {
    const { provide, useClass, useValue, useFactory } = <any>provider;
    const record = this._recors.get(token) || <any>{};
    record.token = provide;

    if (!isUndefined(useValue)) {
      record.fn = resolveMulitProvider.call(this, <ValueProvider>provider, record);
    } else if (useClass) {
      const recordClass = this._recors.get(useClass) || { fn: resolveClassProvider.call(this, <ClassProvider>provider) };
      record.fn = recordClass.fn;
    } else if (useFactory) {
      record.fn = resolveFactoryProvider.call(this, <FactoryProvider>provider);
    }
    this._recors.set(record.token, record);
  }

  clear(): void {
    this._recors.clear();
    this._instanceRecors.clear();
    this.parentInjector = void (0);
  }
}

function resolveClassProvider({ useNew = false, useClass }: ClassProvider) {
  let instance: any;
  return function (this: StaticInjector) {
    const isSelfContext = this.isSelfContext;
    let newInstance = isSelfContext ? this._instanceRecors.get(useClass) : instance;
    if (useNew || !newInstance) {
      const deps = Reflect.getMetadata(designParamtypes, useClass) || [];
      const injectTypes = (useClass as any)[__provide__inject__] || [];
      const arvgs = deps.map((token: any) => this.get(token));
      injectTypes.forEach(({ token, index }: any) => arvgs[index] = this.get(token));
      newInstance = new useClass(...arvgs);
      isSelfContext ? this._instanceRecors.set(useClass, newInstance) : instance = newInstance;
    }
    return newInstance;
  };
}

function resolveMulitProvider(this: StaticInjector, { useValue, multi }: ValueProvider, { fn = () => [] }: Record) {
  const preValue = fn.call(this);
  return function (this: StaticInjector) {
    return multi ? [...preValue, useValue] : useValue;
  };
}

function resolveFactoryProvider({ useFactory, deps = [] }: FactoryProvider) {
  return function (this: StaticInjector, ...params: any[]) {
    // eslint-disable-next-line prefer-spread
    return useFactory.apply(undefined, [...deps.map((token: any) => this.get(token)), ...params]);
  };
}
