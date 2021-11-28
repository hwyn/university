"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionExtension = void 0;
const lodash_1 = require("lodash");
const basic_extension_1 = require("../basic/basic.extension");
const create_actions_1 = require("./create-actions");
class ActionExtension extends basic_extension_1.BasicExtension {
    extension() {
        const eachCallback = this.createFieldAction.bind(this);
        const handler = this.eachFields.bind(this, this.jsonFields, eachCallback);
        this.pushCalculators(this.json, {
            action: { type: 'loadAction', handler },
            dependents: { type: 'loadViewModel', fieldId: this.builder.id }
        });
    }
    createFieldAction([jsonField, builderField]) {
        const { actions = [] } = jsonField;
        const { id, field } = builderField;
        if (!(0, lodash_1.isEmpty)(actions)) {
            const events = (0, create_actions_1.createActions)(this.toArray(actions), { builder: this.builder, id }, { ls: this.ls });
            this.defineProperty(builderField, 'events', events);
        }
        delete field.actions;
    }
}
exports.ActionExtension = ActionExtension;
//# sourceMappingURL=actions.extension.js.map