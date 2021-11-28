import { isEmpty } from 'lodash';
import { BasicExtension, CallBackOptions } from '../basic/basic.extension';
import { createActions } from './create-actions';

export class ActionExtension extends BasicExtension {
  protected extension() {
    const eachCallback = this.createFieldAction.bind(this);
    const handler = this.eachFields.bind(this, this.jsonFields, eachCallback);
    this.pushCalculators(this.json, {
      action: { type: 'loadAction', handler },
      dependents: { type: 'loadViewModel', fieldId: this.builder.id }
    });
  }

  private createFieldAction([jsonField, builderField]: CallBackOptions) {
    const { actions = [] } = jsonField;
    const { id, field } = builderField;
    if (!isEmpty(actions)) {
      const events = createActions(this.toArray(actions), { builder: this.builder, id }, { ls: this.ls });
      this.defineProperty(builderField, 'events', events);
    }
    delete field.actions;
  }
}

