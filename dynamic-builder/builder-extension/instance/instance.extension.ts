import { Subject } from 'rxjs';

import { Instance } from '../..//builder';
import { BasicExtension, CallBackOptions } from '../basic/basic.extension';
import { BuilderFieldExtensions } from '../type-api';

export class InstanceExtension extends BasicExtension {
  private buildFieldList: BuilderFieldExtensions[] = [];

  static createInstance(): Instance {
    return {
      current: null,
      mounted: new Subject<any>(),
      destory: new Subject<any>(),
      detectChanges: () => undefined,
    };
  }

  protected extension() {
    this.buildFieldList = this.mapFields(this.jsonFields, this.addInstance.bind(this));
    const handler = this.eachFields.bind(this, this.jsonFields, this.createInstanceLife.bind(this));
    this.pushCalculators(this.json, {
      action: this.bindCalculatorAction(handler),
      dependents: { type: 'loadAction', fieldId: this.builder.id }
    });
  }

  private createInstanceLife([, builderField]: CallBackOptions) {
    const { instance,  events = {}, instance: { mounted, destory } } = builderField;
    const { onMounted, onDestory } = events;
    let mountedIsEnd = false;
    destory.subscribe((id) => {
      instance.current = null;
      mountedIsEnd = false;
      instance.detectChanges = () => undefined;
      if (onDestory) { onDestory(id); }
    });
    mounted.subscribe((id: string) => {
      if (onMounted && !mountedIsEnd) { onMounted(id); }
      mountedIsEnd = true;
    });
    Object.defineProperty(instance, 'current', this.getCurrentProperty(builderField));
    delete events.onMounted;
    delete events.onDestory;
  }

  private getCurrentProperty({ instance, id }: BuilderFieldExtensions) {
    let _current: any;
    const get = () => _current;
    const set = (current: any) => {
      const hasMounted = !!current && _current !== current;
      _current = current;
      if (hasMounted) { instance.mounted.next(id); }
    };
    return { get, set };
  }

  private addInstance([, builderField]: CallBackOptions) {
    this.defineProperty(builderField, 'instance', InstanceExtension.createInstance());
  }

  public destory() {
    this.buildFieldList.forEach((buildField: BuilderFieldExtensions) => {
      const { instance } = buildField;
      instance.destory.unsubscribe();
      instance.mounted.unsubscribe();
      instance.detectChanges = () => undefined;
      this.defineProperty(buildField, 'instance', null);
      this.defineProperty(instance, 'current', null);
    });
    return super.destory();
  }
}
