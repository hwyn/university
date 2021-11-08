import { toArray } from 'lodash';
import { StaticInjector, __PROVIDER_TYPE__, __USECLASS__ } from './injector';
import { InjectorToken } from './injector-token';
import { Provider, Type } from './type-api';

const injector = new StaticInjector();

const InjectableFactory = (defaultToken?: InjectorToken, defaultOptions?: object) =>
  (token?: InjectorToken, options?: object) => <T>(target: Type<T>): Type<T> => {
    const provides = [token, defaultToken, target].filter((item) => !!item);
    (target as any)[__PROVIDER_TYPE__] = __USECLASS__;
    provides.forEach((provide) => injector.set(provide, { ...defaultOptions, ...options, provide, useClass: target }));
    return target;
  };

export const registryProvider = (provider: Provider | Provider[]) => toArray(provider).forEach((p: Provider) => injector.set(p.provide, p));

export const Injectable = InjectableFactory(undefined, { useClass: true, useNew: false });

export const getProvider = <T = any>(target: Type<T> | InjectorToken) => injector.get<T>(target);

export * from './injector';
