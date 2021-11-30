/* eslint-disable no-multi-assign */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-use-before-define */
import { cloneDeep, isEmpty } from 'lodash';
import { forkJoin, Observable, of, Subject,  } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { BUILDER_EXTENSION } from '../token';
import { transformObservable, withValue } from '../utility';
import { BuilderEngine } from './builder-engine.service';
import { BuilderField, BuilderModelImplements, BuilderProps } from './type-api';

export function init(this: BuilderModelImplements, props: BuilderProps) {
  Object.defineProperty(this, '$$cache', withValue(getCacheObj.call(this, {})));
  Object.defineProperties(this, {
    onChanges: withValue(() => { }),
    onDestory: withValue(this.$$cache.destory.bind(this)),
    loadForBuild: withValue(() => {
      delete (this as any).loadForBuild;
      loadForBuild.call(this, props).subscribe(() => this.detectChanges());
      return this;
    })
  });
}

function loadForBuild(this: BuilderModelImplements | any, props: BuilderProps): Observable<object> {
  let builderJson: any;
  return getConfigJson.call(this, props).pipe(
    tap((json: any) => {
      builderJson = json;
      builderJson.id = this.id = builderJson.id || props.id;
      Object.defineProperty(this, '$$cache', withValue(getCacheObj.call(this, builderJson)));
      if (props.builder) {
        this.parent = props.builder;
        addChild.call(this.parent, this);
      }
    }),
    switchMap(() => forkJoin<any, any[]>(
      this.ls.getProvider(BUILDER_EXTENSION).map((Extension: any) => new Extension(this, props, this.$$cache, builderJson).init())
    )),
    switchMap((examples: any[]) => forkJoin(examples.map((example) => example.afterInit()))),
    tap((extensionDestorys) => {
      this.$$cache.extensionDestorys = extensionDestorys || [];
    }),
    tap(() => {
      this.$$cache.ready = true;
      if (this.$$cache.destoryed) {
        destory.apply(this);
      }
    })
  );
}

function getConfigJson(this: BuilderModelImplements, props: BuilderProps) {
  const { id, jsonName = ``, config } = props;
  const isJsonName = !!jsonName;
  const isJsConfig = !isEmpty(config);
  if (!isJsonName && !isJsConfig) {
    throw new Error(`Builder configuration is incorrect: ${id}`);
  }

  const configSub = isJsonName ?
    this.ls.getProvider(BuilderEngine).getJsonConfig(jsonName) :
    of(cloneDeep({ id, ...Array.isArray(config) ? { fields: config } : config }));

  return configSub.pipe(
    tap((json: any) => checkFieldRepeat.call(this, json.fields, json.id || props.id))
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
  const { extensionDestorys = [], ready = false } = cacheObj;
  cacheObj.destoryed = true;
  if (ready) {
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
        this.parent = null;
      });
    } catch (e) {
      console.error(e);
    }
  }
}

function addChild(this: BuilderModelImplements, child: BuilderModelImplements): void {
  this?.children.push(child);
}

function removeChild(this: BuilderModelImplements, child: BuilderModelImplements): void {
  this?.children.splice(this.children.indexOf(child), 1);
}

function checkFieldRepeat(this: BuilderModelImplements, fields: BuilderField[], jsonName: string | undefined) {
  const filedIds = [...new Set(fields.map(({ id }) => id))];
  if (filedIds.includes(<string>jsonName)) {
    throw new Error(`The same ID as jsonID exists in the configuration file: ${jsonName}`);
  }

  if (filedIds.length !== fields.length) {
    throw new Error(`The same ID exists in the configuration file: ${jsonName}`);
  }
}
