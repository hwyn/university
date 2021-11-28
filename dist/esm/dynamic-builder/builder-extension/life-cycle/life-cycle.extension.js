"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifeCycleExtension = void 0;
const lodash_1 = require("lodash");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const utility_1 = require("../../utility");
const action_1 = require("../action");
const basic_extension_1 = require("../basic/basic.extension");
class LifeCycleExtension extends basic_extension_1.BasicExtension {
    hasChange = false;
    calculators = [];
    lifeActions;
    detectChanges = this.cache.detectChanges.pipe((0, operators_1.filter)(() => !this.hasChange));
    extension() {
    }
    afterExtension() {
        this.serializeCalculators();
        this.defineProperty(this.cache, 'originCalculators', this.calculators);
        return this.createLife();
    }
    createLife() {
        const { actions = [] } = this.json;
        const props = { builder: this.builder, id: this.builder.id };
        this.lifeActions = (0, action_1.createActions)(actions, props, { runObservable: true, ls: this.ls });
        this.defineProperty(this.builder, 'onChanges', this.onLifeChange.bind(this));
        return this.invokeLifeCycle('onLoad', this.props);
    }
    onLifeChange(props) {
        this.hasChange = true;
        this.invokeLifeCycle('onChange', props).subscribe();
        this.hasChange = false;
    }
    invokeLifeCycle(type, event) {
        const lifeActions = this.lifeActions;
        return lifeActions[type] ? lifeActions[type](event) : (0, rxjs_1.of)(event);
    }
    serializeCalculators() {
        this.createCalculators();
        this.linkCalculators();
        this.builder.calculators = this.calculators;
    }
    linkCalculators() {
        this.calculators.forEach(({ dependent }) => {
            const { type, fieldId } = dependent;
            const sourceField = this.getJsonFieldById(fieldId) || this.json;
            const { actions = [], id: sourceId } = sourceField;
            const hasAction = actions.some((action) => action.type === type);
            if (fieldId !== sourceId) {
                dependent.fieldId = sourceId;
            }
            if (!hasAction) {
                sourceField.actions = [{ type }, ...actions];
            }
        });
    }
    createCalculators() {
        const fields = [...this.jsonFields, this.json];
        const fieldsCalculators = (0, lodash_1.cloneDeep)(fields).filter(({ calculators }) => !(0, lodash_1.isEmpty)(calculators));
        this.calculators = [];
        fieldsCalculators.forEach(({ id: targetId, calculators = [] }) => {
            this.toArray(calculators).forEach(({ action, dependents }) => {
                this.toArray(dependents).forEach((dependent) => {
                    this.calculators.push({ targetId, action: this.serializeAction(action), dependent });
                });
            });
        });
    }
    destory() {
        return this.invokeLifeCycle('onDestory').pipe((0, operators_1.tap)(() => {
            this.lifeActions = {};
            delete this.detectChanges;
            this.builder.calculators.splice(0);
            this.defineProperty(this.cache, 'originCalculators', null);
        }), (0, operators_1.switchMap)(() => (0, utility_1.transformObservable)(super.destory())));
    }
}
exports.LifeCycleExtension = LifeCycleExtension;
//# sourceMappingURL=life-cycle.extension.js.map