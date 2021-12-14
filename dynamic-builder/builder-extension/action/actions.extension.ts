import { isEmpty } from 'lodash';

import { BasicExtension, CallBackOptions } from '../basic/basic.extension';
import { LOAD_ACTION, LOAD_VIEW_MODEL } from '../constant/calculator.constant';
import { createActions } from './create-actions';

export class ActionExtension extends BasicExtension {
  protected extension() {
    const eachCallback = this.createFieldAction.bind(this);
    const handler = this.eachFields.bind(this, this.jsonFields, eachCallback);
    this.builder.getExecuteHandler = this.createGetExecuteHandler();
    this.pushCalculators(this.json, {
      action: { type: LOAD_ACTION, handler },
      dependents: { type: LOAD_VIEW_MODEL, fieldId: this.builder.id }
    });
  }

  private createGetExecuteHandler() {
    const builder: any = this.builder;
    return (actionName: string) => { 
      const executeHandler = builder[actionName];
      return executeHandler && typeof executeHandler === 'function' ? executeHandler.bind(builder) : undefined;
    };
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

  protected destory() {
    this.unDefineProperty(this.builder, ['getExecuteHandler']);
    super.destory();
  }
}
