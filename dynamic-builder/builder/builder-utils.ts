/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-use-before-define */
import { forkJoin, Observable, Subject, } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { BUILDER_EXTENSION, LOAD_BUILDER_CONFIG } from '../token';
import { transformObservable, withValue } from '../utility';
import { BuilderEngine } from './builder-engine.service';
import { BuilderField, BuilderModelImplements, BuilderProps } from './type-api';

export function init(this: BuilderModelImplements) {
  Object.defineProperty(this, '$$cache', withValue(getCacheObj.call(this, {})));
  Object.defineProperties(this, {
    onChange: withValue(() => { }),
    onDestory: withValue(this.$$cache.destory.bind(this)),
    loadForBuild: withValue((props: BuilderProps) => {
      delete (this as any).loadForBuild;
      loadForBuild.call(this, props).subscribe(() => this.detectChanges());
      return this;
    })
  });
}

function loadForBuild(this: BuilderModelImplements | any, props: BuilderProps): Observable<object> {
  const LoadConfig = this.ls.getProvider(LOAD_BUILDER_CONFIG);
  const Extensions: any[] = this.ls.getProvider(BUILDER_EXTENSION);
  props.builder && addChild.call(props.builder, this);
  return new LoadConfig(this, props, this.$$cache).init().pipe(
    switchMap((loadExample: any) => {
      Object.defineProperty(this, '$$cache', withValue(getCacheObj.call(this, props.config)));
      const beforeInits = Extensions.map((Extension) => new Extension(this, props, this.$$cache, props.config).init());
      return forkJoin(beforeInits).pipe(map((result: any[]) => [loadExample, ...result]));
    }),
    switchMap((examples: any[]) => forkJoin(examples.map((example) => example.afterInit()))),
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
    detectChanges = new Subject<any>(),
    destory: modelDestory = destory.bind(this),
    addChild: modelAddChild = addChild.bind(this),
    removeChild: modelRemoveChild = removeChild.bind(this)
  } = this.$$cache || {};

  return {
    ready,
    destoryed,
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
