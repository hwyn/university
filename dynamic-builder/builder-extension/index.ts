import { Injectable, InjectorToken, LocatorStorage, registryProvider, Type } from '@fm/di';
import { Observable } from 'rxjs';

// eslint-disable-next-line max-len
import { ACTION_INTERCEPT, BIND_BUILDER_ELEMENT, BIND_FORM_CONTROL, BUILDER_EXTENSION, GET_JSON_CONFIG, LOAD_BUILDER_CONFIG, VALIDATOR_SERVICE } from '../token';
import { Action } from './action/actions';
import { ActionExtension } from './action/actions.extension';
import { BasicExtension, serializeAction } from './basic/basic.extension';
import { DataSourceExtension } from './datasource/datasource.extension';
import { FormExtension } from './form/form.extension';
import { ControlOptions, FormOptions, ValidatorService } from './form/type-api';
import { GridExtension } from './grid/grid.extension';
import { InstanceExtension } from './instance/instance.extension';
import { LifeCycleExtension } from './life-cycle/life-cycle.extension';
import { MetadataExtension } from './metadata/metadata.extension';
import { ReadConfigExtension } from './read-config/read-config.extension';
import { Grid } from './type-api';
import { ViewModelExtension } from './view-model/view-model.extension';
import { CheckVisibilityExtension } from './visibility/check-visibility.extension';

const registryFactory = (token: InjectorToken, useFactory: (...args: any[]) => any) => {
  const proxyUseFactory = (ls: LocatorStorage, ...args: any[]) => useFactory(...args, ls);
  registryProvider({ provide: token, useFactory: proxyUseFactory, deps: [LocatorStorage] });
};

export const forwardGetJsonConfig = (getJsonConfig: (configName: string, ls: LocatorStorage) => Observable<object>) => {
  registryFactory(GET_JSON_CONFIG, getJsonConfig);
};

export const forwardFormControl = (factoryFormControl: (value: any, options: ControlOptions, ls: LocatorStorage) => any) => {
  registryFactory(BIND_FORM_CONTROL, (value: any, options: FormOptions, ls: LocatorStorage) => {
    return factoryFormControl(value, ls.getProvider<ValidatorService>(VALIDATOR_SERVICE)?.getValidators(options), ls);
  });
};

export const forwardBuilderLayout = (createElement: (grid: Grid, ls?: LocatorStorage) => any) => {
  registryFactory(BIND_BUILDER_ELEMENT, createElement);
};

export const registryExtension = (extensions: Type<BasicExtension>[]) => {
  registryProvider(extensions.map((extension) => ({ provide: BUILDER_EXTENSION, multi: true, useValue: extension })));
};

export const InjectableValidator = () => Injectable(VALIDATOR_SERVICE);

registryProvider([
  { provide: ACTION_INTERCEPT, useClass: Action },
  { provide: LOAD_BUILDER_CONFIG, useValue: ReadConfigExtension },
]);

registryExtension([
  CheckVisibilityExtension,
  GridExtension,
  InstanceExtension,
  ViewModelExtension,
  FormExtension,
  DataSourceExtension,
  MetadataExtension,
  ActionExtension,
  LifeCycleExtension
]);

export * from './action';
export * from './action/create-actions';
export * from './basic/basic.extension';
export * from './constant/calculator.constant';
export * from './form/type-api';
export { BuilderExtensionsModel as BuilderModel } from './model/builder-extension-model';
export * from './type-api';
export * from './view-model/base.view';

export { serializeAction };
