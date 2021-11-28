"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActions = exports.getEventType = void 0;
const lodash_1 = require("lodash");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const token_1 = require("../../token");
const utility_1 = require("../../utility");
function mergeHandler(actions, props, options) {
    const actionIntercept = options.ls.getProvider(token_1.ACTION_INTERCEPT);
    return (event, ...arg) => {
        const { interceptFn = () => event, handlerCallBack, runObservable = false } = options;
        const obs = (0, utility_1.transformObservable)(interceptFn(props, event, ...arg)).pipe((0, operators_1.switchMap)((value) => (0, rxjs_1.forkJoin)(actions.map((action) => actionIntercept.invoke(action, props, value, ...arg)))));
        return runObservable ? obs : obs.subscribe(handlerCallBack);
    };
}
function getEventType(type) {
    return `on${type.slice(0, 1).toUpperCase()}${type.slice(1)}`;
}
exports.getEventType = getEventType;
const createActions = (actions, props, options) => {
    const events = (0, lodash_1.groupBy)(actions, 'type');
    return Object.keys(events).reduce((obj, type) => ({
        ...obj,
        [getEventType(type)]: mergeHandler(events[type], props, options)
    }), {});
};
exports.createActions = createActions;
//# sourceMappingURL=create-actions.js.map