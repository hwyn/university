"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticInjector = exports.Inject = exports.__USECLASS__ = exports.__PROVIDER_TYPE__ = void 0;
const lodash_1 = require("lodash");
require("reflect-metadata");
const abstract_injector_1 = require("./abstract-injector");
const designParamtypes = `design:paramtypes`;
const __provide__inject__ = `design:__provide__inject__`;
exports.__PROVIDER_TYPE__ = '__PROVIDER_TYPE__';
exports.__USECLASS__ = '__USECLASS__';
const Inject = (token) => (target, name, index) => {
    if (!target[__provide__inject__]) {
        target[__provide__inject__] = [];
    }
    target[__provide__inject__].push({ token, index });
};
exports.Inject = Inject;
class StaticInjector {
    parentInjector;
    isSelfContext = false;
    _recors = new Map();
    _instanceRecors = new Map();
    constructor(parentInjector, options) {
        this.parentInjector = parentInjector;
        this._recors.set(abstract_injector_1.Injector, { token: abstract_injector_1.Injector, fn: () => this });
        this.isSelfContext = options ? options.isScope === 'self' : false;
    }
    get(token) {
        const record = this._recors.get(token) || this.parentInjector?._recors.get(token);
        return record ? record.fn.call(this) : null;
    }
    set(token, provider) {
        const { provide, useClass, useValue, useFactory, deps = [] } = provider;
        const record = this._recors.get(token) || {};
        deps.forEach((t) => serializeDeps.call(this, t));
        record.token = provide;
        if (!(0, lodash_1.isUndefined)(useValue)) {
            record.fn = resolveMulitProvider.call(this, provider, record);
        }
        else if (useClass) {
            const recordClass = this._recors.get(useClass) || { fn: resolveClassProvider.call(this, provider) };
            record.fn = recordClass.fn;
        }
        else if (useFactory) {
            record.fn = resolveFactoryProvider.call(this, provider);
        }
        this._recors.set(record.token, record);
    }
    clear() {
        this._recors.clear();
    }
}
exports.StaticInjector = StaticInjector;
function serializeDeps(dep) {
    if (dep[exports.__PROVIDER_TYPE__] === exports.__USECLASS__) {
        return this.set(dep, { provide: dep, useClass: dep });
    }
    this.set(dep.provide, dep);
}
function resolveClassProvider({ useNew = false, useClass }) {
    let instance;
    return function () {
        const isSelfContext = this.isSelfContext;
        let newInstance = isSelfContext ? this._instanceRecors.get(useClass) : instance;
        if (useNew || !newInstance) {
            const deps = Reflect.getMetadata(designParamtypes, useClass) || [];
            const injectTypes = useClass[__provide__inject__] || [];
            const arvgs = deps.map((token) => this.get(token));
            injectTypes.forEach(({ token, index }) => arvgs[index] = this.get(token));
            newInstance = new useClass(...arvgs);
            isSelfContext ? this._instanceRecors.set(useClass, newInstance) : instance = newInstance;
        }
        return newInstance;
    };
}
function resolveMulitProvider({ useValue, multi }, { token, fn = () => [] }) {
    const preValue = fn.call(this);
    return function (isSelfCall) {
        return multi ? [...preValue, useValue] : useValue;
    };
}
function resolveFactoryProvider({ useFactory, deps = [] }) {
    return function () {
        return useFactory.apply(undefined, deps.map((token) => this.get(token)));
    };
}
//# sourceMappingURL=injector.js.map