/* eslint-disable max-lines-per-function */
import { Inject, LocatorStorage } from '@di';
import { flatMap, isEmpty } from 'lodash';
import { forkJoin, Observable, of } from 'rxjs';
import { concatMap, map, switchMap } from 'rxjs/operators';

import { ACTIONS_CONFIG } from '../../token';
import { transformObservable } from '../../utility';
import { serializeAction } from '../basic/basic.extension';
import { BuilderModelExtensions, OriginCalculators } from '../type-api';
import { ActionIntercept, ActionInterceptProps, BaseAction } from '.';
import { Action as ActionProps, ActionContext } from './type-api';

export class Action implements ActionIntercept {
  private actions: any[];

  constructor(
    @Inject(LocatorStorage) private ls: LocatorStorage,
    @Inject(ACTIONS_CONFIG) actions: any[][],
  ) {
    this.actions = flatMap(actions);
  }

  private getAction(name: string) {
    const [{ action = null } = {}] = this.actions.filter(({ name: actionName }) => actionName === name);
    return action;
  }

  private createEvent(event: any, otherEventParam: any[] = []): any[] {
    return [event, ...otherEventParam];
  }

  private callCalculatorsInvokes(calculators: OriginCalculators[], builder: BuilderModelExtensions) {
    const calculatorsOb = of(...calculators);
    return (value: any) => calculatorsOb.pipe(
      concatMap(({ targetId: id, action }) => this.invoke(action, { builder, id }, value))
    );
  }

  protected getActionContext({ builder, id }: ActionInterceptProps = {} as any): ActionContext {
    return isEmpty(builder) ? {} : { builder, builderField: builder.getFieldById(id) };
  }

  private invokeCallCalculators(calculators: OriginCalculators[], { type }: ActionProps, props: ActionInterceptProps) {
    const { builder, id: currentId } = props;
    const filterCalculators = calculators.filter(
      ({ dependent: { fieldId, type: calculatorType } }) => fieldId === currentId && calculatorType === type
    );
    return !isEmpty(filterCalculators) ? this.callCalculatorsInvokes(filterCalculators, builder) : (value: any) => of(value);
  }

  private invokeCalculators(actionProps: ActionProps, actionSub: Observable<any>, props: ActionInterceptProps) {
    const { builder, id } = props;
    const { calculators } = builder;
    const nonSelfBuilders: BuilderModelExtensions[] = builder.$$cache.nonSelfBuilders || [];
    const calculatorsInvokes = nonSelfBuilders.map((nonBuild) =>
      this.invokeCallCalculators(nonBuild.nonSelfCalculators, actionProps, { builder: nonBuild, id })
    );
    calculatorsInvokes.push(this.invokeCallCalculators(calculators || [], actionProps, props))
    return actionSub.pipe(
      switchMap((value) => forkJoin(
        calculatorsInvokes.map((invokeCalculators: any) => invokeCalculators(value))
      ).pipe(map(() => value)))
    );
  }

  private invokeAction(action: ActionProps, props?: ActionInterceptProps, event: Event | any = null, ...otherEventParam: any[]) {
    const { name, handler, stop } = action;
    if (stop && !isEmpty(event) && event?.stopPropagation) {
      event.stopPropagation();
    }
    const e = this.createEvent(event, otherEventParam);
    return name || handler ? this.executeAction(action, this.getActionContext(props), e) : of(event);
  }

  public invoke(
    actions: ActionProps | ActionProps[], props?: ActionInterceptProps, event: Event | any = null, ...otherEventParam: any[]
  ): Observable<any> {
    const _actions = Array.isArray(actions) ? actions : [actions];
    if (isEmpty(_actions)) { return of(event); }
    const action = serializeAction(_actions.filter(({ type }) => !!type)[0]);
    const actionsSub = forkJoin((_actions).map((action) => (
      this.invokeAction(serializeAction(action), props, event, ...otherEventParam)
    ))).pipe(map((result: any[]) => result.pop()));

    return !!props && !!action && !isEmpty(props) ? this.invokeCalculators(action, actionsSub, props) : actionsSub;
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
    let builder = action.builder;

    if (!executeHandler && builder) {
      while (builder) {
        executeHandler = builder.getExecuteHandler(name) || executeHandler;
        if (builder === builder.root) { break; }
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
