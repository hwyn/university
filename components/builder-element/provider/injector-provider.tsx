import { getProvider, Injector } from '@di';
import { createContext } from 'react';

export const dynamicContext = createContext<Injector>(getProvider(Injector as any));

export const DynamicProvider = ({ injector, children }: any) => (
  <dynamicContext.Provider value={injector}>{children}</dynamicContext.Provider>
);

