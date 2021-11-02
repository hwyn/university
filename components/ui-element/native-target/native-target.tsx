import React from 'react';
import { ElementProps, useInvokeAction } from '../../builder-element';

export interface NativeTargetProps extends ElementProps {
  text?: string;
  textAction?: string;
  className: string;
  component: any;
}

export const NativeTarget = (props: NativeTargetProps) => {
  const {
    id,
    ls,
    text,
    textAction,
    builder,
    events,
    instance,
    component: Component = 'span',
    ...others
  } = props;
  const [label = text] = useInvokeAction(textAction, props);

  return (
    <Component ref={instance} {...events} {...others}>
      {label}
    </Component>
  );
};
