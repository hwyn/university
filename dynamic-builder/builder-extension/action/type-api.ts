import { Observable } from 'rxjs';
import { BuilderField, BuilderModelImplements } from '../../builder';
import { BuilderFieldExtensions } from '../type-api';

// eslint-disable-next-line max-len
export type TypeEvent = 'load' | 'dataSource' | 'calculator-datasource' | 'calculator' | 'click' | 'change' | 'focus' | 'blur' | 'keyUp' | 'keyDown' | string;

export type EventHandler = (builderField: BuilderFieldExtensions, runObservable?: boolean) => any | Observable<any> | undefined;

export interface ActionInterceptProps {
  builder: BuilderModelImplements;
  id: string;
}
export interface Calculator {
  dependent: { fieldId: string, type: TypeEvent };
  // eslint-disable-next-line no-use-before-define
  action: Action;
  targetId: string;
}

export interface Action {
  type: TypeEvent;
  name?: string | undefined;
  intercept?: string | undefined;
  params?: any;
  stop?: boolean;
  handler?: (...arg: any[]) => any;
}

export interface BuilderFieldAction extends BuilderField {
  actions: Action[];
}

export interface ActionContext {
  builder?: BuilderModelImplements;
  builderField?: BuilderField;
}

export interface ActionIntercept {
  invoke(action: Action, props?: ActionInterceptProps, event?: any, otherEventParam?: any[]): Observable<any>;
  executeAction(
    action: string | Action,
    actionContext?: ActionContext,
    event?: Event | any,
    otherEventParam?: any[]
  ): Observable<any>;
}
