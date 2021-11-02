import { Dispatch } from 'react';
import { Subject } from 'rxjs';
import { FormControl as FormControlImplements } from './type-api';

export type MakeForRender = Dispatch<any>;
export interface FormControlOptions {
  value?: any;
}
export class FormControl<T = any> implements FormControlImplements {
  private _value: any;
  private _valid: boolean | undefined;
  public changeValues = new Subject<any>();

  constructor(value: any) {
    this._value = value;
  }

  public patchValue(value: T) {
    this.setValue(value);
  }

  public setValue(value: any) {
    this._value = value;
    this.changeValues.next(this.value);
  }

  public destory() {
    this.changeValues.unsubscribe();
  }

  public get valid(): boolean | undefined {
    return this._valid;
  }

  public get value(): T {
    return this._value;
  }
}
