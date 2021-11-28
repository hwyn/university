import { LocatorStorageImplements } from '@di';
import { ACTION_INTERCEPT } from '../../token';
import { serializeAction } from '../basic/basic.extension';
import { BuilderFieldExtensions, BuilderModelExtensions, InstanceExtensions } from '../type-api';
import { Action, ActionIntercept } from './type-api';

export class BaseAction<T = any> {
  protected _actionPropos!: Action;
  protected _builder!: BuilderModelExtensions;
  protected _instance!: InstanceExtensions;
  protected _builderField!: BuilderFieldExtensions;
  protected _actionIntercept!: ActionIntercept;
  protected _actionResult!: T;

  constructor(protected ls: LocatorStorageImplements, context: any = {}) {
    this._actionIntercept = this.ls.getProvider(ACTION_INTERCEPT);
    this.invokeContext(context);
  }

  protected invokeContext(context: any = {}) {
    this._actionPropos = context.actionPropos;
    this._builder = context.builder;
    this._builderField = context.builderField;
    this._instance = this.builderField && this.builderField.instance;
    this._actionResult = context.actionEvent;
  }

  public createAction(action: string | Action) {
    return serializeAction(action);
  }

  get builderField(): BuilderFieldExtensions {
    return this._builderField;
  }

  get actionIntercept(): ActionIntercept {
    return this._actionIntercept;
  }

  get builder(): BuilderModelExtensions {
    return this._builder;
  }

  get instance(): InstanceExtensions {
    return this._instance;
  }

  get actionPropos(): Action {
    return this._actionPropos;
  }

  get actionEvent(): T {
    return this._actionResult;
  }
}
