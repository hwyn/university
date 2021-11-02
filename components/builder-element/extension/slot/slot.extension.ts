import { BaseAction, BasicExtension, BuilderFieldExtensions,  BuilderProps as BuilderPropsImp  } from 'dynamic-builder';
import { isEmpty } from 'lodash';
import React from 'react';

interface BuilderProps extends BuilderPropsImp {
  children?: React.ReactElement;
}


export class SlotExtension extends BasicExtension {
  private slotFields: BuilderFieldExtensions[] = [];

  protected extension() {
    const slotJsonFields = this.jsonFields.filter(({ slot }) => !!slot);
    if (!!slotJsonFields.length) {
      this.slotFields = this.mapFields(slotJsonFields, ([, { field }]) => { delete field.slot; });
      this.pushCalculators(this.json, {
        action: this.bindCalculatorAction(this.createChangeAction.bind(this)),
        dependents: [{ type: 'change', fieldId: this.builder.id }]
      });
    }
  }

  private createChangeAction({ actionEvent: { children } }: BaseAction<BuilderProps>): void {
    if (!!children && !isEmpty(children)) {
      this.slotFields.forEach(({ field }) => field.children = React.cloneElement(children, { builder: this.builder }));
    }
  }

  protected destory() {
    this.slotFields.forEach(({ field }) => delete field.children);
    return super.destory();
  }
}
