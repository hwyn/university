import { isEmpty, isUndefined } from 'lodash';

import { BaseAction } from '../action';
import { BasicExtension, CallBackOptions } from '../basic/basic.extension';
import { CHANGE, CHECK_VISIBILITY, LOAD, LOAD_ACTION } from '../constant/calculator.constant';
import { BuilderFieldExtensions, BuilderModelExtensions, Calculators, OriginCalculators } from '../type-api';

export class CheckVisibilityExtension extends BasicExtension {
  private visibilityTypeName = CHECK_VISIBILITY;
  private builderFields!: BuilderFieldExtensions[];
  private defaultDependents = [LOAD, CHANGE].map((type) => ({ type, fieldId: this.builder.id }));

  protected extension() {
    const visibliityList = this.jsonFields.filter(this.checkNeedOrDefaultVisibility.bind(this));
    if (!isEmpty(visibliityList)) {
      this.builderFields = this.mapFields(visibliityList, this.addFieldCalculators.bind(this));

      this.pushCalculators(this.json, [{
        action: this.bindCalculatorAction(this.checkVisibility.bind(this, {})),
        dependents: this.defaultDependents
      }, {
        action: this.bindCalculatorAction(this.removeOnEvent.bind(this)),
        dependents: { type: LOAD_ACTION, fieldId: this.builder.id }
      }]);
    }
  }

  private addFieldCalculators([jsonField, builderField]: CallBackOptions): BuilderFieldExtensions {
    const { action, dependents } = this.serializeCheckVisibilityConfig(jsonField);
    action.after = this.bindCalculatorAction(this.checkVisibilityAfter.bind(this));
    this.pushCalculators(jsonField, [{ action, dependents }]);

    delete builderField.field.checkVisibility;
    return builderField;
  }

  private serializeCheckVisibilityConfig(jsonField: any): Calculators {
    const { checkVisibility: jsonCheckVisibility } = jsonField;
    return this.serializeCalculatorConfig(jsonCheckVisibility, this.visibilityTypeName, this.defaultDependents);
  }

  private checkVisibilityAfter({ actionEvent, builderField, builder }: BaseAction): void {
    if (actionEvent && builderField.visibility !== actionEvent) {
      builderField.visibility = actionEvent;
      builder.detectChanges();
    }
  }

  private removeOnEvent(): void {
    this.builderFields.forEach(({ events = {} }) => delete events.onCheckVisibility);
  }

  private checkVisibility(cache: any): void {
    const { ids } = cache;
    const { fields, ready } = this.cache;
    const hiddenList = fields.filter(({ visibility }) => !this.builder.showField(visibility)).map(({ id }) => id);
    const newIds = hiddenList.join('');
    if (ids !== newIds && ready) {
      cache.ids = newIds;
      this.builder.calculators = this.filterNoneCalculators(this.cache.originCalculators, hiddenList);
      this.builder.$$cache.nonSelfBuilders.forEach((nonBuild: BuilderModelExtensions) => {
        nonBuild.nonSelfCalculators = this.filterNoneCalculators(nonBuild.$$cache.originNonSelfCalculators, hiddenList);
      });
    }
  }

  private filterNoneCalculators(originCalculators: OriginCalculators[], hiddenList: string[]) {
    return originCalculators.filter(({ targetId, action: { type }, dependent: { type: dType } }) => {
      return type === this.visibilityTypeName || dType === this.visibilityTypeName || !hiddenList.includes(targetId);
    });
  }

  private checkNeedOrDefaultVisibility(jsonField: any) {
    const { visibility, checkVisibility } = jsonField;
    const isCheck = !isUndefined(checkVisibility || visibility) || this.getParentVisibility();
    if (isCheck && !checkVisibility) {
      jsonField.checkVisibility = () => visibility || this.getParentVisibility();
    }
    return isCheck;
  }

  private getParentVisibility() {
    const { id, parent } = this.builder;
    return parent && parent.getFieldById(id).visibility;
  }
}
