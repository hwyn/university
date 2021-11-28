import { isEmpty } from 'lodash';
import { LocatorStorageImplements } from '@di';
import { init } from './builder-utils';
import { BuilderField, BuilderModelImplements, BuilderProps, CacheObj } from './type-api';

export class BuilderModel implements BuilderModelImplements {
  public id: string | undefined;
  public parent: BuilderModelImplements | null = null;
  public children: BuilderModelImplements[] = [];
  public $$cache: CacheObj = {} as unknown as CacheObj;
  public ls!: LocatorStorageImplements;
  public Element!: any;

  constructor(ls: LocatorStorageImplements, props: BuilderProps) {
    this.ls = props.builder?.ls || ls;
    init.call(this, props);
  }

  public getFieldByTypes<T = BuilderField>(type: string): T[] {
    const { fields = [] } = this.$$cache;
    return fields.filter(({ type: fieldType }) => fieldType === type) as any[];
  }

  public getAllFieldByTypes<T = BuilderField>(type: string): T[] {
    const fields = this.getFieldByTypes<T>(type);
    this.children.forEach((child) => fields.push(...child.getAllFieldByTypes<T>(type)));
    return fields;
  }

  public getFieldById<T = BuilderField>(id: string): T {
    const hasSelf = id === this.id && !!this.parent;
    const { fields = [] } = this.$$cache;
    return hasSelf ? this.parent?.getFieldById(id) : fields.find(({ id: fieldId }) => fieldId === id) as any;
  }

  public getAllFieldById<T = BuilderField>(id: string): T[] {
    const fields: T[] = this.children.map((child) => child.getFieldById(id));
    fields.push(this.getFieldById(id));
    return fields.filter((field) => !isEmpty(field));
  }

  public detectChanges() {
    this.$$cache.detectChanges.next(undefined);
  }

  public get ready(): boolean {
    return this.$$cache.ready;
  }

  public get root(): BuilderModelImplements {
    return this.parent ? this.parent.root : this;
  }

  public get fields(): BuilderField[] {
    const { fields = [] } = this.$$cache;
    return fields.filter(({ field }) => !field.visibility);
  }
}
