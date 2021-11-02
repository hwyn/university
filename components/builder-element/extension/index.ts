import { FormControl } from '@university/common/form/form-control';
import { BIND_BUILDER_ELEMENT, BIND_FORM_CONTROL, BUILDER_EXTENSION, Grid, Provider, registryProvider } from 'dynamic-builder';
import { createElement } from 'react';
import { BuilderLayout, RenderPropsModel } from '../grid';
import { ListExtension } from './list/list.extension';
import { SlotExtension } from './slot/slot.extension';

const factoryFormControl = (value: any) => new FormControl(value);
const factoryBuilderLayout = (grid: Grid) => (props: RenderPropsModel) => createElement(BuilderLayout, { grid, ...props });

registryProvider([
  { provide: BIND_FORM_CONTROL, useValue: factoryFormControl },
  { provide: BIND_BUILDER_ELEMENT, useValue: factoryBuilderLayout }
]);

export const builderExtensions: Provider[] = [
  { provide: BUILDER_EXTENSION, multi: true, useValue: ListExtension },
  { provide: BUILDER_EXTENSION, multi: true, useValue: SlotExtension },
];
