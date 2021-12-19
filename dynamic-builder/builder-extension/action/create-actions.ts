import { LocatorStorage } from '@di';
import { groupBy } from 'lodash';
import { switchMap } from 'rxjs/operators';

import { ACTION_INTERCEPT } from '../../token';
import { transformObservable } from '../../utility';
import { Action as ActionIntercept } from './actions';
import { Action, ActionInterceptProps } from './type-api';

export interface CreateOptions { ls: LocatorStorage; interceptFn?: (...args: any[]) => any; }

function mergeHandler(actions: Action[], props: ActionInterceptProps, options: CreateOptions) {
  const { ls } = options;
  const actionIntercept = ls.getProvider<ActionIntercept>(ACTION_INTERCEPT);
  actions.length > 1 && console.warn(`${props.id} Repeat listen event: ${actions[0].type}`);
  return (event?: Event, ...arg: any[]) => {
    const { interceptFn = () => event } = options;
    const runObservable = actions.some(({ runObservable = false }) => runObservable);
    const obs = transformObservable(interceptFn(props, event, ...arg)).pipe(
      switchMap((value) => actionIntercept.invoke(actions, props, value, ...arg)),
    );
    return runObservable ? obs : obs.subscribe();
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
