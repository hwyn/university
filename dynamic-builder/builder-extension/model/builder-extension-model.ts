import { BuilderModel } from '../../builder/builder-model';
import { BuilderFieldExtensions, BuilderModelExtensions } from '../type-api';

export class BuilderExtensionsModel extends BuilderModel<BuilderModelExtensions, BuilderFieldExtensions> {
  readonly viewModel?: any;
  refreshData!: (model: any) => void;
  notifyViewModelChanges!: (builderField?: BuilderFieldExtensions, options?: { hasSelf: boolean }) => void;
}