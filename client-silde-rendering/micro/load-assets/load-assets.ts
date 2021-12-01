import { Injectable } from '@di';
import { HttpClient } from '@shared/common/http';
import { createMicroElementTemplate } from '@shared/micro';
import { isEmpty } from 'lodash';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

export interface StaticAssets { script: string[]; javascript: string[]; links: string[]; fetchCacheData: { [url: string]: any }; }

declare const microFetchData: any[];

@Injectable()
export class LoadAssets {
  private cacheServerData = this.initialCacheServerData();
  constructor(private http: HttpClient) { }

  private initialCacheServerData(): [{ microName: string, source: string }] {
    return typeof microFetchData !== 'undefined' ? microFetchData : [] as any;
  }

  private parseStatic(microName: string, entryPoints: { [key: string]: any }): Observable<StaticAssets> {
    const entryKeys = Object.keys(entryPoints);
    const microData = this.cacheServerData.find(({ microName: _microName }) => microName === _microName);
    const fetchCacheData = JSON.parse(microData && microData.source || '{}');
    const staticAssets: StaticAssets = { javascript: [], script: [], links: [], fetchCacheData };
    entryKeys.forEach((staticKey: string) => {
      const { js: staticJs = [], css: staticLinks = [] } = entryPoints[staticKey].assets;
      staticAssets.javascript.push(...staticJs);
      staticAssets.links.push(...staticLinks);
    });
    return this.readJavascript(staticAssets);
  }

  private reeadLinkToStyles(links: string[]) {
    return isEmpty(links) ? of(links) : forkJoin(links.map((href) => this.http.getText(href)));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private readJavascript({ javascript, script, ...other }: StaticAssets) {
    return forkJoin(javascript.map((src: string) => this.http.getText(src))).pipe(
      map((js: string[]) => ({ script: js, javascript, ...other }))
    );
  }

  private createMicroTag(microName: string, staticAssets: StaticAssets) {
    const tag = document.createElement(`${microName}-tag`);

    return tag && tag.shadowRoot ? of(staticAssets) : this.reeadLinkToStyles(staticAssets.links).pipe(
      // eslint-disable-next-line no-new-func
      tap((linkToStyles: string[]) => new Function(createMicroElementTemplate(microName, { linkToStyles }))()),
      map(() => staticAssets)
    );
  }

  public readMicroStatic(microName: string): Observable<any> {
    return this.http.get(`/static/${microName}/static/assets.json`).pipe(
      switchMap((result: any) => this.parseStatic(microName, result.entrypoints)),
      switchMap((result: StaticAssets) => this.createMicroTag(microName, result))
    );
  }
}
