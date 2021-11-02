import React from 'react';
import { useElement } from '../hooks';
import { RenderElementProps } from './type-api';

export const RenderElement = (componentProps: RenderElementProps) => {
  const { field: { element: Element = <></> } } = componentProps;
  const elementProps = useElement(componentProps);

  return <Element {...elementProps} />;
};
