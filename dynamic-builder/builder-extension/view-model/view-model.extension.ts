import { Action, ActionInterceptProps, BaseAction } from '../action';
import { BasicExtension } from '../basic/basic.extension';
import { LOAD, LOAD_VIEW_MODEL, NOTIFY_VIEW_MODEL_CHANGE, VIEW_MODEL } from '../constant/calculator.constant';

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
      this.createNotifyEvent();
      this.definePropertys(this.builder, {
        [NOTIFY_VIEW_MODEL_CHANGE]: this.createNotifyEvent(),
        [VIEW_MODEL]: hasLoadEvent ? actionEvent : {}
      });
    };
    return { type: LOAD_VIEW_MODEL, handler };
  }

  private createNotifyEvent() {
    const handler = this.notifyHandler.bind(this);
    const notifyAction = { type: NOTIFY_VIEW_MODEL_CHANGE, handler } as Action;
    const props = { builder: this.builder, id: this.builder.id } as unknown as ActionInterceptProps;
    return this.createActions([notifyAction], props, { ls: this.ls })[this.getEventType(NOTIFY_VIEW_MODEL_CHANGE)];
  }

  private notifyHandler({ builder }: BaseAction) {
    builder.children.forEach((child) => child.notifyViewModelChanges && child.notifyViewModelChanges());
  }

  protected destory() {
    this.unDefineProperty(this.builder, [VIEW_MODEL, NOTIFY_VIEW_MODEL_CHANGE]);
    return super.destory();
  }
}
