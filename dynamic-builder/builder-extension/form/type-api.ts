import { Subject } from 'rxjs';

import { BuilderModel } from '../../builder/builder-model';
import { BuilderFieldExtensions } from '../type-api';

export interface FormControl {
  readonly value: any;
  readonly valid: boolean | undefined;
  changeValues: Subject<any>;
  patchValue(value: any): void;
  destory(fieldId?: string): void;
}

export interface FormOptions {
  builder: BuilderModel;
  builderField: BuilderFieldExtensions;
}

export interface FormControlOptions {
  value?: any;
}