"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceExtension = void 0;
const rxjs_1 = require("rxjs");
const basic_extension_1 = require("../basic/basic.extension");
class InstanceExtension extends basic_extension_1.BasicExtension {
    buildFieldList = [];
    static createInstance() {
        return {
            current: null,
            mounted: new rxjs_1.Subject(),
            destory: new rxjs_1.Subject(),
            detectChanges: () => undefined,
        };
    }
    extension() {
        this.buildFieldList = this.mapFields(this.jsonFields, this.addInstance.bind(this));
        const handler = this.eachFields.bind(this, this.jsonFields, this.createInstanceLife.bind(this));
        this.pushCalculators(this.json, {
            action: this.bindCalculatorAction(handler),
            dependents: { type: 'loadAction', fieldId: this.builder.id }
        });
    }
    createInstanceLife([, builderField]) {
        const { instance, events = {}, instance: { mounted, destory } } = builderField;
        const { onMounted, onDestory } = events;
        let mountedIsEnd = false;
        destory.subscribe((id) => {
            instance.current = null;
            mountedIsEnd = false;
            instance.detectChanges = () => undefined;
            if (onDestory && onDestory(id)) { }
        });
        mounted.subscribe((id) => {
            if (onMounted && !mountedIsEnd && onMounted(id)) { }
            mountedIsEnd = true;
        });
        Object.defineProperty(instance, 'current', this.getCurrentProperty(builderField));
        delete events.onMounted;
        delete events.onDestory;
    }
    getCurrentProperty({ instance, id }) {
        let _current;
        const get = () => _current;
        const set = (current) => {
            const hasMounted = !!current && _current !== current;
            _current = current;
            if (hasMounted && instance.mounted.next(id)) { }
        };
        return { get, set };
    }
    addInstance([, builderField]) {
        this.defineProperty(builderField, 'instance', InstanceExtension.createInstance());
    }
    destory() {
        this.buildFieldList.forEach((buildField) => {
            const { instance } = buildField;
            instance.destory.unsubscribe();
            instance.mounted.unsubscribe();
            instance.detectChanges = () => undefined;
            this.defineProperty(buildField, 'instance', null);
            this.defineProperty(instance, 'current', null);
        });
        return super.destory();
    }
}
exports.InstanceExtension = InstanceExtension;
//# sourceMappingURL=instance.extension.js.map