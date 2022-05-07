import { LocatorStorage } from '@di';
import { flatMap, isEmpty, uniq } from 'lodash';

import { init } from './builder-utils';
import { Visibility } from './consts';
import { BuilderField, BuilderModelImplements, CacheObj } from './type-api';

export class BuilderModel<
  S extends BuilderModelImplements = BuilderModelImplements,
  M extends BuilderField = BuilderField
  > implements BuilderModelImplements {
  public id: string | undefined;
  public parent: S | null = null;
  public children: S[] = [];
  public $$cache: CacheObj = {} as unknown as CacheObj;
  public Element!: any;

  constructor(public ls: LocatorStorage) {
    init.call(this);
  }

  public getFieldByTypes<T = M>(type: string): T[] {
    const { fields = [] } = this.$$cache;
    return fields.filter(({ type: fieldType }) => fieldType === type) as any[];
  }

  public getAllFieldByTypes<T = M>(type: string): T[] {
    const fields = this.getFieldByTypes<T>(type);
    this.children.forEach((child) => fields.push(...child.getAllFieldByTypes<T>(type)));
    return fields;
  }

  public getFieldById<T = M>(id: string): T {
    const hasSelf = id === this.id && !!this.parent;
    const { fields = [] } = this.$$cache;
    return hasSelf ? this.parent?.getFieldById(id) : fields.find(({ id: fieldId }) => fieldId === id) as any;
  }

  public getAllFieldById<T = M>(id: string): T[] {
    const fields: T[] = flatMap(this.children.map((child) => child.getAllFieldById(id)));
    fields.push(this.getFieldById(id));
    return uniq(fields.filter((field) => !isEmpty(field)));
  }

  public detectChanges() {
    if (!this.$$cache.destoryed) {
      this.$$cache.detectChanges.next(undefined);
    }
  }

  public get ready(): boolean {
    return this.$$cache.ready;
  }

  public get root(): S {
    return (this.parent ? this.parent.root : this) as S;
  }

  public get fields(): M[] {
    const { fields = [] } = this.$$cache;
    return fields.filter(({ visibility }) => this.showField(visibility)) as M[];
  }

  public showField(visibility: Visibility | undefined): boolean {
    return visibility === undefined || visibility !== Visibility.none;
  }
}
