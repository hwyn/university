import { isEmpty, isUndefined } from 'lodash';

import { BaseAction } from '../action';
import { BasicExtension, CallBackOptions } from '../basic/basic.extension';
import { CHANGE, CHECK_VISIBILITY, LOAD_ACTION } from '../constant/calculator.constant';
import { BuilderFieldExtensions, BuilderModelExtensions, Calculators, OriginCalculators } from '../type-api';

export class CheckVisibilityExtension extends BasicExtension {
  private visibilityTypeName = CHECK_VISIBILITY;
  private builderFields!: BuilderFieldExtensions[];
  protected extension() {
    this.builderFields = this.mapFields(
      this.jsonFields.filter(({ checkVisibility }) => !isUndefined(checkVisibility)),
      this.addFieldCalculators.bind(this)
    );

    if (!isEmpty(this.builderFields)) {
      this.pushCalculators(this.json, [{
        action: this.bindCalculatorAction(this.checkVisibility.bind(this, {})),
        dependents: { type: CHANGE, fieldId: this.builder.id }
      }, {
        action: this.bindCalculatorAction(this.removeOnEvent.bind(this)),
        dependents: { type: LOAD_ACTION, fieldId: this.builder.id }
      }]);
    }
  }

  private addFieldCalculators([jsonField, builderField]: CallBackOptions): BuilderFieldExtensions {
    const { action, dependents } = this.serializeCheckVisibilityConfig(jsonField);
    this.pushCalculators(jsonField, [
      { action, dependents },
      {
        action: this.bindCalculatorAction(this.checkVisibilityAfter.bind(this)),
        dependents: { type: this.visibilityTypeName, fieldId: jsonField.id }
      }
    ]);

    delete builderField.field.checkVisibility;
    return builderField;
  }

  private serializeCheckVisibilityConfig(jsonField: any): Calculators {
    const { checkVisibility: jsonCheckVisibility } = jsonField;
    const defaultDependents = { type: CHANGE, fieldId: this.builder.id };
    return this.serializeCalculatorConfig(jsonCheckVisibility, this.visibilityTypeName, defaultDependents);
  }

  private checkVisibilityAfter({ actionEvent, builderField, builder }: BaseAction): void {
    if (builderField.field.visibility !== actionEvent) {
      builderField.field.visibility = actionEvent;
      builder.detectChanges();
    }
  }

  private removeOnEvent(): void {
    this.builderFields.forEach(({ events = {} }) => delete events.onCheckVisibility);
  }

  private checkVisibility(cache: any): void {
    const { ids } = cache;
    const hiddenList = this.builderFields.filter(({ field: { visibility } }) => visibility).map(({ id }) => id);
    const newIds = hiddenList.join('');
    if (ids !== newIds) {
      cache.ids = newIds;
      this.builder.calculators = this.filterNoneCalculators(this.cache.originCalculators, hiddenList);
      this.builder.$$cache.nonSelfBuilders.forEach((nonBuild: BuilderModelExtensions) => {
        nonBuild.nonSelfCalculators = this.filterNoneCalculators(nonBuild.$$cache.originCalculators, hiddenList);
      });
    }
  }

  private filterNoneCalculators(originCalculators: OriginCalculators[], hiddenList: string[]) {
    return originCalculators.filter(({ targetId, action: { type }, dependent: { type: dType } }) => {
      return type === this.visibilityTypeName || dType === this.visibilityTypeName || !hiddenList.includes(targetId);
    });
  }
}
