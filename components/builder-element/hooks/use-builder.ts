import { LOCAL_STORAGE, LocatorStorageImplements } from '@university/di';
import { BuilderModel, BuilderProps } from 'dynamic-builder';
import { useContext, useEffect, useState } from 'react';
import { Observable } from 'rxjs';
import { dynamicContext } from '../provider';

export interface BuilderextensionProps<T extends BuilderModel = any> extends BuilderProps {
  BuilderExtensionModel?: T;
}

const factory = (ls: LocatorStorageImplements, { BuilderExtensionModel, ...props }: BuilderextensionProps<any>) => (): any => {
  let model: BuilderextensionProps & { loadForBuild: () => Observable<any> };
  const BM = BuilderExtensionModel || BuilderModel;
  return () => model || (model = new BM(ls, props).loadForBuild());
};

export const useBuilder = <T = BuilderModel>(props: BuilderProps): T => {
  const [, detectChanges] = useState(0);
  const injector = useContext(dynamicContext);
  const [factoryBuilder] = useState(factory(injector.get(LOCAL_STORAGE), <BuilderextensionProps<BuilderModel>>props));
  const model = factoryBuilder();

  useEffect(() => {
    model.$$cache.detectChanges.subscribe(() => detectChanges(Math.random()));
    return () => model.onDestory();
  }, []);
  model.onChanges(props);
  return model;
};
