import { Inject, Injectable } from '@di';
import { AbstractJsonConfig } from '@shared/providers/json-config';
import { JSON_CONFIG } from '@shared/token';
import { flatMap } from 'lodash';
import { Observable } from 'rxjs';
import { UI_ELEMENT } from '../token';

@Injectable()
export class BuilderEngine {
  private uiElement: any[];

  constructor(
    @Inject(UI_ELEMENT) uiComponents: any[][],
    @Inject(JSON_CONFIG) private JsonConfigService: AbstractJsonConfig
  ) {
    this.uiElement = flatMap(uiComponents);
  }

  public getUiComponent(name: string) {
    const [{ component } = { component: null }] = this.uiElement.filter((ui: any) => ui.name === name);
    return component;
  }

  public getJsonConfig(jsonName: string): Observable<object> {
    return this.JsonConfigService.getJsonConfig(jsonName);
  }
}
