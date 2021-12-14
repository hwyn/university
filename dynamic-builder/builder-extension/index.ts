import { Provider } from '@di';

import { ACTION_INTERCEPT, BUILDER_EXTENSION, LOAD_BUILDER_CONFIG } from '../token';
import { Action } from './action/actions';
import { ActionExtension } from './action/actions.extension';
import { serializeAction } from './basic/basic.extension';
import { DataSourceExtension } from './datasource/datasource.extension';
import { FormExtension } from './form/form.extension';
import { GridExtension } from './grid/grid.extension';
import { InstanceExtension } from './instance/instance.extension';
import { LifeCycleExtension } from './life-cycle/life-cycle.extension';
import { MetadataExtension } from './metadata/metadata.extension';
import { ReadConfigExtension } from './read-config/read-config.extension';
import { ViewModelExtension } from './view-model/view-model.extension';
import { CheckVisibilityExtension } from './visibility/check-visibility.extension';

export const builderExtensions: Provider[] = [
  { provide: ACTION_INTERCEPT, useClass: Action },
  { provide: LOAD_BUILDER_CONFIG, useValue: ReadConfigExtension },
  { provide: BUILDER_EXTENSION, multi: true, useValue: CheckVisibilityExtension },
  { provide: BUILDER_EXTENSION, multi: true, useValue: GridExtension },
  { provide: BUILDER_EXTENSION, multi: true, useValue: InstanceExtension },
  { provide: BUILDER_EXTENSION, multi: true, useValue: ViewModelExtension },
  { provide: BUILDER_EXTENSION, multi: true, useValue: FormExtension },
  { provide: BUILDER_EXTENSION, multi: true, useValue: DataSourceExtension },
  { provide: BUILDER_EXTENSION, multi: true, useValue: MetadataExtension },
  { provide: BUILDER_EXTENSION, multi: true, useValue: ActionExtension },
  { provide: BUILDER_EXTENSION, multi: true, useValue: LifeCycleExtension }
];

export * from './action';
export * from './action/create-actions';
export * from './basic/basic.extension';
export * from './form/type-api';
export * from './type-api';

export { serializeAction };
