"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckVisibilityExtension = void 0;
const lodash_1 = require("lodash");
const basic_extension_1 = require("../basic/basic.extension");
class CheckVisibilityExtension extends basic_extension_1.BasicExtension {
    visibilityTypeName = 'checkVisibility';
    builderFields;
    extension() {
        this.builderFields = this.mapFields(this.jsonFields.filter(({ checkVisibility }) => !(0, lodash_1.isUndefined)(checkVisibility)), this.addFieldCalculators.bind(this));
        if (!(0, lodash_1.isEmpty)(this.builderFields)) {
            this.pushCalculators(this.json, [{
                    action: this.bindCalculatorAction(this.checkVisibility.bind(this, {})),
                    dependents: { type: 'change', fieldId: this.builder.id }
                }, {
                    action: this.bindCalculatorAction(this.removeOnEvent.bind(this)),
                    dependents: { type: 'loadAction', fieldId: this.builder.id }
                }]);
        }
    }
    addFieldCalculators([jsonField, builderField]) {
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
    serializeCheckVisibilityConfig(jsonField) {
        const { checkVisibility: jsonCheckVisibility } = jsonField;
        const defaultDependents = { type: 'change', fieldId: this.builder.id };
        return this.serializeCalculatorConfig(jsonCheckVisibility, this.visibilityTypeName, defaultDependents);
    }
    checkVisibilityAfter({ actionEvent, builderField, builder }) {
        if (builderField.field.visibility !== actionEvent) {
            builderField.field.visibility = actionEvent;
            builder.detectChanges();
        }
    }
    removeOnEvent() {
        this.builderFields.forEach(({ events = {} }) => delete events.onCheckVisibility);
    }
    checkVisibility(cache) {
        const { ids } = cache;
        const hiddenList = this.builderFields.filter(({ field: { visibility } }) => visibility).map(({ id }) => id);
        const newIds = hiddenList.join('');
        if (ids !== newIds) {
            cache.ids = newIds;
            const originCalculators = this.cache.originCalculators;
            this.builder.calculators = originCalculators.filter(({ targetId, action: { type }, dependent: { type: dType } }) => {
                return type === this.visibilityTypeName || dType === this.visibilityTypeName || !hiddenList.includes(targetId);
            });
        }
    }
}
exports.CheckVisibilityExtension = CheckVisibilityExtension;
//# sourceMappingURL=check-visibility.extension.js.map