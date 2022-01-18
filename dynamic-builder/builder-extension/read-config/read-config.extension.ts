import { JSON_CONFIG } from '@di';
import { cloneDeep, isEmpty, isFunction, isString, uniq } from 'lodash';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { BuilderField } from '../../builder';
import { ActionInterceptProps } from "../action";
import { BasicExtension } from "../basic/basic.extension";
import { LOAD_CONFIG_ACTION } from '../constant/calculator.constant';

export class ReadConfigExtension extends BasicExtension {
  protected extension(): void | Observable<any> {
    this.defineProperty(this.builder, 'id', this.props.id);
    this.builder.getExecuteHandler = this.createGetExecuteHandler();
    return this.getConfigJson(this.props).pipe(
      map((jsonConfig) => this.props.config = cloneDeep(jsonConfig))
    );
  }

  private extendsConfig(jsonConfig: any) {
    const { extends: extendsConfig } = jsonConfig;
    const extendsProps = isString(extendsConfig) ? { jsonName: extendsConfig } : extendsConfig;

    return !extendsProps || extendsProps.issLoaded ? of(jsonConfig) : this.getConfigJson(extendsProps).pipe(
      map((extendsConfig: any) => {
        extendsConfig.issLoaded = true;
        jsonConfig.extends = extendsConfig;
        return jsonConfig;
      })
    );
  }

  private preloaded(jsonConfig: any): Observable<any> {
    const builderFields = jsonConfig.fields.filter(this.eligiblePreloaded.bind(this));
    if (jsonConfig.isPreloaded || !builderFields.length) {
      return of(jsonConfig);
    }
    return forkJoin(builderFields.map(this.preloadedBuildField.bind(this))).pipe(map(() => jsonConfig));
  }

  private preloadedBuildField(jsonField: any) {
    return this.getConfigJson(jsonField).pipe(
      tap((jsonConfig) => {
        jsonConfig.isPreloaded = true;
        jsonField.config = jsonConfig;
      })
    );
  }

  private getConfigJson(props: any): Observable<any> {
    return this.getConfigObservable(props).pipe(
      switchMap((jsonConfig) => this.extendsConfig(jsonConfig)),
      tap((jsonConfig: any) => this.checkFieldRepeat(jsonConfig)),
      switchMap((jsonConfig) => this.preloaded(jsonConfig))
    );
  }

  private getConfigObservable(props: any) {
    const { id, jsonName = ``, jsonNameAction = ``, configAction = '', config } = props;
    const isJsonName = !!jsonName || !!jsonNameAction;
    const isJsConfig = !isEmpty(config) || Array.isArray(config) || !!configAction;
    let configOb;

    if (!isJsonName && !isJsConfig) {
      throw new Error(`Builder configuration is incorrect: ${id}`);
    }

    if (isJsonName) {
      const jsonConfig = this.ls.getProvider(JSON_CONFIG);
      const getJsonName = jsonNameAction ? this.createLoadConfigAction(jsonNameAction, props) : of(jsonName);
      configOb = getJsonName.pipe(switchMap((configName: string) => jsonConfig.getJsonConfig(configName)));
    } else {
      configOb = configAction ? this.createLoadConfigAction(configAction, props) : of(config);
    }

    return configOb.pipe(
      map((_config: any[] = []) => Object.assign(
        { fields: [] },
        Array.isArray(_config) ? { fields: _config } : _config,
        id ? { id: id } : {}
      )),
    );
  }

  private createLoadConfigAction(actionName: string | any, props: any) {
    const loadAction = { ...this.serializeAction(actionName), type: LOAD_CONFIG_ACTION, runObservable: true };
    const interceptProps = { builder: this.builder, id: props.id } as unknown as ActionInterceptProps;
    const actions = this.createActions([loadAction], interceptProps, { ls: this.ls });
    return actions[this.getEventType(LOAD_CONFIG_ACTION)](props);
  }

  private checkFieldRepeat(jsonConfig: { id: string, fields: BuilderField[] }) {
    const { id: jsonId, fields } = jsonConfig;
    const filedIds = uniq(fields.map(({ id }) => id) || []);
    const { instance } = this.props;
    if (filedIds.includes(jsonId)) {
      throw new Error(`The same ID as jsonID exists in the configuration file: ${jsonId}`);
    }

    if (!isEmpty(filedIds) && filedIds.length !== fields.length) {
      throw new Error(`The same ID exists in the configuration file: ${jsonId}`);
    }

    if (this.builder.parent && !instance) {
      console.warn(`Builder needs to set the instance property: ${this.builder.id}`);
    }
  }

  private eligiblePreloaded(props: any) {
    const { jsonName, jsonNameAction, configAction, preloaded = true, config } = props;
    const { isPreloaded = false } = config || {};
    return preloaded && !isPreloaded && (!!jsonName || !!configAction || !!jsonNameAction || !!config);
  }

  private createGetExecuteHandler() {
    const builder: any = this.builder;
    const getExecuteHandler = this.builder.getExecuteHandler;
    return (actionName: string) => {
      let executeHandler = builder[actionName];
      if (isFunction(getExecuteHandler)) {
        executeHandler = getExecuteHandler.call(this.builder, actionName);
      }
      executeHandler = executeHandler || builder[actionName];
      return isFunction(executeHandler) ? executeHandler.bind(builder) : undefined;
    };
  }

  protected destory() {
    this.unDefineProperty(this.builder, ['getExecuteHandler']);
    return super.destory();
  }
}
