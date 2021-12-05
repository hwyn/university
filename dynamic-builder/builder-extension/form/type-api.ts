import { Subject } from 'rxjs';

export interface FormControl {
  readonly value: any;
  readonly valid: boolean | undefined;
  changeValues: Subject<any>;
  patchValue(value: any): void;
  destory(fieldId?: string): void;
}

export interface FormControlOptions {
  value?: any;
}