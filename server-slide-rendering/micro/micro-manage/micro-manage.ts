import { Inject, Injectable } from '@di';
import { HISTORY_TOKEN, HttpClient } from '@university/common';
import { MicroManageInterface, MicroStoreInterface } from '@university/font-end-micro/types';
import { LocatorStorage } from '@university/provider/services';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { PROXY_MICRO_URL, REGISTRY_MICRO_MIDDER } from '../../token';

@Injectable()
export class MicroManage implements MicroManageInterface {
  constructor(
    private http: HttpClient,
    private ls: LocatorStorage,
    @Inject(REGISTRY_MICRO_MIDDER) private registryParseHtmlMidde: any
  ) { }

  bootstrapMicro(microName: string): Observable<MicroStoreInterface> {
    const proxyMicroUrl = this.ls.getProvider<any>(PROXY_MICRO_URL);
    const { location } = this.ls.getProvider(HISTORY_TOKEN);
    const subject = this.http.get(proxyMicroUrl(microName, location.pathname)).pipe(
      catchError((error) => of({ html: `${microName}<br/>${error.message}`, styles: '' })),
      map((microResult) => ({ microResult, microName })),
      shareReplay(1)
    );
    subject.subscribe(() => { }, () => { });
    this.registryParseHtmlMidde(() => subject);
    return of(null as any);
  }
}
