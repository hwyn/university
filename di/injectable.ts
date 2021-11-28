import { StaticInjector, __PROVIDER_TYPE__, __USECLASS__ } from './injector';
import { InjectorToken } from './injector-token';
import { Provider, Type } from './type-api';

const injector = new StaticInjector();
const toArray = (obj: any) => Array.isArray(obj) ? obj : [obj];

const InjectableFactory = (defaultToken?: InjectorToken, defaultOptions?: object) =>
  (token?: InjectorToken, options?: { [key: string]: any }) => <T>(target: Type<T>): Type<T> => {
    if (!(token instanceof InjectorToken)) {
      token = void (0);
      options = token;
    }
    const { injector: _injector = injector, ..._options } = options || {};
    const providers = [token, defaultToken, target].filter((item) => !!item);
    (target as any)[__PROVIDER_TYPE__] = __USECLASS__;
    providers.forEach((provide) => _injector.set(provide, { ...defaultOptions, ..._options, provide, useClass: target }));
    return target;
  };

export const registryProvider = (provider: Provider | Provider[]) => toArray(provider).forEach((p: Provider) => injector.set(p.provide, p));

export const Injectable = InjectableFactory(undefined, { useClass: true, useNew: false });

export const getProvider = <T = any>(target: Type<T> | InjectorToken) => injector.get<T>(target);

export * from './injector';
