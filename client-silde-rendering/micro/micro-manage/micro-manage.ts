import { Injectable } from '@di';
import { MicroManageInterface } from '@university/font-end-micro/types';
import { Observable } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
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
        switchMap((result: StaticAssets) => new MicroStore(microName, result).exceJavascript()),
        shareReplay(1)
      );
      this.microCache.set(microName, storeSubject);
    }

    return storeSubject;
  }
}
