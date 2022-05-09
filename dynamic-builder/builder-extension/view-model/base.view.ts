import { LocatorStorage } from '@fm/di';
import { get, set } from 'lodash';

export class BaseView<T = any> {
  constructor(private ls: LocatorStorage, private store: any) { }

  public setBindValue(dataBinding: any, value: any): void {
    set(this.store, dataBinding.path, value);
  }

  public getBindValue(dataBinding: any) {
    return get(this.store, dataBinding.path, dataBinding.default);
  }

  public refreshData(model: T) {
    this.store = model;
  }

  public get model(): T {
    return this.store;
  }
}
