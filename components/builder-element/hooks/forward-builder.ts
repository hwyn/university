import { Type } from '@di';
import { BuilderModel, BuilderProps} from 'dynamic-builder';
import React from 'react';
import { Builder } from '../builder/builder';

export const forwardBuilder = <T extends BuilderModel>(Model: Type<T>, props: BuilderProps) => {
  return (_props: BuilderProps) => React.createElement(Builder, { BuilderExtensionModel: Model, ...props, ..._props });
};
