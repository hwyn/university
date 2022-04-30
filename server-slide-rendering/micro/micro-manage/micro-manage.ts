import { Injectable, LocatorStorage } from '@di';
import { HttpClient } from '@shared/common/http';
import { createMicroElementTemplate, MicroManageInterface, templateZip } from '@shared/micro';
import { AppContextService } from '@shared/providers/app-context';
import { HISTORY } from '@shared/token';
import { cloneDeep, isEmpty } from 'lodash';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';

import { AppContextService as ServerAppContextService } from '../../providers/app-context';

@Injectable()
export class MicroManage implements MicroManageInterface {
  private proxy: string;
  private microCache: Map<string, Observable<any>> = new Map();
  private microStaticCache: Map<string, Observable<any>> = new Map();
  private appContext: ServerAppContextService;

  constructor(private http: HttpClient, private ls: LocatorStorage) {
    this.appContext = this.ls.getProvider(AppContextService);
    this.proxy = this.appContext.getContext().proxyHost;
  }

  bootstrapMicro(microName: string): Observable<any> {
    let subject = this.microCache.get(microName) as Observable<any>;
    const context = this.appContext.getContext();
    if (!subject) {
      const proxyMicroUrl = context.microSSRPath;
      const { location: { pathname } } = this.ls.getProvider(HISTORY);
      const microPath = `/${proxyMicroUrl(microName, `/micro-ssr/${pathname}`)}`.replace(/[/]+/g, '/');
      subject = this.http.get(`${this.proxy}${microPath}`).pipe(
        catchError((error) => of({ html: `${microName}<br/>${error.message}`, styles: '' })),
        switchMap((microResult) => this.reeadLinkToStyles(microName, microResult)),
        map((microResult) => ({ microResult: this.createMicroTag(microName, microResult), microName })),
        shareReplay(1)
      );
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      subject.subscribe(() => { }, () => { });
      this.appContext.registryMicroMidder(() => subject);
      this.microCache.set(microName, subject);
    }

    return of(null);
  }

  private reeadLinkToStyles(microName: string, microResult: any) {
    const { links = [] } = microResult;
    return isEmpty(links) ? of(microResult) : forkJoin(links.map((href: string) => this.getLinkCache(`${this.proxy}${href}`))).pipe(
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
    microTags.push(
      templateZip(
        `<script id="create-${microName}-tag">{template}
          (function() {
            const script = document.getElementById('create-${microName}-tag');
            script.parentNode.removeChild(script)
          })();
        </script>`, { template }));
    return { ...microResult, html: '', links: [], styles: '', microTags };
  }
}
