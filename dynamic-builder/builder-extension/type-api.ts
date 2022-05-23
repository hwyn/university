import { BuilderField, BuilderModelInterface, Instance, Model } from '../builder';
import { Action, BuilderFieldAction, ExecuteHandler, TypeEvent } from './action';
import { BuilderFormField } from './form/type-api';
import { BuilderViewModel } from './view-model/type-api';

type Column = boolean | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 'auto' | 11 | 12 | undefined;
type Spacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type AlignItems = 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
type Justify = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';

export interface Additional {
  group: number;
  justify?: Justify;
  spacing?: Spacing;
  alignItems?: AlignItems;
  additional?: string;
  className?: string;
  // eslint-disable-next-line no-use-before-define
  fieldRows: BuilderFieldExtensions[][];
}

interface Layout {
  group?: number;
  row?: number;
  column: Column;
}

export interface CalculatorsDependent {
  fieldId?: string;
  type: TypeEvent;
}

export interface Calculators {
  action: Action;
  dependents: CalculatorsDependent[] | CalculatorsDependent;
}

export interface OriginCalculators {
  targetId: string;
  action: Action;
  dependent: CalculatorsDependent;
}

// tslint:disable-next-line:no-empty-interface
export interface InstanceExtensions extends Instance {
  props?: any;
}

export interface ControlConfig {
  name: string;
  value?: any;
  changeType?: TypeEvent;
}

export interface GridType {
  spacing: Spacing;
  justify: Justify;
  alignItems: AlignItems;
  groups: Column[];
  element?: any;
  className?: string;
  style?: { [key: string]: string };
  additional?: Additional[];
}

export interface BuilderFieldDataSource extends BuilderField {
  dataSource: Calculators & {
    metadata?: { label: string, value: string },
    source?: any;
  };
}

export interface BuilderFieldList extends BuilderField {
  target: InstanceExtensions;
}

export interface BuilderFieldExtensions
  extends BuilderFormField, BuilderFieldAction, BuilderFieldList, BuilderField {
  instance: InstanceExtensions;
  calculators: Calculators[];
  layout: Layout;
  metadata?: { [key: string]: any };
  dataSource: Calculators & {
    metadata?: { [key: string]: string },
    source?: any;
  };
}

export interface BuilderModelExtensions
  extends BuilderModelInterface, BuilderViewModel, Model<BuilderModelExtensions, BuilderFieldExtensions> {
  readonly grid: GridType;
  calculators: OriginCalculators[];
  nonSelfCalculators: OriginCalculators[];
  getExecuteHandler: (actionName: string) => undefined | ExecuteHandler;
}

