import { Inject, Injectable } from '@di';
import { HttpClient } from '@university/common';
import { MicroManageInterface, MicroStoreInterface } from '@university/font-end-micro/types';
import { LocatorStorage } from '@university/provider/services';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { REGISTRY_MICRO_MIDDER, REQUEST_TOKEN } from '../../token/token';

@Injectable()
export class MicroManage implements MicroManageInterface {
  constructor(
    private http: HttpClient,
    private ls: LocatorStorage,
    @Inject(REGISTRY_MICRO_MIDDER) private registryParseHtmlMidde: any
  ) { }

  bootstrapMicro(microName: string): Observable<MicroStoreInterface> {
    const request = this.ls.getProvider<any>(REQUEST_TOKEN);
    const subject = this.http.get(`/${microName}/get-micro${request.path}`).pipe(
      map((microResult) => ({ microResult, microName })),
      shareReplay(1)
    );
    subject.subscribe(() => { }, () => { });
    this.registryParseHtmlMidde(() => subject);
    return of(null as any);
  }
}
