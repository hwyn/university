/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-use-before-define */
import { isEmpty } from 'lodash';
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
      Object.defineProperty(this, 'extensionProviders', withValue(props.extensionProviders || []));
      props.builder && addChild.call(props.builder, this);
      loadForBuild.call(this, props).subscribe(() => this.detectChanges());
      return this;
    })
  });
}

function loadForBuild(this: BuilderModelImplements | any, props: BuilderProps): Observable<object> {
  const LoadConfig = this.ls.getProvider(LOAD_BUILDER_CONFIG);
  const extensionProviders = this.extensionProviders.map(({ extension }: any) => extension);
  const Extensions: any[] = [...this.ls.getProvider(BUILDER_EXTENSION), ...extensionProviders];
  return new LoadConfig(this, props, this.$$cache).init().pipe(
    switchMap((loadExample: any) => {
      Object.defineProperty(this, '$$cache', withValue(getCacheObj.call(this, props)));
      const beforeInits = Extensions.map((Extension) => new Extension(this, props, this.$$cache, props.config).init());
      return forkJoin(beforeInits).pipe(map((result: any[]) => [loadExample, ...result]));
    }),
    switchMap((examples: any[]) => forkJoin(examples.map((example) => example.afterInit()))),
    tap((beforeDestorys) => this.$$cache.beforeDestorys = beforeDestorys || []),
    tap(() => {
      this.$$cache.ready = true;
      this.$$cache.destoryed && destory.apply(this);
    })
  );
}

function getCacheObj(this: BuilderModelImplements, props: any): any {
  const { config: { fields = [] } = {} } = props;
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
  const element = typeof type !== 'string' ? type : this.ls.getProvider(BuilderEngine).getUiComponent(type);

  return { id, type, element, field: other };
}

function destory(this: BuilderModelImplements | any): void {
  const cacheObj = this.$$cache;
  const { beforeDestorys = [], ready = false, destoryed } = cacheObj;
  cacheObj.destoryed = true;
  if (ready && !destoryed) {
    try {
      forkJoin([...beforeDestorys].map(
        (beforeDestory) => beforeDestory && beforeDestory()
      )).pipe(
        switchMap((extensionDestorys: any[]) => forkJoin(extensionDestorys.map(
          (extensionDestory) => extensionDestory && extensionDestory()
        ))),
        switchMap(() => transformObservable(this.destory && this.destory.call(this)))
      ).subscribe(() => {
        console.log('destory', this.id);
        cacheObj.ready = false;
        cacheObj.fields.splice(0);
        cacheObj.detectChanges.unsubscribe();
        cacheObj.beforeDestorys.splice(0);
        this.children.splice(0);
        this.extensionProviders?.splice(0);
        this.parent && removeChild.call(this.parent, this);
      });
    } catch (e) {
      console.error(e);
    }
  }
}

function extendsProviders(this: BuilderModelImplements, child: BuilderModelImplements) {
  this.extensionProviders?.forEach((extensionProvider) => {
    const { needExtends, extension: parentExtension } = extensionProvider;
    if (needExtends && !child.extensionProviders?.some(({ extension }) => extension === parentExtension)) {
      child.extensionProviders?.push(extensionProvider);
    }
  });
}

function addChild(this: BuilderModelImplements, child: BuilderModelImplements): void {
  child.parent = this;
  this.children.push(child);
  !isEmpty(this.extensionProviders) && extendsProviders.call(this, child);
}

function removeChild(this: BuilderModelImplements, child: BuilderModelImplements): void {
  this.children.splice(this.children.indexOf(child), 1);
  child.parent = null;
}
