import { BasicExtension, CallBackOptions } from 'dynamic-builder';
import { isEmpty } from 'lodash';
import { factoryListComponent } from './builder-list';

export class ListExtension extends BasicExtension {
  private jsonGrid = this.json.grid;
  protected extension() {
    const listField = this.jsonFields.filter(({ listMetadata }) => !isEmpty(listMetadata));
    this.eachFields(listField, this.proxyField.bind(this));
  }

  private proxyField([jsonField, builderField]: CallBackOptions) {
    const { layout, listMetadata, calculators, checkVisibility, dataSource: { metadata }, ...otherJsonField } = jsonField;
    const { listLayout, justify, alignItems, spacing = this.jsonGrid.spacing } = listMetadata || {};
    const { field } = builderField;
    builderField.element = factoryListComponent({
      additional: { spacing, justify, alignItems },
      fieldTemplate: { ...otherJsonField, dataSource: { metadata }, layout: listLayout }
    });
    delete field.listMetadata;
  }
}
