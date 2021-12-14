/* eslint-disable @typescript-eslint/no-empty-function */
import { cloneDeep, flatMap, isEmpty } from 'lodash';
import { Observable, of } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';

import { BuilderProps } from '../../builder';
import { transformObservable } from '../../utility';
import { ActionInterceptProps, createActions } from '../action';
import { BasicExtension } from '../basic/basic.extension';
import { BuilderFieldExtensions, BuilderModelExtensions, OriginCalculators } from '../type-api';

export class LifeCycleExtension extends BasicExtension {
  protected hasChange = false;
  protected calculators: OriginCalculators[] = [];
  protected nonSelfCalculators: OriginCalculators[] = [];
  protected lifeActions!: { [key: string]: (event?: Event, ...arg: any[]) => any };
  protected detectChanges: any = this.cache.detectChanges.pipe(filter(() => !this.hasChange));

  protected extension() {
    const nonSelfBuilder = this.builder.root.$$cache.nonSelfBuilder;
    this.defineProperty(this.cache, 'nonSelfBuilder', nonSelfBuilder || []);
  }

  protected afterExtension() {
    this.serializeCalculators();
    return this.createLife();
  }

  protected createLife(): Observable<any> {
    const { actions = [] } = this.json;
    const props = { builder: this.builder, id: this.builder.id } as unknown as ActionInterceptProps;
    this.lifeActions = createActions(actions, props, { runObservable: true, ls: this.ls });
    this.defineProperty(this.builder, 'onChanges', this.onLifeChange.bind(this));
    return this.invokeLifeCycle('onLoad', this.props);
  }

  protected onLifeChange(props: BuilderProps) {
    this.hasChange = true;
    this.invokeLifeCycle('onChange', props).subscribe();
    this.hasChange = false;
  }

  protected invokeLifeCycle(type: string, event?: any): Observable<any> {
    const lifeActions = this.lifeActions;
    return lifeActions[type] ? lifeActions[type](event) : of(event);
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
    const { actions = [], id: sourceId } = sourceField;
    const nonSource = fieldId !== sourceId;
    const nonAction = !actions.some((action) => action.type === type);
    if (nonSource && !nonSelfCalculator) {
      this.nonSelfCalculators.push(calculator);
    }
    if (!nonSource && nonAction) {
      sourceField.actions = [{ type }, ...actions];
    }
  }

  private createCalculators() {
    const fields = [...this.jsonFields, this.json];
    const fieldsCalculators = cloneDeep(fields).filter(({ calculators }) => !isEmpty(calculators));
    this.calculators = [];
    fieldsCalculators.forEach(({ id: targetId, calculators = [] }) => {
      this.toArray(calculators).forEach(({ action, dependents }) => {
        this.toArray(dependents).forEach((dependent: any) => {
          this.calculators.push({ targetId, action: this.serializeAction(action), dependent });
        });
      });
    });
  }

  private getNonSelfCalculators(): OriginCalculators[] {
    return flatMap(this.nonSelfBuilder.map((nonSelf: BuilderModelExtensions) => nonSelf.nonSelfCalculators));
  }

  get nonSelfBuilder() {
    return this.cache.nonSelfBuilder;
  }

  private bindCalculator() {
    this.builder.calculators = this.calculators;
    this.builder.nonSelfCalculators = this.nonSelfCalculators;
    this.defineProperty(this.cache, 'originCalculators', this.calculators);
    this.defineProperty(this.cache, 'originNonSelfCalculators', this.nonSelfCalculators);
    if (this.nonSelfCalculators.length) {
      this.nonSelfBuilder.push(this.builder);
    }
  }

  protected destory() {
    return this.invokeLifeCycle('onDestory').pipe(
      tap(() => {
        this.lifeActions = {};
        delete this.detectChanges;
        this.nonSelfBuilder.splice(this.nonSelfBuilder.indexOf(this.builder), 1);
        this.unDefineProperty(this.builder, ['calculators', 'nonSelfCalculators', 'onChanges']);
        this.unDefineProperty(this.cache, ['originCalculators', 'originNonSelfCalculators', 'nonSelfBuilder']);
      }),
      switchMap(() => transformObservable(super.destory()))
    );
  }
}
