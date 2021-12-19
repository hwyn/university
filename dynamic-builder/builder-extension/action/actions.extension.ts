import { isEmpty } from 'lodash';

import { BasicExtension, CallBackOptions } from '../basic/basic.extension';
import { ADD_EVENT_LISTENER, LOAD_ACTION, LOAD_VIEW_MODEL } from '../constant/calculator.constant';
import { BuilderFieldExtensions } from '../type-api';
import { Action } from './type-api';

export class ActionExtension extends BasicExtension {
  private fields: BuilderFieldExtensions[] = [];
  protected extension() {
    const eachCallback = this.create.bind(this);
    const handler = this.eachFields.bind(this, this.jsonFields, eachCallback);
    this.pushCalculators(this.json, {
      action: { type: LOAD_ACTION, handler },
      dependents: { type: LOAD_VIEW_MODEL, fieldId: this.builder.id }
    });
  }

  private create([jsonField, builderField]: CallBackOptions) {
    const { actions = [] } = jsonField;
    this.defineProperty(builderField, ADD_EVENT_LISTENER, this.addFieldEvent.bind(this, builderField));
    if (!isEmpty(actions)) builderField.addEventListener(actions);
    this.fields.push(builderField);
    delete builderField.field.actions;
  }

  private addFieldEvent(builderField: BuilderFieldExtensions, actions: Action | Action[]) {
    const { events = {}, id } = builderField;
    const addActions = this.toArray(actions).filter(({ type }) => !events[this.getEventType(type)]);
    if (!isEmpty(addActions)) {
      const addEvents = this.createActions(this.toArray(addActions), { builder: this.builder, id }, { ls: this.ls });
      this.defineProperty(builderField, 'events', Object.assign(events, addEvents));
      builderField.instance.detectChanges();
    }
  }

  destory() {
    this.fields.forEach((field) => this.unDefineProperty(field, ['events', 'ADD_EVENT_LISTENER']));
    super.destory();
  }
}
