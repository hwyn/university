import { LocatorStorage } from '@fm/di';
import { get, set } from 'lodash';

export class BaseView<T = any> {
  constructor(private ls: LocatorStorage, private store: any) { }

  public setBindValue(binding: any, value: any): void {
    set(this.store, binding.path, value);
  }

  public getBindValue(binding: any) {
    return get(this.store, binding.path, binding.default);
  }

  public refreshData(model: T) {
    this.store = model;
  }

  public get model(): T {
    return this.store;
  }
}
