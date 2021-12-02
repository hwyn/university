import { Injectable } from '@di';
import { MicroManageInterface } from '@shared/micro';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { LoadAssets, StaticAssets } from '../load-assets/load-assets';
import { MicroStore } from '../micro-store/micro-store';

@Injectable()
export class MicroManage implements MicroManageInterface {
  public loaderStyleSubject = new Subject<HTMLStyleElement>();
  private microCache: Map<string, Observable<MicroStore>> = new Map();

  constructor(private la: LoadAssets) {
    document.querySelector = this.querySelectorProxy();
  }

  public bootstrapMicro(microName: string): Observable<MicroStore> {
    let storeSubject = this.microCache.get(microName);
    if (!storeSubject) {
      storeSubject = this.la.readMicroStatic(microName).pipe(
        map((result: StaticAssets) => new MicroStore(microName, result, this)),
        shareReplay(1)
      );
      this.microCache.set(microName, storeSubject);
    }

    return storeSubject;
  }

  private querySelectorProxy() {
    const loaderStyleHead = document.createElement('head');
    const _querySelector = document.querySelector.bind(document);
    Object.defineProperty(loaderStyleHead, 'appendChild', { value: this.loaderStyleSubject.next.bind(this.loaderStyleSubject) });
    return (selectors: string) => /^styleLoaderInsert:[^:]+::shadow$/g.test(selectors) ? loaderStyleHead : _querySelector(selectors);
  }
}
