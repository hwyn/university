import { Injectable } from '@di';
import { MicroManageInterface } from '@university/font-end-micro/types';
import { createMicroElementTemplate } from '@university/font-end-micro/utils';
import { Observable, of } from 'rxjs';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { LoadAssets, StaticAssets } from '../load-assets/load-assets';
import { MicroStore } from '../micro-store/micro-store';

@Injectable()
export class MicroManage implements MicroManageInterface {
  private microCache: Map<string, Observable<MicroStore>> = new Map();
  constructor(private la: LoadAssets) { }

  public bootstrapMicro(microName: string): Observable<MicroStore> {
    let storeSubject = this.microCache.get(microName);
    if (!storeSubject) {
      storeSubject = this.la.readMicroStatic(microName).pipe(
        switchMap((result: StaticAssets) => this.createMicroTag(microName, result)),
        switchMap((result: StaticAssets) => new MicroStore(microName, result).exceJavascript()),
        shareReplay(1)
      );
      this.microCache.set(microName, storeSubject);
    }

    return storeSubject;
  }

  private createMicroTag(microName: string, result: StaticAssets) {
    const tag = document.createElement(`${microName}-tag`);
    if (tag && tag.shadowRoot) {
      return of(result);
    }
    return this.la.reeadLinkToStyles(result.links).pipe(
      tap((linkToStyles: string[]) => {
        const template = createMicroElementTemplate(microName, { linkToStyles });
        // tslint:disable-next-line:function-constructor
        new Function(template)();
      }),
      map(() => result)
    );
  }
}
