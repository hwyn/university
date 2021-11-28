"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InjectorToken = void 0;
class InjectorToken {
    _desc;
    static get(_desc) {
        return new InjectorToken(_desc);
    }
    constructor(_desc) {
        this._desc = _desc;
    }
    toString() {
        return `Token ${this._desc}`;
    }
}
exports.InjectorToken = InjectorToken;
//# sourceMappingURL=injector-token.js.map