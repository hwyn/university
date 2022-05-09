import { getProvider, Injector, Type } from '@fm/di';
import { Router } from 'express';

interface RouteItem {
  method: string;
  url: string;
  validators: [];
  agent: (...args: any[]) => Promise<any>;
}

enum RouterMethod {
  post = 'post',
  get = 'get',
  delete = 'delete',
  put = 'put',
  all = 'all',
  options = 'options',
  param = 'param',
  use = 'use'
}
const __ROUTER__ = '__ROUTER__';
const rootInjector: Injector = getProvider(Injector as any);

const factoryRouterDecoratorMethod = (method: RouterMethod) => (url: string) => (prototype: any, key: string) => {
  if (!prototype[__ROUTER__]) {
    Object.defineProperty(prototype, __ROUTER__, { value: [] });
  }
  prototype[__ROUTER__].push({ method, url, agent: prototype[key] });
};

const createFactoryRouter = <T = any>(baseUrl: string, clazz: Type<T>) => (injector: Injector) => {
  const router = Router() as any;
  const routeItems: RouteItem[] = clazz.prototype[__ROUTER__] || [];
  const newClazz = injector.createClass(clazz);
  routeItems.forEach(({ method, url, agent }) => {
    const routeUrl = `${baseUrl}/${url}`.replace(/[\\/]+/g, '/');
    router[method].call(router, routeUrl, [], async (...args: any[]) => agent.apply(newClazz, args));
  });
  return router;
}

export const InjectableRouter = (baseUrl = '') => <T>(clazz: Type<T>): Type<T> => {
  rootInjector.set(clazz, { provide: clazz, useFactory: createFactoryRouter(baseUrl, clazz), deps: [Injector] });
  return clazz;
};

export const Post = factoryRouterDecoratorMethod(RouterMethod.post);

export const Get = factoryRouterDecoratorMethod(RouterMethod.get);

export const Delete = factoryRouterDecoratorMethod(RouterMethod.delete);

export const Put = factoryRouterDecoratorMethod(RouterMethod.put);

export const All = factoryRouterDecoratorMethod(RouterMethod.all);

export const Param = factoryRouterDecoratorMethod(RouterMethod.param);

export const Use = factoryRouterDecoratorMethod(RouterMethod.use);

export const Options = factoryRouterDecoratorMethod(RouterMethod.options);
