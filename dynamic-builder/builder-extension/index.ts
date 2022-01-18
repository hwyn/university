import { registryProvider, Type } from '@di';

import { ACTION_INTERCEPT, BIND_BUILDER_ELEMENT, BIND_FORM_CONTROL, BUILDER_EXTENSION, LOAD_BUILDER_CONFIG } from '../token';
import { Action } from './action/actions';
import { ActionExtension } from './action/actions.extension';
import { BasicExtension, serializeAction } from './basic/basic.extension';
import { DataSourceExtension } from './datasource/datasource.extension';
import { FormExtension } from './form/form.extension';
import { GridExtension } from './grid/grid.extension';
import { InstanceExtension } from './instance/instance.extension';
import { LifeCycleExtension } from './life-cycle/life-cycle.extension';
import { MetadataExtension } from './metadata/metadata.extension';
import { ReadConfigExtension } from './read-config/read-config.extension';
import { Grid } from './type-api';
import { ViewModelExtension } from './view-model/view-model.extension';
import { CheckVisibilityExtension } from './visibility/check-visibility.extension';

export const forwardFormControl = (factoryFormControl: (value: any) => any) => (
  registryProvider({ provide: BIND_FORM_CONTROL, useFactory: factoryFormControl })
);

export const registryExtension = (extensions: Type<BasicExtension>[]) => {
  registryProvider(extensions.map((extension) => ({ provide: BUILDER_EXTENSION, multi: true, useValue: extension })));
};

export const forwardBuilderLayout = (createElement: (grid: Grid) => any) => {
  registryProvider({ provide: BIND_BUILDER_ELEMENT, useFactory: (grid: Grid) => createElement(grid) });
};

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
export * from './type-api';

export { serializeAction };
