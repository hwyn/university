import { Action, ActionInterceptProps, BaseAction } from '../action';
import { BasicExtension } from '../basic/basic.extension';
import { LOAD, LOAD_VIEW_MODEL, NOTIFY_VIEW_MODEL_CHANGE, REFRES_DATA, VIEW_MODEL } from '../constant/calculator.constant';
import { BaseView } from './base.view';
import { notifyOptions } from './type-api';

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
      this.createViewModel(hasLoadEvent ? actionEvent : {});
      this.createNotifyEvent();
    };
    return { type: LOAD_VIEW_MODEL, handler };
  }

  private createViewModel(store: any) {
    this.defineProperty(this.cache, VIEW_MODEL, store instanceof BaseView ? store : new BaseView(this.ls, store));
    this.definePropertyGet(this.builder, VIEW_MODEL, () => this.cache.viewModel.model);
  }

  private createNotifyEvent() {
    const notifyAction = { type: NOTIFY_VIEW_MODEL_CHANGE, handler: this.notifyHandler.bind(this) } as Action;
    const refresAction = { type: REFRES_DATA, handler: this.refresHandler.bind(this) } as Action;
    const props = { builder: this.builder, id: this.builder.id } as unknown as ActionInterceptProps;
    const actions = this.createActions([notifyAction, refresAction], props, { ls: this.ls });
    this.definePropertys(this.builder, {
      [NOTIFY_VIEW_MODEL_CHANGE]: actions[this.getEventType(NOTIFY_VIEW_MODEL_CHANGE)],
      [REFRES_DATA]: actions[this.getEventType(REFRES_DATA)]
    });
  }

  private notifyHandler({ builder, actionEvent }: BaseAction, options: notifyOptions = { hasSelf: true }) {
    if (!options?.hasSelf) {
      builder.children.forEach((child) => child.notifyViewModelChanges(actionEvent, options));
    }
    return actionEvent;
  }

  private refresHandler({ actionEvent }: BaseAction) {
    this.cache?.viewModel.refreshData(actionEvent);
  }

  protected destory() {
    this.unDefineProperty(this.cache, [VIEW_MODEL]);
    this.unDefineProperty(this.builder, [VIEW_MODEL, NOTIFY_VIEW_MODEL_CHANGE]);
    return super.destory();
  }
}
