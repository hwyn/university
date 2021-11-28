import { BaseAction } from '../action';
import { BasicExtension } from '../basic/basic.extension';

export class ViewModelExtension extends BasicExtension {
  protected extension()  {
    this.pushCalculators(this.json, {
      action: this.createViewModelCalculator(),
      dependents: { type: 'load', fieldId: this.builder.id }
    });
  }

  private createViewModelCalculator() {
    const { actions = [] } = this.json;
    const hasLoadEvent = actions.some(({ type = `` }) => type === 'load');
    const handler = ({ actionEvent }: BaseAction) => {
      this.defineProperty(this.builder, 'viewModel', hasLoadEvent ? actionEvent : {});
    };
    return { type: 'loadViewModel', handler };
  }

  protected destory() {
    this.defineProperty(this.builder, 'viewModel', null);
    return super.destory();
  }
}
