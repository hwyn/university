/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-use-before-define */
import { isEmpty } from 'lodash';
import {Observable, Subject, } from 'rxjs';
import { tap } from 'rxjs/operators';

import { BUILDER_EXTENSION, LOAD_BUILDER_CONFIG } from '../token';
import { observableMap, toForkJoin, transformObservable, withValue } from '../utility';
import { BuilderEngine } from './builder-engine.service';
import { BuilderField, BuilderModelImplements, BuilderProps } from './type-api';

export function init(this: BuilderModelImplements) {
  Object.defineProperty(this, '$$cache', withValue(getCacheObj.call(this, {})));
  Object.defineProperties(this, {
    onChange: withValue(() => { }),
    onDestory: withValue(this.$$cache.destory.bind(this)),
    loadForBuild: withValue((props: BuilderProps) => {
      delete (this as any).loadForBuild;
      Object.defineProperty(this, 'privateExtension', withValue(props.privateExtension || []));
      props.builder && addChild.call(props.builder, this);
      loadForBuild.call(this, props).subscribe(() => this.detectChanges());
      return this;
    })
  });
}

function loadForBuild(this: BuilderModelImplements | any, props: BuilderProps): Observable<object> {
  const LoadConfig = this.ls.getProvider(LOAD_BUILDER_CONFIG);
  const privateExtension = this.privateExtension.map(({ extension }: any) => extension);
  const Extensions: any[] = [...this.ls.getProvider(BUILDER_EXTENSION), ...privateExtension];
  return new LoadConfig(this, props, this.$$cache).init().pipe(
    observableMap((loadExample: any) => {
      Object.defineProperty(this, '$$cache', withValue(getCacheObj.call(this, props)));
      const beforeInits = Extensions.map((Extension) => new Extension(this, props, this.$$cache, props.config).init());
      return toForkJoin([loadExample, ...beforeInits]);
    }),
    observableMap((examples: any[]) => toForkJoin(examples.map((example) => example.afterInit()))),
    tap((beforeDestorys) => {
      this.$$cache.ready = true;
      this.$$cache.beforeDestorys = beforeDestorys;
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
  const { id, type, visibility, ...other } = field;
  const element = field.element || this.ls.getProvider(BuilderEngine).getUiComponent(type);
  return { id, type, element, visibility, field: other };
}

function destory(this: BuilderModelImplements | any): void {
  const cacheObj = this.$$cache;
  const { beforeDestorys = [], ready = false, destoryed } = cacheObj;
  cacheObj.destoryed = true;
  if (ready && !destoryed) {
    try {
      toForkJoin(beforeDestorys.map((beforeDestory: any) => beforeDestory && beforeDestory())).pipe(
        observableMap((extensionDestorys: any[]) => toForkJoin(extensionDestorys.map(
          (extensionDestory) => extensionDestory && extensionDestory()
        ))),
        observableMap(() => transformObservable(this.destory && this.destory.call(this)))
      ).subscribe(() => {
        cacheObj.ready = false;
        cacheObj.fields.splice(0);
        cacheObj.detectChanges.unsubscribe();
        cacheObj.beforeDestorys.splice(0);
        this.children.splice(0);
        this.privateExtension?.splice(0);
        this.parent && removeChild.call(this.parent, this);
      }, (e) => {
        console.error(e);
      });
    } catch (e) {
      console.error(e);
    }
  }
}

function extendsProviders(this: BuilderModelImplements, child: BuilderModelImplements) {
  this.privateExtension?.forEach((extensionProvider) => {
    const { needExtends, extension: parentExtension } = extensionProvider;
    if (needExtends && !child.privateExtension?.some(({ extension }) => extension === parentExtension)) {
      child.privateExtension?.push(extensionProvider);
    }
  });
}

function addChild(this: BuilderModelImplements, child: BuilderModelImplements): void {
  child.parent = this;
  this.children.push(child);
  !isEmpty(this.privateExtension) && extendsProviders.call(this, child);
}

function removeChild(this: BuilderModelImplements, child: BuilderModelImplements): void {
  this.children.splice(this.children.indexOf(child), 1);
  child.parent = null;
}
