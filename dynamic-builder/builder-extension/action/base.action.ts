import { LocatorStorage } from '@di';

import { ACTION_INTERCEPT } from '../../token';
import { serializeAction } from '../basic/basic.extension';
import { BuilderFieldExtensions, BuilderModelExtensions, InstanceExtensions } from '../type-api';
import { Action, ActionIntercept } from './type-api';

export class BaseAction<T = any> {
  protected _actionIntercept!: ActionIntercept;

  constructor(protected ls: LocatorStorage, private context: any = {}) {
    this._actionIntercept = this.ls.getProvider(ACTION_INTERCEPT);
  }

  public createAction(action: string | Action) {
    return serializeAction(action);
  }

  get builderField(): BuilderFieldExtensions {
    return this.context.builderField;
  }

  get actionIntercept(): ActionIntercept {
    return this._actionIntercept;
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

  get actionEvent(): T {
    return this.context.actionEvent;
  }
}
