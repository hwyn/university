import { Inject, Injectable } from '@di';
import { MicroManageInterface, MicroStoreInterface } from '@font-end-micro/types';
import { createMicroElementTemplate, templateZip } from '@font-end-micro/utils';
import { HttpClient } from '@university/common/http';
import { HISTORY_TOKEN } from '@university/common/token';
import { LocatorStorage } from '@university/provider/services';
import { cloneDeep, isEmpty } from 'lodash';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { PROXY_HOST, REGISTRY_MICRO_MIDDER, SSR_MICRO_PATH } from '../../token';

@Injectable()
export class MicroManage implements MicroManageInterface {
  private microCache: Map<string, Observable<any>> = new Map();
  private microStaticCache: Map<string, Observable<any>> = new Map();

  constructor(
    private http: HttpClient,
    private ls: LocatorStorage,
    @Inject(REGISTRY_MICRO_MIDDER) private registryParseHtmlMidde: any
  ) { }

  bootstrapMicro(microName: string): Observable<MicroStoreInterface> {
    let subject = this.microCache.get(microName);
    if (!subject) {
      const proxyMicroUrl = this.ls.getProvider<any>(SSR_MICRO_PATH);
      const { location: { pathname } } = this.ls.getProvider(HISTORY_TOKEN);
      const microPath = `/micro-ssr/${pathname}`.replace(/[\/]+/g, '/');
      subject = this.http.get(proxyMicroUrl(microName, microPath)).pipe(
        catchError((error) => of({ html: `${microName}<br/>${error.message}`, styles: '' })),
        switchMap((microResult) => this.reeadLinkToStyles(microName, microResult)),
        map((microResult) => ({ microResult: this.createMicroTag(microName, microResult), microName })),
        shareReplay(1)
      );
      subject.subscribe(() => { }, () => { });
      this.registryParseHtmlMidde(() => subject);
      this.microCache.set(microName, subject);
    }

    return of(null as any);
  }

  private reeadLinkToStyles(microName: string, microResult: any) {
    const { links = [] } = microResult;
    const proxy = this.ls.getProvider(PROXY_HOST);
    return isEmpty(links) ? of(microResult) : forkJoin(links.map((href: string) => this.getLinkCache(`${proxy}${href}`))).pipe(
      map((styles) => ({ ...microResult, linkToStyles: styles }))
    );
  }

  private getLinkCache(href: string) {
    let linkSubject = this.microStaticCache.get(href);
    if (!linkSubject) {
      linkSubject = this.http.getText(href).pipe(shareReplay(1), map(cloneDeep));
      this.microStaticCache.set(href, linkSubject);
    }
    return linkSubject;
  }

  private createMicroTag(microName: string, microResult: any) {
    const { html, styles, linkToStyles, microTags = [] } = microResult;
    const template = createMicroElementTemplate(microName, { initHtml: html, initStyle: styles, linkToStyles });
    microTags.push(templateZip(`<script id="create-${microName}-tag">{template}
        (function() {
          const script = document.getElementById('create-${microName}-tag');
          script.parentNode.removeChild(script)
        })();
      </script>
    `, { template }));
    return { ...microResult, html: '', links: [], styles: '', microTags };
  }
}
