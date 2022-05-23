import { isEmpty, isUndefined } from 'lodash';

import { BaseAction } from '../action';
import { BasicExtension, CallBackOptions } from '../basic/basic.extension';
import { DATD_SOURCE, LOAD_ACTION, LOAD_VIEW_MODEL } from '../constant/calculator.constant';
import { BuilderFieldExtensions } from '../type-api';

export class DataSourceExtension extends BasicExtension {
  private builderFields!: BuilderFieldExtensions[];

  protected extension() {
    const jsonFields = this.jsonFields.filter(({ dataSource }) => !isUndefined(dataSource));

    if (!isEmpty(jsonFields)) {
      this.builderFields = this.mapFields(jsonFields, this.addFieldCalculators.bind(this));

      this.pushCalculators(this.json, [{
        action: this.bindCalculatorAction(this.createOnDataSourceConfig.bind(this)),
        dependents: { type: LOAD_ACTION, fieldId: this.builder.id }
      }]);
    }
  }

  private addFieldCalculators([jsonField]: CallBackOptions) {
    const { action, dependents, metadata } = this.serializeDataSourceConfig(jsonField);
    action.after = this.bindCalculatorAction(this.createSourceConfig.bind(this, metadata));
    this.pushCalculators(jsonField, { action, dependents });
  }

  private createSourceConfig(metadata: any, { actionEvent, builderField, builderField: { instance } }: BaseAction): void {
    builderField.source = this.sourceToMetadata(actionEvent, metadata);
    instance.detectChanges();
  }

  private createOnDataSourceConfig(): void {
    this.builderFields.forEach((builderField) => {
      const { events = {}, field } = builderField;
      if (events.onDataSource) {
        events.onDataSource && this.defineProperty(builderField, this.getEventType(DATD_SOURCE), events.onDataSource);
        delete events.onDataSource;
      }
      delete field.dataSource;
    });
  }

  private serializeDataSourceConfig(jsonField: any) {
    const { dataSource: jsonDataSource } = jsonField;
    const defaultDependents = { type: LOAD_VIEW_MODEL, fieldId: this.builder.id };
    const dataSource = this.serializeCalculatorConfig(jsonDataSource, DATD_SOURCE, defaultDependents);
    const { action, source } = dataSource;

    if (!isEmpty(source) && !action.handler) {
      action.handler = () => source;
    }

    return dataSource;
  }

  private sourceToMetadata(sources: any, metadata: any = {}) {
    if (isEmpty(metadata)) {
      return sources;
    }

    const metdataKeys = Object.keys(metadata);
    this.toArray(sources).forEach((source: any) => {
      metdataKeys.forEach((key) => {
        const value = source[metadata[key]];
        if (![undefined].includes(value)) {
          source[key] = value;
        }
      });
    });
    return sources;
  }
}
