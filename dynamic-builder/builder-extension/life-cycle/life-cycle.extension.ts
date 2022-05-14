import { filter, Observable, of, tap } from '@fm/import-rxjs';
import { cloneDeep, flatMap, isEmpty } from 'lodash';

import { BuilderProps } from '../../builder';
import { observableMap, transformObservable } from '../../utility';
import { Action, ActionInterceptProps } from '../action';
import { BasicExtension } from '../basic/basic.extension';
import { CHANGE, DESTORY, LOAD, NON_SELF_BUILSERS, ORIGIN_CALCULATORS, ORIGIN_NON_SELF_CALCULATORS } from '../constant/calculator.constant';
import { BuilderFieldExtensions, BuilderModelExtensions, OriginCalculators } from '../type-api';

export class LifeCycleExtension extends BasicExtension {
  protected hasChange = false;
  protected calculators: OriginCalculators[] = [];
  protected nonSelfCalculators: OriginCalculators[] = [];
  protected lifeActions!: { [key: string]: (event?: Event, ...arg: any[]) => any };
  protected detectChanges: any = this.cache.detectChanges.pipe(filter(() => !this.hasChange));

  protected extension() {
    const nonSelfBuilders = this.builder.root.$$cache.nonSelfBuilders;
    this.defineProperty(this.cache, NON_SELF_BUILSERS, nonSelfBuilders || []);
  }

  protected afterExtension() {
    this.serializeCalculators();
    return this.createLife();
  }

  protected createLife(): Observable<any> {
    const { actions = [] } = this.json;
    const lifeEvent = [LOAD, CHANGE];
    const lifeActionsType = actions.filter(({ type }: Action) => lifeEvent.includes(type));
    const props = { builder: this.builder, id: this.builder.id } as unknown as ActionInterceptProps;
    lifeActionsType.forEach((action: any) => action.runObservable = true);
    this.lifeActions = this.createActions(lifeActionsType, props, { ls: this.ls });
    this.defineProperty(this.builder, this.getEventType(CHANGE), this.onLifeChange.bind(this));
    return this.invokeLifeCycle(this.getEventType(LOAD), this.props);
  }

  protected onLifeChange(props: BuilderProps) {
    this.hasChange = true;
    this.invokeLifeCycle(this.getEventType(CHANGE), props).subscribe();
    this.hasChange = false;
  }

  protected invokeLifeCycle(type: string, event?: any, otherEvent?: any): Observable<any> {
    const lifeActions = this.lifeActions;
    return lifeActions[type] ? lifeActions[type](event, otherEvent) : of(event);
  }

  protected serializeCalculators() {
    this.createCalculators();
    this.linkCalculators();
    this.bindCalculator();
  }

  protected linkCalculators() {
    this.calculators.forEach((calculator) => this.linkCalculator(calculator));
    this.getNonSelfCalculators().forEach((calculator) => this.linkCalculator(calculator, true));
  }

  protected linkCalculator(calculator: OriginCalculators, nonSelfCalculator?: boolean) {
    const { type, fieldId } = calculator.dependent;
    const sourceField: BuilderFieldExtensions = this.getJsonFieldById(fieldId as string) || this.json;
    sourceField.actions = this.toArray(sourceField.actions || []);
    const { actions = [], id: sourceId } = sourceField;
    const nonSource = fieldId !== sourceId;
    if (nonSource && !nonSelfCalculator) {
      this.nonSelfCalculators.push(calculator);
      this.linkOtherCalculator(calculator);
    }
    if (!nonSource && !actions.some((action) => action.type === type)) {
      sourceField.actions = [{ type }, ...actions];
    }
  }

  private linkOtherCalculator(calculator: OriginCalculators) {
    const { type, fieldId = '' } = calculator.dependent;
    const otherFields = this.builder.root.getAllFieldById(fieldId);
    if (!isEmpty(otherFields)) {
      otherFields.forEach((otherField) => otherField.addEventListener({ type }));
    }
  }

  private createCalculators() {
    const fields = [...this.jsonFields, this.json];
    const fieldsCalculators = cloneDeep(fields.filter(({ calculators }) => !isEmpty(calculators)));
    this.calculators = [];
    fieldsCalculators.forEach(({ id: targetId, calculators = [] }) => {
      this.toArray(calculators).forEach(({ action, dependents }) => {
        this.toArray(dependents).forEach((dependent: any) => {
          this.calculators.push({ targetId, action: this.serializeAction(action), dependent });
        });
      });
      delete this.getBuilderFieldById(targetId)?.field.calculators;
    });
  }

  private getNonSelfCalculators(): OriginCalculators[] {
    return flatMap(this.nonSelfBuilders.map((nonSelf) => nonSelf.nonSelfCalculators));
  }

  get nonSelfBuilders(): BuilderModelExtensions[] {
    return this.cache.nonSelfBuilders;
  }

  private bindCalculator() {
    this.builder.calculators = this.calculators;
    this.builder.nonSelfCalculators = this.nonSelfCalculators;
    this.defineProperty(this.cache, ORIGIN_CALCULATORS, this.calculators);
    this.defineProperty(this.cache, ORIGIN_NON_SELF_CALCULATORS, this.nonSelfCalculators);
    if (this.nonSelfCalculators.length) {
      this.nonSelfBuilders.push(this.builder);
    }
  }

  protected beforeDestory() {
    return this.invokeLifeCycle(this.getEventType(DESTORY)).pipe(
      observableMap(() => transformObservable(super.beforeDestory()))
    );
  }

  protected destory() {
    if (this.nonSelfCalculators.length) {
      this.nonSelfBuilders.splice(this.nonSelfBuilders.indexOf(this.builder), 1);
    }
    this.unDefineProperty(this.builder, ['calculators', 'nonSelfCalculators', this.getEventType(CHANGE)]);
    this.unDefineProperty(this.cache, [ORIGIN_CALCULATORS, ORIGIN_NON_SELF_CALCULATORS, NON_SELF_BUILSERS]);
    this.unDefineProperty(this, ['detectChanges', 'lifeActions']);
    const parentField = this.builder.parent?.getFieldById(this.builder.id);
    return transformObservable(super.destory()).pipe(
      tap(() => parentField && parentField.instance?.destory.next(this.builder.id))
    );
  }
}
