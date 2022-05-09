import { Injector, Provider } from '@fm/di';
import { MICRO_OPTIONS } from '@fm/shared/token';

import { microOptions } from './micro-options';

export const registryMicro = (injector: Injector) => {
  const providers: Provider[] = [{ provide: MICRO_OPTIONS, useValue: microOptions }];
  providers.forEach((provider) => injector.set(provider.provide, provider));
};

export { MicroManage } from './micro-manage/micro-manage';
