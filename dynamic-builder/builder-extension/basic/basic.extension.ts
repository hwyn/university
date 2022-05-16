/* eslint-disable @typescript-eslint/no-empty-function */
import { LocatorStorage } from '@fm/di';
import { cloneDeep, isFunction, isString, merge } from 'lodash';
import { Observable } from 'rxjs';

import { BuilderProps, CacheObj } from '../../builder';
import { transformObj, withGetOrSet, withValue } from '../../utility';
import { Action, ActionInterceptProps, BaseAction } from '../action';
import { createActions, CreateOptions, getEventType } from '../action/create-actions';
import { CALCULATOR } from '../constant/calculator.constant';
import { BuilderFieldExtensions, BuilderModelExtensions, Calculators, CalculatorsDependent } from '../type-api';

export type CallBackOptions = [any, BuilderFieldExtensions];
type CallBack = (options: CallBackOptions) => any;

export const serializeAction = (action: ((...args: any[]) => any) | string | Action): Action => {
  return (isString(action) ? { name: action } : isFunction(action) ? { handler: action } : action) as unknown as Action;
};

export abstract class BasicExtension {
  protected jsonFields: any[];
  protected ls: LocatorStorage;

  constructor(
    protected builder: BuilderModelExtensions,
    protected props: BuilderProps,
    protected cache: CacheObj,
    protected json: any
  ) {
    this.ls = this.builder.ls;
    this.jsonFields = this.json?.fields;
  }

  protected abstract extension(): void | Observable<any>;
  protected afterExtension() { }
  protected beforeDestory(): void | Observable<any> { }
  protected destory(): void | Observable<any> { }

  public init(): Observable<BasicExtension> {
    return transformObj(this.extension(), this);
  }

  public afterInit(): Observable<() => void> {
    return transformObj(this.afterExtension(), () => transformObj(this.beforeDestory(), () => this.destory()));
  }

  protected eachFields(jsonFields: any[], callBack: CallBack) {
    jsonFields.forEach((jsonField) => callBack([jsonField, this.getBuilderFieldById(jsonField.id)]));
  }

  protected mapFields<T = BuilderFieldExtensions>(jsonFields: any[], callBack: CallBack): T[] {
    return jsonFields.map((jsonField) => {
      const builderField = this.getBuilderFieldById(jsonField.id);
      return callBack([jsonField, builderField]) || builderField;
    });
  }

  protected serializeCalculatorConfig(
    jsonCalculator: any,
    actionType: string,
    defaultDependents: CalculatorsDependent | CalculatorsDependent[]
  ) {
    const needSerialize = isString(jsonCalculator) || isFunction(jsonCalculator);
    const calculatorConfig = needSerialize ? { action: this.serializeAction(jsonCalculator) } : cloneDeep(jsonCalculator);
    const { action, dependents = defaultDependents } = calculatorConfig;
    calculatorConfig.action = merge({ type: actionType }, this.serializeAction(action));
    calculatorConfig.dependents = dependents;
    return calculatorConfig;
  }

  protected bindCalculatorAction(handler: (baseAction: BaseAction) => any) {
    return { type: CALCULATOR, handler };
  }

  protected pushCalculators(fieldConfig: BuilderFieldExtensions, calculator: Calculators | Calculators[]) {
    fieldConfig.calculators = this.toArray(fieldConfig.calculators || []);
    const { calculators = [] } = fieldConfig;
    calculators.push(...this.toArray(calculator));
    fieldConfig.calculators = calculators;
  }

  protected pushAction(fieldConfig: BuilderFieldExtensions, actions: Action | Action[]) {
    fieldConfig.actions = this.toArray(fieldConfig.actions || []);
    const { actions: defaultAction } = fieldConfig;
    this.toArray(actions).forEach((pushAction) => {
      const findAction = defaultAction.find(({ type: defaultType }: Action) => pushAction.type === defaultType);
      !findAction ? defaultAction.push(pushAction) : Object.assign(findAction, { ...pushAction });
    });
  }

  protected toArray<T = any>(obj: any): T[] {
    return Array.isArray(obj) ? obj : [obj];
  }

  protected defineProperty(object: any, prototypeName: string, value: any) {
    Object.defineProperty(object, prototypeName, withValue(value));
  }

  protected definePropertys(object: any, prototype: { [key: string]: any }) {
    Object.keys(prototype).forEach((key: string) => this.defineProperty(object, key, prototype[key]));
  }

  protected definePropertyGet(object: any, prototypeName: string, get: () => any) {
    Object.defineProperty(object, prototypeName, withGetOrSet(get));
  }

  protected unDefineProperty(object: any, prototypeNames: string[]) {
    prototypeNames.forEach((prototypeName: string) => this.defineProperty(object, prototypeName, null));
  }

  protected serializeAction(action: ((...args: any[]) => any) | string | Action) {
    return serializeAction(action);
  }

  protected createActions(actions: Action[], props: ActionInterceptProps, options: CreateOptions) {
    return createActions(actions, props, options);
  }

  protected getEventType(type: string) {
    return getEventType(type);
  }

  protected getJsonFieldById(fieldId: string): any {
    return this.jsonFields.find(({ id }) => fieldId === id);
  }

  protected getBuilderFieldById(fieldId: string): BuilderFieldExtensions {
    return this.builder.getFieldById<BuilderFieldExtensions>(fieldId);
  }
}
