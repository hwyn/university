import { __PROVIDE__INJECT__,__PROVIDER_TYPE__, __USECLASS__, StaticInjector } from './injector';
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

export const Inject = (token: any) => (target: any, name: string, index: number) => {
  if (!target[__PROVIDE__INJECT__]) {
    target[__PROVIDE__INJECT__] = [];
  }
  target[__PROVIDE__INJECT__].push({ token, index });
};

export const JSON_CONFIG = InjectorToken.get('JSON_CONFIG');

export const registryProvider = (provider: Provider | Provider[]) => toArray(provider).forEach((p: Provider) => injector.set(p.provide, p));

export const Injectable = InjectableFactory(undefined, { useClass: true, useNew: false });

export const getProvider = <T = any>(target: Type<T> | InjectorToken) => injector.get<T>(target);
