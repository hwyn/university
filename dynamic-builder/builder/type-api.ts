/* eslint-disable no-use-before-define */
import { LocatorStorage, Type } from '@di';
import { Observable, Subject } from 'rxjs';

import { Grid } from '../builder-extension';
import { Action } from '../builder-extension/action';

export interface CacheObj {
  [x: string]: any;
  lifeActions: { [key: string]: any };
  fields: BuilderField[];
  destoryed: boolean;
  ready: boolean;
  destory: () => void;
  addChild: (child: BuilderModelImplements) => void;
  removeChild: (child: BuilderModelImplements) => void;
  detectChanges: Subject<any>;
  extensionDestorys: any[];
}
interface Field {
  [key: string]: any;
  visibility?: boolean;
}

export interface Instance {
  current: any;
  destory: Subject<any>;
  onMounted: (id: string) => void;
  onDestory: (id: string) => void;
  detectChanges(): void;
}

export interface BuilderElement {
  instance?: any;
  builder?: BuilderModelImplements;
}

export interface BuilderField extends Field {
  id: string;
  type: string;
  element: any;
  field: Field;
}

export interface BuilderJsonField {
  id: string;
  type: string;
  actions?: Action[];
  [key: string]: any;
}

export type extensionProviders = { extension: any, needExtends?: boolean };

export interface BuilderProps extends BuilderElement {
  id?: string;
  className?: string;
  builder?: BuilderModelImplements;
  BuilderModel?: Type<BuilderModelImplements>;
  extensionProviders?: extensionProviders[];
  events?: { [key: string]: (params?: any) => Observable<any> };
  children?: any;
  jsonName?: string;
  jsonNameAction?: string;
  configAction?: string;
  config?: BuilderJsonField[] | {
    grid?: Grid;
    fields: BuilderJsonField[];
    actions?: Action[];
  };
}


export interface BuilderModelImplements {
  parent: BuilderModelImplements | null;
  readonly $$cache: CacheObj;
  readonly root: BuilderModelImplements;
  readonly id: string | undefined;
  readonly ready: boolean | undefined;
  readonly children: BuilderModelImplements[];
  readonly fields: BuilderField[];
  readonly grid?: Grid;
  readonly Element: any;
  readonly ls: LocatorStorage;
  readonly extensionProviders?: extensionProviders[];
  getFieldByTypes<T = BuilderField>(id: string): T[];
  getAllFieldByTypes<T = BuilderField>(id: string): T[];
  getFieldById<T = BuilderField>(id: string | undefined): T;
  getAllFieldById<T = BuilderField>(id: string): T[];
  detectChanges(): void;
}
