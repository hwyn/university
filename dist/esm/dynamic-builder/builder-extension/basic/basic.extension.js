"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicExtension = exports.serializeAction = void 0;
const lodash_1 = require("lodash");
const operators_1 = require("rxjs/operators");
const utility_1 = require("../../utility");
const create_actions_1 = require("../action/create-actions");
const serializeAction = (action) => {
    return (0, lodash_1.isString)(action) ? { name: action } : action;
};
exports.serializeAction = serializeAction;
class BasicExtension {
    builder;
    props;
    cache;
    json;
    jsonFields;
    ls;
    constructor(builder, props, cache, json) {
        this.builder = builder;
        this.props = props;
        this.cache = cache;
        this.json = json;
        this.ls = this.builder.ls;
        this.jsonFields = this.json.fields;
    }
    afterExtension() { }
    destory() { }
    init() {
        return (0, utility_1.transformObservable)(this.extension()).pipe((0, operators_1.map)(() => this));
    }
    afterInit() {
        return (0, utility_1.transformObservable)(this.afterExtension()).pipe((0, operators_1.map)(() => () => (0, utility_1.transformObservable)(this.destory())));
    }
    eachFields(jsonFields, callBack) {
        jsonFields.forEach((jsonField) => callBack([jsonField, this.getBuilderFieldById(jsonField.id)]));
    }
    mapFields(jsonFields, callBack) {
        return jsonFields.map((jsonField) => {
            const builderField = this.getBuilderFieldById(jsonField.id);
            return callBack([jsonField, builderField]) || builderField;
        });
    }
    serializeCalculatorConfig(jsonCalculator, actionType, defaultDependents) {
        const calculatorConfig = (0, lodash_1.isString)(jsonCalculator) ? { action: { name: jsonCalculator } } : (0, lodash_1.cloneDeep)(jsonCalculator);
        const { action, dependents = defaultDependents } = calculatorConfig;
        calculatorConfig.action = (0, lodash_1.merge)({ type: actionType }, this.serializeAction(action));
        calculatorConfig.dependents = dependents;
        return calculatorConfig;
    }
    bindCalculatorAction(handler) {
        return { type: 'calculator', handler };
    }
    pushCalculators(fieldConfig, calculator) {
        const { calculators = [] } = fieldConfig;
        calculators.push(...this.toArray(calculator));
        fieldConfig.calculators = calculators;
    }
    toArray(obj) {
        return (0, lodash_1.isArray)(obj) ? obj : [obj];
    }
    defineProperty(object, prototypeName, value) {
        Object.defineProperty(object, prototypeName, (0, utility_1.withValue)(value));
    }
    serializeAction(action) {
        return (0, exports.serializeAction)(action);
    }
    getEventType(type) {
        return (0, create_actions_1.getEventType)(type);
    }
    getJsonFieldById(fieldId) {
        return this.jsonFields.find(({ id }) => fieldId === id);
    }
    getBuilderFieldById(fieldId) {
        return this.builder.getFieldById(fieldId);
    }
}
exports.BasicExtension = BasicExtension;
//# sourceMappingURL=basic.extension.js.map