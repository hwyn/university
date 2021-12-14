import { cloneDeep, isEmpty, uniq } from "lodash";
import { Observable, of } from "rxjs";
import { map, switchMap, tap } from "rxjs/operators";

import { BuilderEngine } from "../../builder/builder-engine.service";
import { BuilderField } from "../../builder/type-api";
import { ActionInterceptProps, createActions, getEventType } from "../action";
import { BasicExtension } from "../basic/basic.extension";

export class ReadConfigExtension extends BasicExtension {
  protected loadConfigType = 'loadConfigAction';
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected extension(): void | Observable<any> { 
    this.defineProperty(this.builder, 'id', this.props.id);
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

    if (isJsonName) {
      const getJsonName = jsonNameAction ? this.createLoadConfigAction(jsonNameAction) : of(jsonName);
      return getJsonName.pipe(switchMap((configName: string) => this.ls.getProvider(BuilderEngine).getJsonConfig(configName)));
    } else {
      const getConfig = configAction ? this.createLoadConfigAction(configAction) : of(config);
      return getConfig.pipe(map((_config: any[] = []) => (cloneDeep({ id, ...(Array.isArray(_config) ? { fields: _config } : _config) }))));
    }
  }

  private createLoadConfigAction(actionName: string) {
    const props = { builder: this.builder, id: this.builder.id } as unknown as ActionInterceptProps;
    const actions = createActions([{ type: this.loadConfigType, name: actionName }], props, { runObservable: true, ls: this.ls });
    return actions[getEventType(this.loadConfigType)](this.props as any);
  }

  private checkFieldRepeat(fields: BuilderField[], jsonName: string | undefined) {
    const filedIds = uniq(fields.map(({ id }) => id));
    if (filedIds.includes(<string>jsonName)) {
      throw new Error(`The same ID as jsonID exists in the configuration file: ${jsonName}`);
    }

    if (filedIds.length !== fields.length) {
      throw new Error(`The same ID exists in the configuration file: ${jsonName}`);
    }
  }
}
