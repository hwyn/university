import { BaseAction } from '../action';
import { BasicExtension } from '../basic/basic.extension';
import { LOAD, LOAD_VIEW_MODEL, VIEW_MODEL } from '../constant/calculator.constant';

export class ViewModelExtension extends BasicExtension {
  protected extension() {
    this.pushCalculators(this.json, {
      action: this.createViewModelCalculator(),
      dependents: { type: LOAD, fieldId: this.builder.id }
    });
  }

  private createViewModelCalculator() {
    const { actions = [] } = this.json;
    const hasLoadEvent = actions.some(({ type = `` }) => type === LOAD);
    const handler = ({ actionEvent }: BaseAction) => {
      this.defineProperty(this.builder, VIEW_MODEL, hasLoadEvent ? actionEvent : {});
    };
    return { type: LOAD_VIEW_MODEL, handler };
  }

  protected destory() {
    this.defineProperty(this.builder, VIEW_MODEL, null);
    return super.destory();
  }
}
