import { JSON_CONFIG } from "@di";
import { cloneDeep, isEmpty, uniq } from "lodash";
import { Observable, of } from "rxjs";
import { map, switchMap, tap } from "rxjs/operators";

import { BuilderField } from "../../builder/type-api";
import { ActionInterceptProps } from "../action";
import { BasicExtension } from "../basic/basic.extension";

export class ReadConfigExtension extends BasicExtension {
  protected loadConfigType = 'loadConfigAction';
  protected extension(): void | Observable<any> {
    this.defineProperty(this.builder, 'id', this.props.id);
    this.builder.getExecuteHandler = this.createGetExecuteHandler();
    return this.getConfigJson().pipe(
      tap((json) => {
        json.id = this.props.id;
        this.props.config = json;
        this.checkFieldRepeat(json.fields, json.id);
      })
    );
  }

  private getConfigJson(): Observable<any> {
    const { id, jsonName = ``, jsonNameAction = ``, config, configAction = '' } = this.props;
    const isJsonName = !!jsonName || !!jsonNameAction;
    const isJsConfig = !isEmpty(config) || Array.isArray(config) || !!configAction;
    if (!isJsonName && !isJsConfig) {
      throw new Error(`Builder configuration is incorrect: ${id}`);
    }
    let configObs;
    if (isJsonName) {
      const getJsonName = jsonNameAction ? this.createLoadConfigAction(jsonNameAction) : of(jsonName);
      configObs = getJsonName.pipe(switchMap((configName: string) => this.ls.getProvider(JSON_CONFIG).getJsonConfig(configName)));
    } else {
      configObs = configAction ? this.createLoadConfigAction(configAction) : of(config);
    }

    return configObs.pipe(map((_config: any[] = []) => cloneDeep({
      ...{ id, fields: [] },
      ...(Array.isArray(_config) ? { fields: _config } : _config)
    })));
  }

  private createLoadConfigAction(actionName: string) {
    const props = { builder: this.builder, id: this.builder.id } as unknown as ActionInterceptProps;
    const actions = this.createActions([{ type: this.loadConfigType, name: actionName, runObservable: true }], props, { ls: this.ls });
    return actions[this.getEventType(this.loadConfigType)](this.props as any);
  }

  private checkFieldRepeat(fields: BuilderField[], jsonId: string | undefined) {
    const filedIds = uniq(fields.map(({ id }) => id) || []);
    if (filedIds.includes(<string>jsonId)) {
      throw new Error(`The same ID as jsonID exists in the configuration file: ${jsonId}`);
    }

    if (!isEmpty(filedIds) && filedIds.length !== fields.length) {
      throw new Error(`The same ID exists in the configuration file: ${jsonId}`);
    }
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
