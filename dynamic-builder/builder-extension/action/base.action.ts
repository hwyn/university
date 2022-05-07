import { LocatorStorage } from '@di';

import { ACTION_INTERCEPT } from '../../token';
import { BuilderFieldExtensions, BuilderModelExtensions, InstanceExtensions } from '../type-api';
import { Action, ActionIntercept, TypeEvent } from './type-api';

export class BaseAction<T = any> {
  constructor(protected ls: LocatorStorage, private context: any = {}) { }

  get builderField(): BuilderFieldExtensions {
    return this.context.builderField;
  }

  get actionIntercept(): ActionIntercept {
    return this.ls.getProvider(ACTION_INTERCEPT);
  }

  get builder(): BuilderModelExtensions {
    return this.context.builder;
  }

  get instance(): InstanceExtensions {
    return this.builderField && this.builderField.instance;
  }

  get actionPropos(): Action {
    return this.context.actionPropos;
  }

  get callLink(): [{ fieldId: string, type: TypeEvent }] {
    return this.context.actionPropos.callLink || [];
  }

  get actionEvent(): T {
    return this.context.actionEvent;
  }
}
