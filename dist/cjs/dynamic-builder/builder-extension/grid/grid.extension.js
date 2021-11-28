"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GridExtension = void 0;
const lodash_1 = require("lodash");
const token_1 = require("../../token");
const basic_extension_1 = require("../basic/basic.extension");
const LATOUT_ID = 'grid-id-model';
const defaultLayout = { column: 12, group: 1 };
const defaultGrid = {
    spacing: 0,
    justify: 'flex-start',
    alignItems: 'flex-start',
    groups: [12]
};
class GridExtension extends basic_extension_1.BasicExtension {
    layoutBuildFields;
    extension() {
        this.pushCalculators(this.json, {
            action: this.bindCalculatorAction(this.createLoadGrid.bind(this)),
            dependents: { type: 'load', fieldId: this.builder.id }
        });
    }
    createLoadGrid() {
        const bindBuilderElement = this.ls.getProvider(token_1.BIND_BUILDER_ELEMENT);
        this.defineProperty(this.cache, 'grid', this.createGrid());
        this.layoutBuildFields = this.mapFields(this.jsonFields, this.addFieldLayout.bind(this, {}));
        this.defineProperty(this.builder, 'Element', bindBuilderElement(this.cache.grid));
    }
    addFieldLayout(cursor, [, builderField]) {
        const { field, field: { layout } } = builderField;
        const mergeLayout = (0, lodash_1.merge)((0, lodash_1.cloneDeep)(defaultLayout), layout || {});
        const { row, group } = mergeLayout;
        cursor[group] = row || cursor[group] || 1;
        this.defineProperty(builderField, 'layout', (0, lodash_1.merge)({ row: cursor[group] }, mergeLayout));
        delete field.layout;
    }
    createGrid() {
        const { grid } = this.json;
        const { id = `${LATOUT_ID}`, groups, additional = [], ...other } = (0, lodash_1.merge)((0, lodash_1.cloneDeep)(defaultGrid), grid);
        const { justify, alignItems, spacing } = other;
        const groupLayout = (0, lodash_1.groupBy)(additional, ({ group }) => group);
        const defaultGroupAdditional = { justify, alignItems, spacing };
        const groupAdditional = groups.map((xs, index) => {
            const [item = {}] = groupLayout[index + 1] || [];
            return { xs, ...defaultGroupAdditional, ...item };
        });
        return { id, ...other, additional: groupAdditional };
    }
    destory() {
        this.defineProperty(this.cache, 'grid', null);
        this.defineProperty(this.builder, 'Element', null);
        this.layoutBuildFields.forEach((builderField) => this.defineProperty(builderField, 'layout', null));
        return super.destory();
    }
}
exports.GridExtension = GridExtension;
//# sourceMappingURL=grid.extension.js.map