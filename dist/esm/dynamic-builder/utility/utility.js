"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withGetOrSet = exports.withValue = exports.transformObservable = void 0;
const rxjs_1 = require("rxjs");
function transformObservable(obj) {
    return obj && obj.subscribe ? obj : (0, rxjs_1.of)(obj);
}
exports.transformObservable = transformObservable;
function withValue(value) {
    return { value, enumerable: true, configurable: true };
}
exports.withValue = withValue;
function withGetOrSet(get, set) {
    return { get, set, enumerable: true, configurable: true };
}
exports.withGetOrSet = withGetOrSet;
//# sourceMappingURL=utility.js.map