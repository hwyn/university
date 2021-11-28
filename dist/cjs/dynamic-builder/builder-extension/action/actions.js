"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Action = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const _1 = require(".");
const _di_1 = require("@di");
const token_1 = require("../../token");
const utility_1 = require("../../utility");
const basic_extension_1 = require("../basic/basic.extension");
let Action = class Action {
    ls;
    actions;
    constructor(ls, actions) {
        this.ls = ls;
        this.actions = (0, lodash_1.flatMap)(actions);
    }
    createEvent(event, otherEventParam = []) {
        return [event, ...otherEventParam];
    }
    callCalculatorsInvokes(calculators, builder) {
        const calculatorsOb = (0, rxjs_1.of)(...calculators);
        return (value) => calculatorsOb.pipe((0, operators_1.concatMap)(({ targetId, action: calculatorAction }) => this.invoke(calculatorAction, { builder, id: targetId }, value)), (0, operators_1.toArray)(), (0, operators_1.map)(() => value));
    }
    getAction(name) {
        const [{ action = null } = {}] = this.actions.filter(({ name: actionName }) => actionName === name);
        return action;
    }
    getActionContext({ builder, id } = {}) {
        return (0, lodash_1.isEmpty)(builder) ? {} : { builder, builderField: builder.getFieldById(id) };
    }
    invokeCalculators({ type }, actionSub, props) {
        const { builder, id: currentId } = props;
        const { calculators = [] } = builder;
        const filterCalculators = calculators.filter(({ dependent: { fieldId, type: calculatorType } }) => fieldId === currentId && calculatorType === type);
        if (!(0, lodash_1.isEmpty)(filterCalculators)) {
            const calculatorsInvokes = this.callCalculatorsInvokes(filterCalculators, builder);
            actionSub = actionSub.pipe((0, operators_1.switchMap)((value) => calculatorsInvokes(value)));
        }
        return actionSub;
    }
    invoke(action, props, event = null, ...otherEventParam) {
        if (props && props.builder && props.builder.$$cache.destoryed) {
            return (0, rxjs_1.of)(null).pipe((0, operators_1.filter)(() => false));
        }
        const _action = (0, basic_extension_1.serializeAction)(action);
        const { type, name, handler, stop } = _action;
        if (stop && !(0, lodash_1.isEmpty)(event) && event?.stopPropagation) {
            event.stopPropagation();
        }
        const e = this.createEvent(event, otherEventParam);
        const actionSub = name || handler ? this.executeAction(_action, this.getActionContext(props), e) : (0, rxjs_1.of)(event);
        return !!props && !!type && !(0, lodash_1.isEmpty)(props) ? this.invokeCalculators(_action, actionSub, props) : actionSub;
    }
    executeAction(actionPropos, actionContext, event = this.createEvent(void (0))) {
        const [actionEvent, ...otherEvent] = event;
        const { name = ``, handler } = (0, basic_extension_1.serializeAction)(actionPropos);
        const [actionName, execute = 'execute'] = name.match(/([^\.]+)/ig) || [name];
        const context = { ...actionContext, actionPropos, actionEvent };
        let action = new _1.BaseAction(this.ls, context);
        let executeHandler = handler;
        if (!executeHandler && action.builder) {
            let builder = action.builder;
            while (builder) {
                const builderHandler = builder[name];
                executeHandler = builderHandler ? builderHandler.bind(builder) : executeHandler;
                if (builder === builder.root) {
                    break;
                }
                builder = builder.parent;
            }
        }
        if (!executeHandler) {
            const ActionType = this.getAction(actionName);
            action = ActionType && new ActionType(this.ls, context);
            executeHandler = action && action[execute].bind(action);
        }
        if (!executeHandler) {
            throw new Error(`${name} not defined!`);
        }
        return (0, utility_1.transformObservable)(executeHandler.apply(undefined, [action, ...otherEvent]));
    }
};
Action = (0, tslib_1.__decorate)([
    (0, tslib_1.__param)(0, (0, _di_1.Inject)(_di_1.LOCAL_STORAGE)),
    (0, tslib_1.__param)(1, (0, _di_1.Inject)(token_1.ACTIONS_CONFIG_TOKEN)),
    (0, tslib_1.__metadata)("design:paramtypes", [_di_1.LocatorStorageImplements, Array])
], Action);
exports.Action = Action;
//# sourceMappingURL=actions.js.map