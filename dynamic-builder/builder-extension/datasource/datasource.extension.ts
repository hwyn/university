import { isEmpty, isUndefined } from 'lodash';

import { BaseAction } from '../action';
import { BasicExtension, CallBackOptions } from '../basic/basic.extension';
import { BuilderFieldExtensions } from '../type-api';

export class DataSourceExtension extends BasicExtension {
  private builderFields!: BuilderFieldExtensions[];

  protected extension() {
    this.builderFields = this.mapFields(
      this.jsonFields.filter(({ dataSource }) => !isUndefined(dataSource)),
      this.addFieldCalculators.bind(this)
    );

    if (!isEmpty(this.builderFields)) {
      this.pushCalculators(this.json, [{
        action: this.bindCalculatorAction(this.createOnDataSourceConfig.bind(this)),
        dependents: { type: 'loadAction', fieldId: this.builder.id }
      }]);
    }
  }

  private addFieldCalculators([jsonField, builderField]: CallBackOptions) {
    const { action, dependents, metadata } = this.serializeDataSourceConfig(jsonField);
    this.pushCalculators(jsonField, [
      { action, dependents },
      {
        action: this.bindCalculatorAction(this.createSourceConfig.bind(this, metadata)),
        dependents: { fieldId: builderField.id, type: action.type }
      }
    ]);
  }

  private createSourceConfig(metadata: any, { actionEvent, builderField, builderField: { instance } }: BaseAction): void {
    builderField.source = this.sourceToMetadata(actionEvent, metadata);
    instance.detectChanges();
  }

  private createOnDataSourceConfig(): void {
    this.builderFields.forEach((builderField) => {
      const { events = {}, field } = builderField;
      this.defineProperty(builderField, 'onDataSource', events.onDataSource);
      delete field.dataSource;
      delete events.onDataSource;
    });
  }

  private serializeDataSourceConfig(jsonField: any) {
    const { dataSource: jsonDataSource } = jsonField;
    const defaultDependents = { type: 'loadViewModel', fieldId: this.builder.id };
    const dataSource = this.serializeCalculatorConfig(jsonDataSource, 'dataSource', defaultDependents);
    const { action, source } = dataSource;

    if (!isEmpty(source)) {
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
