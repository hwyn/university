import { LocatorStorage } from '@di';
import { groupBy } from 'lodash';
import { forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { ACTION_INTERCEPT } from '../../token';
import { transformObservable } from '../../utility';
import { Action, ActionIntercept, ActionInterceptProps } from './type-api';

export interface CreateOptions {
  ls: LocatorStorage;
  interceptFn?: (...args: any[]) => any;
  handlerCallBack?: (...args: any) => void;
}

function mergeHandler(actions: Action[], props: ActionInterceptProps, options: CreateOptions) {
  const actionIntercept: ActionIntercept = options.ls.getProvider(ACTION_INTERCEPT);
  actions.length > 1 && console.warn(`${props.id} Repeat listen event: ${actions[0].type}`);
  return (event?: Event, ...arg: any[]) => {
    const runObservable = actions.some(({ runObservable = false }) => runObservable);
    const { interceptFn = () => event, handlerCallBack } = options;
    const obs = transformObservable(interceptFn(props, event, ...arg)).pipe(
      switchMap((value) => forkJoin(
        actions.map((action) => actionIntercept.invoke(action, props, value, ...arg))
      )),
      map((result: any[]) => result.pop())
    );
    return runObservable ? obs : obs.subscribe(handlerCallBack);
  };
}

export function getEventType(type: string) {
  return `on${type[0].toUpperCase()}${type.slice(1)}`;
}

export const createActions = (
  actions: Action[],
  props: ActionInterceptProps,
  options: CreateOptions
): { [key: string]: (event?: Event, ...arg: any[]) => any } => {
  const events = groupBy(actions, 'type');
  return Object.keys(events).reduce((obj, type) => ({
    ...obj,
    [getEventType(type)]: mergeHandler(events[type], props, options)
  }), {});
};
