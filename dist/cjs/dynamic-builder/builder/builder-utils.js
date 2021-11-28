"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const lodash_1 = require("lodash");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const token_1 = require("../token");
const utility_1 = require("../utility");
const builder_engine_service_1 = require("./builder-engine.service");
function init(props) {
    Object.defineProperty(this, '$$cache', (0, utility_1.withValue)(getCacheObj.call(this, {})));
    Object.defineProperties(this, {
        onChanges: (0, utility_1.withValue)(() => { }),
        onDestory: (0, utility_1.withValue)(this.$$cache.destory.bind(this)),
        loadForBuild: (0, utility_1.withValue)(() => {
            delete this.loadForBuild;
            loadForBuild.call(this, props).subscribe(() => this.detectChanges());
            return this;
        })
    });
}
exports.init = init;
function loadForBuild(props) {
    let builderJson;
    return getConfigJson.call(this, props).pipe((0, operators_1.tap)((json) => {
        builderJson = json;
        builderJson.id = this.id = builderJson.id || props.id;
        Object.defineProperty(this, '$$cache', (0, utility_1.withValue)(getCacheObj.call(this, builderJson)));
        if (props.builder) {
            this.parent = props.builder;
            addChild.call(this.parent, this);
        }
    }), (0, operators_1.switchMap)(() => (0, rxjs_1.forkJoin)(this.ls.getProvider(token_1.BUILDER_EXTENSION).map((Extension) => new Extension(this, props, this.$$cache, builderJson).init()))), (0, operators_1.switchMap)((examples) => (0, rxjs_1.forkJoin)(examples.map((example) => example.afterInit()))), (0, operators_1.tap)((extensionDestorys) => {
        this.$$cache.extensionDestorys = extensionDestorys || [];
    }), (0, operators_1.tap)(() => {
        this.$$cache.ready = true;
        if (this.$$cache.destoryed) {
            destory.apply(this);
        }
    }));
}
function getConfigJson(props) {
    const { id, jsonName = ``, config } = props;
    const isJsonName = !!jsonName;
    const isJsConfig = !(0, lodash_1.isEmpty)(config);
    if (!isJsonName && !isJsConfig) {
        throw new Error(`Builder configuration is incorrect: ${id}`);
    }
    const configSub = isJsonName ?
        this.ls.getService(builder_engine_service_1.BuilderEngine).getJsonConfig(jsonName) :
        (0, rxjs_1.of)((0, lodash_1.cloneDeep)({ id, ...Array.isArray(config) ? { fields: config } : config }));
    return configSub.pipe((0, operators_1.tap)((json) => checkFieldRepeat.call(this, json.fields, json.id || props.id)));
}
function getCacheObj({ fields = [] }) {
    const { ready = false, destoryed = false, onChanges = new rxjs_1.Subject(), detectChanges = new rxjs_1.Subject(), destory: modelDestory = destory.bind(this), addChild: modelAddChild = addChild.bind(this), removeChild: modelRemoveChild = removeChild.bind(this) } = this.$$cache || {};
    return {
        ready,
        destoryed,
        onChanges,
        detectChanges,
        destory: modelDestory,
        addChild: modelAddChild,
        removeChild: modelRemoveChild,
        fields: fields.map(createField.bind(this)),
    };
}
function createField(field) {
    const { id, type, calculators, ...other } = field;
    const element = this.ls.getService(builder_engine_service_1.BuilderEngine).getUiComponent(type);
    return { id, type, element, field: other };
}
function destory() {
    const cacheObj = this.$$cache;
    const { extensionDestorys = [], ready = false } = cacheObj;
    cacheObj.destoryed = true;
    if (ready) {
        try {
            (0, rxjs_1.forkJoin)([...extensionDestorys].map((extensionDestory) => extensionDestory && extensionDestory())).pipe((0, operators_1.switchMap)(() => (0, utility_1.transformObservable)(this.destory && this.destory.call(this)))).subscribe(() => {
                cacheObj.ready = false;
                cacheObj.fields.splice(0);
                cacheObj.onChanges.unsubscribe();
                cacheObj.detectChanges.unsubscribe();
                cacheObj.extensionDestorys.splice(0);
                this.children.splice(0);
                removeChild.call(this.parent, this);
                this.parent = null;
            });
        }
        catch (e) {
            console.error(e);
        }
    }
}
function addChild(child) {
    this?.children.push(child);
}
function removeChild(child) {
    this?.children.splice(this.children.indexOf(child), 1);
}
function checkFieldRepeat(fields, jsonName) {
    const filedIds = [...new Set(fields.map(({ id }) => id))];
    if (filedIds.includes(jsonName)) {
        throw new Error(`The same ID as jsonID exists in the configuration file: ${jsonName}`);
    }
    if (filedIds.length !== fields.length) {
        throw new Error(`The same ID exists in the configuration file: ${jsonName}`);
    }
}
//# sourceMappingURL=builder-utils.js.map