import { cloneDeep, groupBy, merge } from 'lodash';
import { BIND_BUILDER_ELEMENT } from '../../token';
import { BasicExtension, CallBackOptions } from '../basic/basic.extension';
import { BuilderFieldExtensions, Grid } from '../type-api';

const LATOUT_ID = 'grid-id-model';
const defaultLayout = { column: 12, group: 1 };
const defaultGrid: Grid = {
  spacing: 0,
  justify: 'flex-start',
  alignItems: 'flex-start',
  groups: [12]
};

export class GridExtension extends BasicExtension {
  private layoutBuildFields!: BuilderFieldExtensions[];
  
  protected extension() {
    this.pushCalculators(this.json, {
      action: this.bindCalculatorAction(this.createLoadGrid.bind(this)),
      dependents: { type: 'load', fieldId: this.builder.id }
    });
  }

  private createLoadGrid(): void {
    this.defineProperty(this.cache, 'grid', this.createGrid());
    this.layoutBuildFields = this.mapFields(this.jsonFields, this.addFieldLayout.bind(this, {}));
    this.defineProperty(this.builder, 'Element', this.ls.getProvider(BIND_BUILDER_ELEMENT, this.cache.grid));
  }

  private addFieldLayout(cursor: { [key: string]: number }, [, builderField]: CallBackOptions) {
    const { field, field: { layout } } = builderField;
    const mergeLayout = merge(cloneDeep(defaultLayout), layout || {});
    const { row, group } = mergeLayout;
    cursor[group] = row || cursor[group] || 1;
    this.defineProperty(builderField, 'layout', merge({ row: cursor[group] }, mergeLayout));
    delete field.layout;
  }

  private createGrid(): Grid {
    const { grid } = this.json;
    const { id = `${LATOUT_ID}`, groups, additional = [], ...other } = merge(cloneDeep(defaultGrid), grid);
    const { justify, alignItems, spacing } = other;
    const groupLayout = groupBy(additional, ({ group }) => group);
    const defaultGroupAdditional = { justify, alignItems, spacing };
    const groupAdditional = groups.map((xs: string, index: number) => {
      const [item = {}] = groupLayout[index + 1] || [];
      return { xs, ...defaultGroupAdditional, ...item };
    });
    return { id, ...other, additional: groupAdditional };
  }

  protected destory() {
    this.defineProperty(this.cache, 'grid', null);
    this.defineProperty(this.builder, 'Element', null);
    this.layoutBuildFields.forEach((builderField) => this.defineProperty(builderField, 'layout', null));
    return super.destory();
  }
}
