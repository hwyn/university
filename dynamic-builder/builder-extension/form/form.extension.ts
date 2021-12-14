import { get, isEmpty, set } from 'lodash';

import { BIND_FORM_CONTROL } from '../../token';
import { BaseAction } from '../action';
import { BasicExtension, CallBackOptions } from '../basic/basic.extension';
import { CHANGE, CONTROL, LOAD_ACTION } from '../constant/calculator.constant';
import { BuilderFieldExtensions } from '../type-api';

export class FormExtension extends BasicExtension {
  private builderFields: BuilderFieldExtensions[] = [];
  private defaultChangeType = CHANGE;

  protected extension() {
    this.builderFields = this.mapFields<BuilderFieldExtensions>(
      this.jsonFields.filter(({ dataBinding }: any) => !isEmpty(dataBinding)),
      this.createMergeControl.bind(this)
    );
  }

  private createMergeControl([jsonField, builderField]: CallBackOptions) {
    const { id } = builderField;

    this.pushCalculators(jsonField, [{
      action: this.bindCalculatorAction(this.createChangeHandler(builderField)),
      dependents: { type: this.getChangeType(jsonField), fieldId: id }
    }, {
      action: this.bindCalculatorAction(this.addControl.bind(this, jsonField, builderField)),
      dependents: { type: LOAD_ACTION, fieldId: this.builder.id }
    }]);
  }

  private addControl(jsonField: any, builderField: BuilderFieldExtensions) {
    const { viewModel } = this.builder;
    const { dataBinding: { path, default: defaultValue } } = jsonField;
    const value = get(viewModel, path, defaultValue);
    this.defineProperty(builderField, CONTROL, this.ls.getProvider(BIND_FORM_CONTROL, value));
    builderField.control.changeValues.subscribe((_value: any) => set(viewModel, path, _value));

    delete builderField.field.dataBinding;
    this.excuteChangeEvent(jsonField, value);
  }

  private createChangeHandler(builderField: BuilderFieldExtensions) {
    return ({ actionEvent }: BaseAction) => {
      const { target = {} } = actionEvent;
      builderField.control?.patchValue(target.value || actionEvent);
      builderField.instance?.detectChanges();
    };
  }

  private excuteChangeEvent(jsonField: any, value: any) {
    const { events = {} } = this.getBuilderFieldById(jsonField.id);
    return events[this.getEventType(this.getChangeType(jsonField))](value);
  }

  private getChangeType(jsonField: any) {
    const { dataBinding: { changeType = this.defaultChangeType } } = jsonField;
    return changeType;
  }

  public destory() {
    this.builderFields.forEach((builderField) => {
      builderField.control?.destory();
      this.defineProperty(builderField, CONTROL, null);
    });
    return super.destory();
  }
}
