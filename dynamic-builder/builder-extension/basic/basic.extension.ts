/* eslint-disable @typescript-eslint/no-empty-function */
import { LocatorStorage } from '@di';
import { cloneDeep, isArray, isString, merge } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BuilderProps, CacheObj } from '../../builder';
import { transformObservable, withValue } from '../../utility';
import { Action, BaseAction } from '../action';
import { getEventType } from '../action/create-actions';
import { BuilderFieldExtensions, BuilderModelExtensions, Calculators, CalculatorsDependent } from '../type-api';

export type CallBackOptions = [any, BuilderFieldExtensions];
type CallBack = (options: CallBackOptions) => any;

export const serializeAction = (action: string | Action): Action => {
  return isString(action) ? { name: action } as unknown as Action : action;
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

  protected beforeExtension() { }
  protected abstract extension(): void | Observable<any>;
  protected afterExtension() { }
  protected destory(): void { }

  public beforeInit(): Observable<BasicExtension> {
    return transformObservable(this.beforeExtension()).pipe(map(() => this));
  }

  public init(): Observable<BasicExtension> {
    return transformObservable(this.extension()).pipe(map(() => this));
  }

  public afterInit(): Observable<() => void> {
    return transformObservable(this.afterExtension()).pipe(
      map(() => () => transformObservable(this.destory()))
    );
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
    const calculatorConfig = isString(jsonCalculator) ? { action: { name: jsonCalculator } } : cloneDeep(jsonCalculator);
    const { action, dependents = defaultDependents } = calculatorConfig;
    calculatorConfig.action = merge({ type: actionType }, this.serializeAction(action));
    calculatorConfig.dependents = dependents;
    return calculatorConfig;
  }

  protected bindCalculatorAction(handler: (baseAction: BaseAction) => any) {
    return { type: 'calculator', handler };
  }

  protected pushCalculators(fieldConfig: BuilderFieldExtensions, calculator: Calculators | Calculators[]) {
    const { calculators = [] } = fieldConfig;
    calculators.push(...this.toArray(calculator));
    fieldConfig.calculators = calculators;
  }

  protected toArray<T = any>(obj: any): T[] {
    return isArray(obj) ? obj : [obj];
  }

  protected defineProperty(object: any, prototypeName: string, value: any) {
    Object.defineProperty(object, prototypeName, withValue(value));
  }

  protected unDefineProperty(object: any, prototypeNames: string[]) {
    prototypeNames.forEach((prototypeName: string) => this.defineProperty(object, prototypeName, null));
  }

  protected serializeAction(action: string | Action) {
    return serializeAction(action);
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
