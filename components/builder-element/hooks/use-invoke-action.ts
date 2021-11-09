import { ActionIntercept, ACTION_INTERCEPT, serializeAction } from 'dynamic-builder';
import { useEffect, useState } from 'react';
import { ElementProps } from '../builder';

export const useInvokeAction = <T = any>(actionName: string = ``, props: ElementProps): [T] => {
  const { ls, builder, id } = props;
  const actionIntercept: ActionIntercept = ls.getProvider(ACTION_INTERCEPT);
  const action = actionName ? actionIntercept.invoke(serializeAction(actionName), { builder, id }) : null;
  let value: any = void(0);
  if (action) {
    action.subscribe((result) => value = result);
  }
  const [content, setContent] = useState(value);
  useEffect(() => setContent(value), [value]);

  return [content as unknown as T];
};
