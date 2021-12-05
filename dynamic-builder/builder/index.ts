import { LocatorStorage, registryProvider } from '@di';
import { FACTORY_BUILDER } from '../token';
import { BuilderModel } from './builder-model';
import { BuilderProps } from './type-api';

const factoryBuilder = (ls: LocatorStorage, { BuilderModel: NewBuilderModel = BuilderModel, ...props }: BuilderProps) => {
  return (new NewBuilderModel(ls) as any).loadForBuild(props);
};

registryProvider({ provide: FACTORY_BUILDER, useFactory: factoryBuilder, deps: [LocatorStorage] });

export * from './type-api';
export * from './builder-model';
