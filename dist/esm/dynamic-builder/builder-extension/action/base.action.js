"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAction = void 0;
const token_1 = require("../../token");
const basic_extension_1 = require("../basic/basic.extension");
class BaseAction {
    ls;
    _actionPropos;
    _builder;
    _instance;
    _builderField;
    _actionIntercept;
    _actionResult;
    constructor(ls, context = {}) {
        this.ls = ls;
        this._actionIntercept = this.ls.getProvider(token_1.ACTION_INTERCEPT);
        this.invokeContext(context);
    }
    invokeContext(context = {}) {
        this._actionPropos = context.actionPropos;
        this._builder = context.builder;
        this._builderField = context.builderField;
        this._instance = this.builderField && this.builderField.instance;
        this._actionResult = context.actionEvent;
    }
    createAction(action) {
        return (0, basic_extension_1.serializeAction)(action);
    }
    get builderField() {
        return this._builderField;
    }
    get actionIntercept() {
        return this._actionIntercept;
    }
    get builder() {
        return this._builder;
    }
    get instance() {
        return this._instance;
    }
    get actionPropos() {
        return this._actionPropos;
    }
    get actionEvent() {
        return this._actionResult;
    }
}
exports.BaseAction = BaseAction;
//# sourceMappingURL=base.action.js.map