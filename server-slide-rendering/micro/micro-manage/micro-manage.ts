import { Inject, Injectable } from '@di';
import { MicroManageInterface, MicroStoreInterface } from '@font-end-micro/types';
import { createMicroElementTemplate } from '@font-end-micro/utils';
import { HISTORY_TOKEN, HttpClient } from '@university/common';
import { LocatorStorage } from '@university/provider/services';
import { isEmpty } from 'lodash';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { PROXY_HOST, REGISTRY_MICRO_MIDDER, SSR_MICRO_PATH } from '../../token';

@Injectable()
export class MicroManage implements MicroManageInterface {
  constructor(
    private http: HttpClient,
    private ls: LocatorStorage,
    @Inject(REGISTRY_MICRO_MIDDER) private registryParseHtmlMidde: any
  ) { }

  bootstrapMicro(microName: string): Observable<MicroStoreInterface> {
    const proxyMicroUrl = this.ls.getProvider<any>(SSR_MICRO_PATH);
    const { location: { pathname } } = this.ls.getProvider(HISTORY_TOKEN);
    const microPath = `/micro-ssr/${pathname}`.replace(/[\/]+/, '/');
    const subject = this.http.get(proxyMicroUrl(microName, microPath)).pipe(
      catchError((error) => of({ html: `${microName}<br/>${error.message}`, styles: '' })),
      switchMap((microResult) => this.reeadLinkToStyles(microName, microResult)),
      map((microResult) => ({ microResult: this.createMicroTag(microName, microResult), microName })),
      shareReplay(1)
    );
    subject.subscribe(() => { }, () => { });
    this.registryParseHtmlMidde(() => subject);
    return of(null as any);
  }

  private reeadLinkToStyles(microName: string, microResult: any) {
    const { links = [] } = microResult;
    const proxy = this.ls.getProvider(PROXY_HOST);
    return isEmpty(links) ? of(microResult) : forkJoin(links.map((href: string) => this.http.getText(`${proxy}${href}`))).pipe(
      map((styles) => ({ ...microResult, linkToStyles: styles }))
    );
  }

  private createMicroTag(microName: string, microResult: any) {
    const { html, styles, linkToStyles, microTags = [] } = microResult;
    const template = createMicroElementTemplate(microName, { initHtml: html, initStyle: styles, linkToStyles });
    microTags.push(`<script id="create-${microName}-tag">${template}
        (function() {
          const script = document.getElementById('create-${microName}-tag');
          script.parentNode.removeChild(script)
        })();
      </script>
    `);
    return { ...microResult, html: '', links: [], styles: '', microTags };
  }
}
