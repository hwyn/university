import { isEmpty } from 'lodash';

import { Visibility } from '../../builder';
import { BIND_FORM_CONTROL } from '../../token';
import { Action, BaseAction } from '../action';
import { BasicExtension, CallBackOptions } from '../basic/basic.extension';
import { CHANGE, CHECK_VISIBILITY, CONTROL, LOAD_ACTION, NOTIFY_VIEW_MODEL_CHANGE } from '../constant/calculator.constant';
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
    this.addChangeAction(changeType, jsonField);
    this.pushCalculators(jsonField, [{
      action: this.bindCalculatorAction(this.addControl.bind(this, jsonField, builderField)),
      dependents: { type: LOAD_ACTION, fieldId: this.builder.id }
    }, {
      action: this.bindCalculatorAction(this.createNotifyChange.bind(this, jsonField)),
      dependents: { type: NOTIFY_VIEW_MODEL_CHANGE, fieldId: this.builder.id }
    },
    ...checkVisibility ? [{
      action: this.bindCalculatorAction(this.createVisibility.bind(this)),
      dependents: { type: CHECK_VISIBILITY, fieldId: id }
    }] : [],
    ...validators ? [{
      action: this.bindCalculatorAction(this.createValidaity.bind(this)),
      dependents: { type: updateOn || changeType, fieldId: id }
    }] : []]);
  }

  private addChangeAction(changeType: string, jsonField: any) {
    const { actions = [] } = jsonField;
    let changeAction = actions.find(({ type }: Action) => type === changeType);

    jsonField.actions = actions;
    !changeAction && actions.push(changeAction = { type: changeType });
    changeAction.after = this.bindCalculatorAction(this.createChange.bind(this, jsonField));
  }

  private addControl(jsonField: any, builderField: BuilderFieldExtensions) {
    const value = this.getValueToModel(jsonField.dataBinding, builderField);
    const control = this.ls.getProvider(BIND_FORM_CONTROL, value, { builder: this.builder, builderField });

    this.defineProperty(builderField, CONTROL, control);

    delete builderField.field.dataBinding;
    this.excuteChangeEvent(jsonField, value);
    this.changeVisibility(builderField, builderField.visibility);
  }

  private createChange({ dataBinding }: any, { builderField, actionEvent }: BaseAction) {
    const value = this.isDomEvent(actionEvent) ? actionEvent.target.value : actionEvent;
    this.setValueToModel(dataBinding, value, builderField);
    builderField.control?.patchValue(value);
    builderField.instance?.detectChanges();
  }

  private createValidaity({ builderField: { control }, builder: { ready } }: BaseAction) {
    ready && control?.updateValueAndValidity();
  }

  private createVisibility({ builderField, builder: { ready }, actionEvent }: BaseAction) {
    ready && this.changeVisibility(builderField, actionEvent);
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

  private createNotifyChange(jsonField: any, { actionEvent, builderField }: BaseAction) {
    if (!actionEvent || actionEvent === builderField) {
      const { dataBinding } = jsonField;
      this.excuteChangeEvent(jsonField, this.getValueToModel(dataBinding, builderField));
    }
  }

  private getChangeType(jsonField: any) {
    const { dataBinding: { changeType = this.defaultChangeType } } = jsonField;
    return changeType;
  }

  private getValueToModel<T = any>(dataBinding: any, builderField: BuilderFieldExtensions): T {
    return this.cache.viewModel.getBindValue(dataBinding, builderField);
  }

  private setValueToModel(dataBinding: any, value: any, builderField: BuilderFieldExtensions): void {
    this.cache.viewModel.setBindValue(dataBinding, value, builderField);
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
