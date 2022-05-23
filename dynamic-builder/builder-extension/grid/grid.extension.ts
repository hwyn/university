import { cloneDeep, merge } from 'lodash';

import { BIND_BUILDER_ELEMENT } from '../../token';
import { BasicExtension, CallBackOptions } from '../basic/basic.extension';
import { ELEMENT, GRID, LAYOUT, LOAD } from '../constant/calculator.constant';
import { BuilderFieldExtensions } from '../type-api';
import { Grid } from './grid';

const defaultLayout = { column: 12, group: 1 };
export class GridExtension extends BasicExtension {
  private layoutBuildFields!: BuilderFieldExtensions[];

  protected extension() {
    this.pushCalculators(this.json, {
      action: this.bindCalculatorAction(this.createLoadGrid.bind(this)),
      dependents: { type: LOAD, fieldId: this.builder.id }
    });
  }

  private createLoadGrid(): void {
    this.defineProperty(this.cache, GRID, new Grid(this.builder, this.json));
    this.layoutBuildFields = this.mapFields(this.jsonFields, this.addFieldLayout.bind(this, {}));
    this.defineProperty(this.builder, ELEMENT, this.ls.getProvider(BIND_BUILDER_ELEMENT, this.cache.grid, this.builder));
  }

  private addFieldLayout(cursor: { [key: string]: number }, [, builderField]: CallBackOptions) {
    const { field, field: { layout = {} } } = builderField;
    const mergeLayout = merge(cloneDeep(defaultLayout), layout);
    const { row, group } = mergeLayout;
    cursor[group] = row || cursor[group] || 1;
    this.defineProperty(builderField, LAYOUT, merge({ row: cursor[group] }, mergeLayout));
    delete field.layout;
  }

  protected destory() {
    this.defineProperty(this.cache, GRID, null);
    this.defineProperty(this.builder, ELEMENT, null);
    this.layoutBuildFields.forEach((builderField) => this.defineProperty(builderField, LAYOUT, null));
    return super.destory();
  }
}
