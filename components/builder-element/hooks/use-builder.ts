import { BuilderModel, BuilderProps } from 'dynamic-builder';
import { useEffect, useState } from 'react';
import { Observable } from 'rxjs';

export interface BuilderextensionProps<T extends BuilderModel = any> extends BuilderProps {
  BuilderExtensionModel?: T;
}

const factory = ({ BuilderExtensionModel, ...props }: BuilderextensionProps<any>) => (): any => {
  let model: BuilderextensionProps & { loadForBuild: () => Observable<any> };
  const BM = BuilderExtensionModel || BuilderModel;
  return () => model || (model = new BM(props).loadForBuild());
};

export const useBuilder = <T = BuilderModel>(props: BuilderProps): T => {
  const [, detectChanges] = useState(0);
  const [factoryBuilder] = useState(factory(<BuilderextensionProps<BuilderModel>>props));
  const model = factoryBuilder();

  useEffect(() => {
    model.$$cache.detectChanges.subscribe(() => detectChanges(Math.random()));
    return () => model.onDestory();
  }, []);
  model.onChanges(props);
  return model;
};
