import { Injectable } from '@di';

type Render = (...args: any[]) => Promise<(continer: HTMLElement) => void>;

declare const common: any;

@Injectable()
export class Platform {
  bootstrapRender(render: Render) {
    typeof common !== 'undefined' ? common.render = render : render();
  }
}
