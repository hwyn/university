"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuilderModel = void 0;
const lodash_1 = require("lodash");
const builder_utils_1 = require("./builder-utils");
class BuilderModel {
    id;
    parent = null;
    children = [];
    $$cache = {};
    ls;
    Element;
    constructor(ls, props) {
        this.ls = props.builder?.ls || ls;
        builder_utils_1.init.call(this, props);
    }
    getFieldByTypes(type) {
        const { fields = [] } = this.$$cache;
        return fields.filter(({ type: fieldType }) => fieldType === type);
    }
    getAllFieldByTypes(type) {
        const fields = this.getFieldByTypes(type);
        this.children.forEach((child) => fields.push(...child.getAllFieldByTypes(type)));
        return fields;
    }
    getFieldById(id) {
        const hasSelf = id === this.id && !!this.parent;
        const { fields = [] } = this.$$cache;
        return hasSelf ? this.parent?.getFieldById(id) : fields.find(({ id: fieldId }) => fieldId === id);
    }
    getAllFieldById(id) {
        const fields = this.children.map((child) => child.getFieldById(id));
        fields.push(this.getFieldById(id));
        return fields.filter((field) => !(0, lodash_1.isEmpty)(field));
    }
    detectChanges() {
        this.$$cache.detectChanges.next(undefined);
    }
    get ready() {
        return this.$$cache.ready;
    }
    get root() {
        return this.parent ? this.parent.root : this;
    }
    get fields() {
        const { fields = [] } = this.$$cache;
        return fields.filter(({ field }) => !field.visibility);
    }
}
exports.BuilderModel = BuilderModel;
//# sourceMappingURL=builder-model.js.map