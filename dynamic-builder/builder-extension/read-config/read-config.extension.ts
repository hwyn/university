import { JSON_CONFIG } from "@di";
import { BuilderField } from "dynamic-builder";
import { cloneDeep, isEmpty, isString, uniq } from "lodash";
import { forkJoin, Observable, of } from "rxjs";
import { map, switchMap, tap } from "rxjs/operators";

import { Action, ActionInterceptProps } from "../action";
import { BasicExtension } from "../basic/basic.extension";

export class ReadConfigExtension extends BasicExtension {
  protected loadConfigType = 'loadConfigAction';
  protected extension(): void | Observable<any> {
    this.defineProperty(this.builder, 'id', this.props.id);
    this.builder.getExecuteHandler = this.createGetExecuteHandler();
    return this.getConfigJson(this.props).pipe(
      switchMap((jsonConfig: any) => this.extendsConfig(jsonConfig)),
      switchMap((json) => {
        json.id = this.props.id;
        this.props.config = json;
        this.checkFieldRepeat(json);
        return this.preloaded(json);
      })
    );
  }

  private extendsConfig(jsonConfig: any) {
    const { extends: extendsConfig } = jsonConfig;
    const extendsProps = isString(extendsConfig) ? { jsonName: extendsConfig } : extendsConfig;

    return !extendsProps ? of(jsonConfig) : this.getConfigJson(extendsProps).pipe(
      map((extendsConfig: any) => {
        jsonConfig.extends = extendsConfig;
        return jsonConfig;
      })
    );
  }

  private preloaded(json: any) {
    const builderFields = json.fields.filter(this.eligiblePreloaded.bind(this));
    return isEmpty(builderFields) ?
      of(json) :
      forkJoin(builderFields.map((jsonField: any) => this.preloadedBuildField(jsonField))).pipe(map(() => json));
  }

  private preloadedBuildField(jsonField: any) {
    return this.getConfigJson(jsonField).pipe(
      switchMap((jsonConfig) => this.preloaded(jsonConfig)),
      tap((jsonConfig) => {
        jsonConfig.preloaded = true;
        jsonField.config = jsonConfig;
        delete jsonField.jsonName;
      })
    );
  }

  // eslint-disable-next-line complexity
  private getConfigJson(props: any): Observable<any> {
    const { id, jsonName = ``, jsonNameAction = ``, config, configAction = '' } = props;
    const isJsonName = !!jsonName || !!jsonNameAction;
    const isJsConfig = !isEmpty(config) || Array.isArray(config) || !!configAction;
    let configObs;

    if (!isJsonName && !isJsConfig) {
      throw new Error(`Builder configuration is incorrect: ${id}`);
    }

    if (isJsonName) {
      const getJsonName = jsonNameAction ? this.createLoadConfigAction(jsonNameAction) : of(jsonName);
      configObs = getJsonName.pipe(switchMap((configName: string) => this.ls.getProvider(JSON_CONFIG).getJsonConfig(configName)));
    } else {
      configObs = configAction ? this.createLoadConfigAction(configAction) : of(config);
    }

    return configObs.pipe(map((_config: any[] = []) => cloneDeep({
      ...id ? { id } : {},
      ...{ fields: [] },
      ...(Array.isArray(_config) ? { fields: _config } : _config)
    })));
  }

  private createLoadConfigAction(actionName: string | any) {
    const configAction: Action = typeof actionName === 'function' ?
      { handler: actionName } : typeof actionName === 'string' ?
        this.serializeAction(actionName) : actionName;
    const props = { builder: this.builder, id: this.builder.id } as unknown as ActionInterceptProps;
    const actions = this.createActions([{ ...configAction, type: this.loadConfigType, runObservable: true }], props, { ls: this.ls });
    return actions[this.getEventType(this.loadConfigType)](this.props as any);
  }

  private checkFieldRepeat(jsonConfig: { id: string, fields: BuilderField[] }) {
    const { id: jsonId, fields } = jsonConfig;
    const filedIds = uniq(fields.map(({ id }) => id) || []);
    const { instance } = this.props;
    if (filedIds.includes(<string>jsonId)) {
      throw new Error(`The same ID as jsonID exists in the configuration file: ${jsonId}`);
    }

    if (!isEmpty(filedIds) && filedIds.length !== fields.length) {
      throw new Error(`The same ID exists in the configuration file: ${jsonId}`);
    }

    if (this.builder.parent && !instance) {
      console.warn(`Builder needs to set the instance property: ${this.builder.id}`);
    }
  }

  private eligiblePreloaded({ jsonName, config }: any) {
    return !!jsonName || (!isEmpty(config) && !config.preloaded);
  }

  private createGetExecuteHandler() {
    const builder: any = this.builder;
    const getExecuteHandler = this.builder.getExecuteHandler;
    return (actionName: string) => {
      let executeHandler = builder[actionName];
      if (typeof getExecuteHandler === 'function') {
        executeHandler = getExecuteHandler.call(this.builder, actionName);
      }
      executeHandler = executeHandler || builder[actionName];
      return typeof executeHandler === 'function' ? executeHandler.bind(builder) : undefined;
    };
  }

  protected destory() {
    this.unDefineProperty(this.builder, ['getExecuteHandler']);
    return super.destory();
  }
}
