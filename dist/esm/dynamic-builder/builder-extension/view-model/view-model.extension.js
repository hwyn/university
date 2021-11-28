"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewModelExtension = void 0;
const basic_extension_1 = require("../basic/basic.extension");
class ViewModelExtension extends basic_extension_1.BasicExtension {
    extension() {
        this.pushCalculators(this.json, {
            action: this.createViewModelCalculator(),
            dependents: { type: 'load', fieldId: this.builder.id }
        });
    }
    createViewModelCalculator() {
        const { actions = [] } = this.json;
        const hasLoadEvent = actions.some(({ type = `` }) => type === 'load');
        const handler = ({ actionEvent }) => {
            this.defineProperty(this.builder, 'viewModel', hasLoadEvent ? actionEvent : {});
        };
        return { type: 'loadViewModel', handler };
    }
    destory() {
        this.defineProperty(this.builder, 'viewModel', null);
        return super.destory();
    }
}
exports.ViewModelExtension = ViewModelExtension;
//# sourceMappingURL=view-model.extension.js.map