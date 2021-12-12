import { getProvider, Injector, Type } from '@di';

import { SCOPE_BUILDER } from '../token';

const rootInjector: Injector = getProvider(Injector as any);

export const InjectableBuilder = (name: string) => <T>(clazz: Type<T>): Type<T> => {
  const scopeValue = { name, builder: clazz };
  const provider = { provide: SCOPE_BUILDER, multi: true, useValue: scopeValue };
  rootInjector.set(SCOPE_BUILDER, provider);
  return clazz;
}
