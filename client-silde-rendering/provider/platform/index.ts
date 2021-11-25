import { getProvider, Injector, Provider, StaticInjector } from '@di';
import { Platform } from './platform';

export const dynamicPlatform = (provides: Provider[] = []): Platform => {
  const parentInjector = getProvider(Injector as any);
  const injector = new StaticInjector(parentInjector, { isScope: 'self' });
  provides.forEach((provide) => parentInjector.set(provide.provide, provide));
  return parentInjector.get(Platform);
};
