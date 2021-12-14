import { Inject, Injectable } from '@di';
import { flatMap } from 'lodash';

import { UI_ELEMENT } from '../token';

@Injectable()
export class BuilderEngine {
  private uiElement: any[];

  constructor(@Inject(UI_ELEMENT) uiComponents: any[][]) {
    this.uiElement = flatMap(uiComponents);
  }

  public getUiComponent(name: string) {
    const [{ component } = { component: null }] = this.uiElement.filter((ui: any) => ui.name === name);
    return component;
  }
}
