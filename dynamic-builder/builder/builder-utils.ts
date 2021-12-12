/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-use-before-define */
import { forkJoin, Observable, of, Subject, } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import { BUILDER_EXTENSION } from '../token';
import { transformObservable, withValue } from '../utility';
import { BuilderEngine } from './builder-engine.service';
import { BuilderField, BuilderModelImplements, BuilderProps } from './type-api';

export function init(this: BuilderModelImplements) {
  Object.defineProperty(this, '$$cache', withValue(getCacheObj.call(this, {})));
  Object.defineProperties(this, {
    onChanges: withValue(() => { }),
    onDestory: withValue(this.$$cache.destory.bind(this)),
    loadForBuild: withValue((props: BuilderProps) => {
      delete (this as any).loadForBuild;
      loadForBuild.call(this, props).subscribe(() => this.detectChanges());
      return this;
    })
  });
}

function loadForBuild(this: BuilderModelImplements | any, props: BuilderProps): Observable<object> {
  const Extensions: any[] = this.ls.getProvider(BUILDER_EXTENSION);
  const examples: any[] = [];
  let config = props.config;
  props.builder && addChild.call(props.builder, this);
  return Extensions.reduce((before: Observable<any>, Extension: any) => before.pipe(switchMap(() => {
    if (config !== props.config) {
      config = props.config;
      Object.defineProperty(this, '$$cache', withValue(getCacheObj.call(this, config || {})));
    }
    const example = new Extension(this, props, this.$$cache, props.config);
    examples.push(example);
    return example.beforeInit();
  })), of(null)).pipe(
    switchMap(() => forkJoin(examples.map((example) => example.init()))),
    switchMap(() => forkJoin(examples.map((example) => example.afterInit()))),
    tap((extensionDestorys) => this.$$cache.extensionDestorys = extensionDestorys || []),
    tap(() => {
      this.$$cache.ready = true;
      this.$$cache.destoryed && destory.apply(this);
    })
  );
}

function getCacheObj(this: BuilderModelImplements, { fields = [] }: any): any {
  const {
    ready = false,
    destoryed = false,
    onChanges = new Subject<any>(),
    detectChanges = new Subject<any>(),
    destory: modelDestory = destory.bind(this),
    addChild: modelAddChild = addChild.bind(this),
    removeChild: modelRemoveChild = removeChild.bind(this)
  } = this.$$cache || {};

  return {
    ready,
    destoryed,
    onChanges,
    detectChanges,
    destory: modelDestory,
    addChild: modelAddChild,
    removeChild: modelRemoveChild,
    fields: fields.map(createField.bind(this)),
  };
}

function createField(this: BuilderModelImplements, field: any): BuilderField {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, type, calculators, ...other } = field;
  const element = this.ls.getProvider(BuilderEngine).getUiComponent(type);

  return { id, type, element, field: other };
}

function destory(this: BuilderModelImplements | any): void {
  const cacheObj = this.$$cache;
  const { extensionDestorys = [], ready = false, destoryed } = cacheObj;
  cacheObj.destoryed = true;
  if (ready && !destoryed) {
    try {
      forkJoin([...extensionDestorys].map(
        (extensionDestory) => extensionDestory && extensionDestory()
      )).pipe(
        switchMap(() => transformObservable(this.destory && this.destory.call(this)))
      ).subscribe(() => {
        cacheObj.ready = false;
        cacheObj.fields.splice(0);
        cacheObj.onChanges.unsubscribe();
        cacheObj.detectChanges.unsubscribe();
        cacheObj.extensionDestorys.splice(0);
        this.children.splice(0);
        removeChild.call(this.parent, this);
      });
    } catch (e) {
      console.error(e);
    }
  }
}

function addChild(this: BuilderModelImplements, child: BuilderModelImplements): void {
  this?.children.push(child);
  child.parent = this;
}

function removeChild(this: BuilderModelImplements, child: BuilderModelImplements): void {
  this?.children.splice(this.children.indexOf(child), 1);
  child.parent = null;
}
