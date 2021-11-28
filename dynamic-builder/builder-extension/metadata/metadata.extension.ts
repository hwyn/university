import { BasicExtension, CallBackOptions } from '../basic/basic.extension';

export class MetadataExtension extends BasicExtension {
  protected extension() {
    const metadataFields = this.jsonFields.filter(({ metadata }: any) => !!metadata);
    this.eachFields(metadataFields, ([, builderField]: CallBackOptions) => {
      const { field, field: { metadata } } = builderField;
      this.defineProperty(builderField, 'metadata', metadata);
      delete field.metadata;
    });
  }
}
