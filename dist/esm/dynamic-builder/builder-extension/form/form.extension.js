"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormExtension = void 0;
const lodash_1 = require("lodash");
const basic_extension_1 = require("../basic/basic.extension");
const token_1 = require("../../token");
class FormExtension extends basic_extension_1.BasicExtension {
    builderFields = [];
    defaultChangeType = 'change';
    extension() {
        this.builderFields = this.mapFields(this.jsonFields.filter(({ dataBinding }) => !(0, lodash_1.isEmpty)(dataBinding)), this.createMergeControl.bind(this));
    }
    createMergeControl([jsonField, builderField]) {
        const { id } = builderField;
        this.pushCalculators(jsonField, [{
                action: this.bindCalculatorAction(this.createChangeHandler(builderField)),
                dependents: { type: this.getChangeType(jsonField), fieldId: id }
            }, {
                action: this.bindCalculatorAction(this.addControl.bind(this, jsonField, builderField)),
                dependents: { type: 'loadAction', fieldId: this.builder.id }
            }]);
    }
    addControl(jsonField, builderField) {
        const { viewModel } = this.builder;
        const bindFormControl = this.ls.getProvider(token_1.BIND_FORM_CONTROL);
        const { dataBinding: { path, default: defaultValue } } = jsonField;
        const value = (0, lodash_1.get)(viewModel, path, defaultValue);
        this.defineProperty(builderField, 'control', bindFormControl(value));
        builderField.control.changeValues.subscribe((_value) => (0, lodash_1.set)(viewModel, path, _value));
        delete builderField.field.dataBinding;
        this.excuteChangeEvent(jsonField, value);
    }
    createChangeHandler(builderField) {
        return ({ actionEvent }) => {
            const { target = {} } = actionEvent;
            builderField.control?.patchValue(target.value || actionEvent);
            builderField.instance?.detectChanges();
        };
    }
    excuteChangeEvent(jsonField, value) {
        const { events = {} } = this.getBuilderFieldById(jsonField.id);
        return events[this.getEventType(this.getChangeType(jsonField))](value);
    }
    getChangeType(jsonField) {
        const { dataBinding: { changeType = this.defaultChangeType } } = jsonField;
        return changeType;
    }
    destory() {
        this.builderFields.forEach((builderField) => {
            builderField.control?.destory();
            this.defineProperty(builderField, 'control', null);
        });
        return super.destory();
    }
}
exports.FormExtension = FormExtension;
//# sourceMappingURL=form.extension.js.map