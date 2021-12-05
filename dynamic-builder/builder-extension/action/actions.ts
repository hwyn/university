/* eslint-disable max-lines-per-function */
import { flatMap, isEmpty } from 'lodash';
import { Observable, of } from 'rxjs';
import { concatMap, filter, map, switchMap, toArray } from 'rxjs/operators';
import { ActionIntercept, ActionInterceptProps, BaseAction } from '.';
import { BuilderModelImplements } from '../../builder';
import { Inject, LocatorStorage } from '@di';
import { ACTIONS_CONFIG } from '../../token';
import { transformObservable } from '../../utility';
import { serializeAction } from '../basic/basic.extension';
import { BuilderModelExtensions } from '../type-api';
import { Action as ActionProps, ActionContext } from './type-api';
export class Action implements ActionIntercept {
  private actions: any[];

  constructor(
    @Inject(LocatorStorage) private ls: LocatorStorage,
    @Inject(ACTIONS_CONFIG) actions: any[][],
  ) {
    this.actions = flatMap(actions);
  }

  private createEvent(event: any, otherEventParam: any[] = []): any[] {
    return [event, ...otherEventParam];
  }

  private callCalculatorsInvokes(calculators: any, builder: BuilderModelImplements) {
    const calculatorsOb = of(...calculators);
    return (value: any) => calculatorsOb.pipe(
      concatMap(({ targetId, action: calculatorAction }: any) => this.invoke(calculatorAction, { builder, id: targetId }, value)),
      toArray(),
      map(() => value)
    );
  }

  private getAction(name: string) {
    const [{ action = null } = {}] = this.actions.filter(({ name: actionName }) => actionName === name);
    return action;
  }

  protected getActionContext({ builder, id }: ActionInterceptProps = {} as any): ActionContext {
    return isEmpty(builder) ? {} : { builder, builderField: builder.getFieldById(id) };
  }

  private invokeCalculators({ type }: ActionProps, actionSub: Observable<any>, props: ActionInterceptProps) {
    const { builder, id: currentId } = props;
    const { calculators = [] } = builder as BuilderModelExtensions;
    const filterCalculators = calculators.filter(
      ({ dependent: { fieldId, type: calculatorType } }) => fieldId === currentId && calculatorType === type
    );

    if (!isEmpty(filterCalculators)) {
      const calculatorsInvokes = this.callCalculatorsInvokes(filterCalculators, builder);
      actionSub = actionSub.pipe(switchMap((value) => calculatorsInvokes(value)));
    }

    return actionSub;
  }

  // eslint-disable-next-line complexity
  public invoke(
    action: ActionProps,
    props?: ActionInterceptProps,
    event: Event | any = null,
    ...otherEventParam: any[]
  ): Observable<any> {
    if (props && props.builder && props.builder.$$cache.destoryed) {
      return of(null).pipe(filter(() => false));
    }
    const _action = serializeAction(action);
    const { type, name, handler, stop } = _action;
    if (stop && !isEmpty(event) && event?.stopPropagation) {
      event.stopPropagation();
    }

    const e = this.createEvent(event, otherEventParam);
    const actionSub = name || handler ? this.executeAction(_action, this.getActionContext(props), e) : of(event);

    return !!props && !!type && !isEmpty(props) ? this.invokeCalculators(_action, actionSub, props) : actionSub;
  }

  // eslint-disable-next-line complexity
  public executeAction(
    actionPropos: ActionProps,
    actionContext?: ActionContext,
    event: any[] = this.createEvent(void (0))
  ): Observable<any> {
    const [actionEvent, ...otherEvent] = event;
    const { name = ``, handler } = serializeAction(actionPropos);
    const [actionName, execute = 'execute'] = name.match(/([^.]+)/ig) || [name];
    const context = { ...actionContext, actionPropos, actionEvent };
    let action = new BaseAction(this.ls, context);
    let executeHandler = handler;

    if (!executeHandler && action.builder) {
      let builder = action.builder;
      while (builder) {
        const builderHandler = (builder as any)[name];
        executeHandler = builderHandler ? builderHandler.bind(builder) : executeHandler;
        if (builder === builder.root) {
          break;
        }
        builder = builder.parent as BuilderModelExtensions;
      }
    }

    if (!executeHandler) {
      const ActionType = this.getAction(actionName);
      action = ActionType && new ActionType(this.ls, context);
      executeHandler = action && (action as any)[execute].bind(action);
    }

    if (!executeHandler) {
      throw new Error(`${name} not defined!`);
    }

    return transformObservable(executeHandler.apply(undefined, [action, ...otherEvent]));
  }
}
