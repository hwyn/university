import { forkJoin, Observable, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { transformObservable } from 'university/dynamic-builder/utility';

import { BuilderModel, Instance } from '../..//builder';
import { BaseAction } from '../action';
import { BasicExtension, CallBackOptions } from '../basic/basic.extension';
import { CURRENT, DESTORY, INSTANCE, LOAD_ACTION, MOUNTED } from '../constant/calculator.constant';
import { BuilderFieldExtensions } from '../type-api';

export class InstanceExtension extends BasicExtension {
  private buildFieldList: BuilderFieldExtensions[] = [];

  static createInstance(): Instance {
    return {
      current: null,
      destory: new Subject<any>(),
      onMounted: () => void (0),
      onDestory: () => void (0),
      detectChanges: () => undefined,
    };
  }

  protected extension() {
    this.buildFieldList = this.mapFields(this.jsonFields, this.addInstance.bind(this));
    const handler = this.eachFields.bind(this, this.jsonFields, this.createInstanceLife.bind(this));
    this.pushCalculators(this.json, [{
      action: this.bindCalculatorAction(handler),
      dependents: { type: LOAD_ACTION, fieldId: this.builder.id }
    }]);
  }

  // eslint-disable-next-line max-lines-per-function
  private createInstanceLife([, builderField]: CallBackOptions) {
    builderField.addEventListener([{ type: DESTORY }, { type: MOUNTED }]);
    const { instance, events = {} } = builderField;
    const { onDestory, onMounted } = events;

    this.defineProperty(instance, this.getEventType(DESTORY), onDestory);
    this.defineProperty(instance, this.getEventType(MOUNTED), onMounted);
    Object.defineProperty(instance, CURRENT, this.getCurrentProperty(builderField));
    delete events.onMounted;
    delete events.onDestory;
  }

  private getCurrentProperty({ instance, id }: BuilderFieldExtensions) {
    let _current: any;
    const get = () => _current;
    const set = (current: any) => {
      const hasMounted = !!current && _current !== current;
      _current = current;
      if (hasMounted) { instance.onMounted(id); }
    };
    return { get, set };
  }

  private addInstance([jsonField, builderField]: CallBackOptions) {
    const instance = InstanceExtension.createInstance();
    this.defineProperty(builderField, INSTANCE, instance);
    const destoryHandler = ({ actionEvent }: BaseAction) => {
      const currentIsBuildModel = instance.current instanceof BuilderModel;
      instance.current && (instance.current = null);
      instance.detectChanges = () => undefined;
      !currentIsBuildModel && instance.destory.next(actionEvent);
    }

    this.pushCalculators(jsonField, {
      action: this.bindCalculatorAction(destoryHandler),
      dependents: { type: DESTORY, fieldId: jsonField.id }
    })
  }

  protected beforeDestory() {
    return forkJoin(this.buildFieldList.map(({ id, instance }) => new Observable((subscribe) => {
      instance.destory.subscribe(() => {
        subscribe.next(id);
        subscribe.complete();
      });
    }))).pipe(switchMap(() => transformObservable(super.beforeDestory())));
  }

  public destory() {
    this.buildFieldList.forEach((buildField: BuilderFieldExtensions) => {
      const { instance } = buildField;
      instance.destory.unsubscribe();
      this.unDefineProperty(instance, [
        'detectChanges',
        this.getEventType(DESTORY),
        this.getEventType(MOUNTED),
        CURRENT
      ]);
      this.defineProperty(buildField, INSTANCE, null);
    });
    return super.destory();
  }
}
