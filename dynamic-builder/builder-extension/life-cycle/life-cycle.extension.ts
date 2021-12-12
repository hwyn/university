/* eslint-disable @typescript-eslint/no-empty-function */
import { cloneDeep, isEmpty } from 'lodash';
import { Observable, of } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';

import { BuilderProps } from '../../builder';
import { transformObservable } from '../../utility';
import { ActionInterceptProps, Calculator, createActions } from '../action';
import { BasicExtension } from '../basic/basic.extension';
import { BuilderFieldExtensions } from '../type-api';

export class LifeCycleExtension extends BasicExtension {
  protected hasChange = false;
  protected calculators: Calculator[] = [];
  protected lifeActions!: { [key: string]: (event?: Event, ...arg: any[]) => any };
  protected detectChanges: any = this.cache.detectChanges.pipe(filter(() => !this.hasChange));

  protected extension() { }

  protected afterExtension() {
    this.serializeCalculators();
    this.defineProperty(this.cache, 'originCalculators', this.calculators);
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
    this.builder.calculators = this.calculators;
  }

  protected linkCalculators() {
    this.calculators.forEach(({ dependent }) => {
      const { type, fieldId } = dependent;
      const sourceField: BuilderFieldExtensions = this.getJsonFieldById(fieldId) || this.json;
      const { actions = [], id: sourceId } = sourceField;
      const hasAction = actions.some((action) => action.type === type);

      if (fieldId !== sourceId) {
        dependent.fieldId = sourceId;
      }

      if (!hasAction) {
        sourceField.actions = [{ type }, ...actions];
      }
    });
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

  protected destory() {
    return this.invokeLifeCycle('onDestory').pipe(
      tap(() => {
        this.lifeActions = {};
        delete this.detectChanges;
        this.unDefineProperty(this.builder, ['calculators', 'onChanges']);
        this.defineProperty(this.cache, 'originCalculators', null);
      }),
      switchMap(() => transformObservable(super.destory()))
    );
  }
}
