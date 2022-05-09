/* eslint-disable max-lines-per-function */
import { Inject, LocatorStorage } from '@fm/di';
import { flatMap, isEmpty } from 'lodash';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { ACTIONS_CONFIG } from '../../token';
import { observableTap, transformObservable } from '../../utility';
import { serializeAction } from '../basic/basic.extension';
import { BuilderModelExtensions, OriginCalculators } from '../type-api';
import { BaseAction } from './base.action';
import { Action as ActionProps, ActionContext, ActionIntercept, ActionInterceptProps } from './type-api';

type ActionLinkProps = ActionProps & { callLink?: any[] };

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

  protected getActionContext({ builder, id }: ActionInterceptProps = {} as any): ActionContext {
    return isEmpty(builder) ? {} : { builder, builderField: builder.getFieldById(id) };
  }

  private call(calculators: OriginCalculators[], builder: BuilderModelExtensions, callLink: any[] = []) {
    return (value: any) => forkJoin(calculators.map(({ targetId: id, action }) => {
      return this.invoke({ ...action, callLink } as ActionProps, { builder, id }, value)
    }));
  }

  private invokeCallCalculators(calculators: OriginCalculators[], { type, callLink }: ActionLinkProps, props: ActionInterceptProps) {
    const { builder, id } = props;
    const link = [...callLink || [], { fieldId: id, type: type }];
    const filterCalculators = calculators.filter(
      ({ dependent: { fieldId, type: cType } }) => fieldId === id && cType === type
    );
    return !isEmpty(filterCalculators) ? this.call(filterCalculators, builder, link) : (value: any) => of(value);
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
      observableTap((value) => forkJoin(
        calculatorsInvokes.map((invokeCalculators: any) => invokeCalculators(value))
      ))
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
    let actionsSub;
    let action;
    if (Array.isArray(actions)) {
      action = serializeAction(actions.filter(({ type }) => !!type)[0]);
      actionsSub = forkJoin((actions).map((a) => (
        this.invokeAction(serializeAction(a), props, event, ...otherEventParam)
      ))).pipe(map((result: any[]) => result.pop()));
    } else {
      action = serializeAction(actions);
      actionsSub = this.invokeAction(action, props, event, ...otherEventParam);
    }
    const hasInvokeCalculators = !isEmpty(props) && action && action.type;
    return hasInvokeCalculators ? this.invokeCalculators(action, actionsSub, props as ActionInterceptProps) : actionsSub;
  }

  // eslint-disable-next-line complexity
  public executeAction(
    actionPropos: ActionProps, actionContext?: ActionContext, event: any[] = this.createEvent(void (0))
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
