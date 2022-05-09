import { LocatorStorage, registryProvider } from '@fm/di';

import { FACTORY_BUILDER, UI_ELEMENT } from '../token';
import { BuilderModel } from './builder-model';
import { BuilderProps } from './type-api';

const factoryBuilder = (ls: LocatorStorage, { BuilderModel: NewBuilderModel = BuilderModel, ...props }: BuilderProps) => {
  return (new NewBuilderModel(ls) as any).loadForBuild(props);
};

export const forwardUiElement = (name: string, Element: any) => (
  registryProvider({ provide: UI_ELEMENT, multi: true, useValue: { name, component: Element } })
)

registryProvider({ provide: FACTORY_BUILDER, useFactory: factoryBuilder, deps: [LocatorStorage] });

export * from './consts';
export * from './type-api';
