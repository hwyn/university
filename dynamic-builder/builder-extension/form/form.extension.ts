import { get, isEmpty, set } from 'lodash';

import { Visibility } from '../../builder';
import { BIND_FORM_CONTROL } from '../../token';
import { BaseAction } from '../action';
import { BasicExtension, CallBackOptions } from '../basic/basic.extension';
import { CHANGE, CHECK_VISIBILITY, CONTROL, LOAD_ACTION } from '../constant/calculator.constant';
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
    const { id, updateOn, checkVisibility, validators } = jsonField;
    const changeType = this.getChangeType(jsonField);
    this.pushCalculators(jsonField, [{
      action: this.bindCalculatorAction(this.addControl.bind(this, jsonField, builderField)),
      dependents: { type: LOAD_ACTION, fieldId: this.builder.id }
    }, {
      action: this.bindCalculatorAction(this.createChange()),
      dependents: { type: changeType, fieldId: id }
    },
    ...checkVisibility ? [{
      action: this.bindCalculatorAction(this.createVisibility()),
      dependents: { type: CHECK_VISIBILITY, fieldId: id }
    }] : [],
    ...validators ? [{
      action: this.bindCalculatorAction(this.createValidaity()),
      dependents: { type: updateOn || changeType, fieldId: id }
    }] : []]);
  }

  private addControl(jsonField: any, builderField: BuilderFieldExtensions) {
    const { viewModel } = this.builder;
    const { dataBinding: { path, default: defaultValue } } = jsonField;
    const value = get(viewModel, path, defaultValue);
    const control = this.ls.getProvider(BIND_FORM_CONTROL, value, { builder: this.builder, builderField });

    this.defineProperty(builderField, CONTROL, control);
    control.changeValues.subscribe((_value: any) => set(viewModel, path, _value));

    delete builderField.field.dataBinding;
    this.excuteChangeEvent(jsonField, value);
    this.changeVisibility(builderField, builderField.visibility);
  }

  private createChange() {
    return ({ builderField, actionEvent }: BaseAction) => {
      const value = this.isDomEvent(actionEvent) ? actionEvent.target.value : actionEvent;
      builderField.control?.patchValue(value);
      builderField.instance?.detectChanges();
    };
  }

  private createValidaity() {
    return ({ builderField: { control }, builder: { ready } }: BaseAction) => {
      ready && control?.updateValueAndValidity();
    };
  }

  private createVisibility() {
    return ({ builderField, builder: { ready }, actionEvent }: BaseAction) => {
      ready && this.changeVisibility(builderField, actionEvent);
    };
  }

  private changeVisibility({ control }: BuilderFieldExtensions, visibility: Visibility = Visibility.visible) {
    if (control) {
      const { none, disabled, hidden, readonly } = Visibility;
      const isDisabled = [none, hidden, disabled, readonly].includes(visibility);
      isDisabled ? control.disable() : control.enable();
    }
  }

  private excuteChangeEvent(jsonField: any, value: any) {
    const { events = {} } = this.getBuilderFieldById(jsonField.id);
    return events[this.getEventType(this.getChangeType(jsonField))](value);
  }

  private getChangeType(jsonField: any) {
    const { dataBinding: { changeType = this.defaultChangeType } } = jsonField;
    return changeType;
  }

  private isDomEvent(actionResult: any) {
    return actionResult && actionResult.target && !!actionResult.target.nodeType;
  }

  public destory() {
    this.builderFields.forEach((builderField) => {
      builderField.control?.destory();
      this.defineProperty(builderField, CONTROL, null);
    });
    return super.destory();
  }
}
