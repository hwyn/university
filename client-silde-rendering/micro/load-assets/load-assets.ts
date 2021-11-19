import { Injectable } from '@di';
import { createMicroElementTemplate } from '@font-end-micro/utils';
import { HttpClient } from '@university/common';
import { isEmpty } from 'lodash';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

export interface StaticAssets { javascript: string[]; links: string[]; fetchCacheData: { [url: string]: any }; }

declare const microFetchData: any[];

@Injectable()
export class LoadAssets {
  private cacheServerData: [{ microName: string, source: string }];
  constructor(private http: HttpClient) {
    this.cacheServerData = this.initialCacheServerData();
  }

  private initialCacheServerData(): any {
    return typeof microFetchData !== 'undefined' ? microFetchData : [];
  }

  private parseStatic(microName: string, entryPoints: { [key: string]: any }): StaticAssets {
    const entryKeys = Object.keys(entryPoints);
    const microData = this.cacheServerData.find(({ microName: _microName }) => microName === _microName);
    const fetchCacheData = microData ? JSON.parse(microData.source) : {};
    const staticAssets: StaticAssets = { javascript: [], links: [], fetchCacheData };
    entryKeys.forEach((staticKey: string) => {
      const { js: staticJs = [], css: staticLinks = [] } = entryPoints[staticKey].assets;
      staticAssets.javascript.push(...staticJs);
      staticAssets.links.push(...staticLinks);
    });
    return staticAssets;
  }

  private createMicroTag(microName: string, staticAssets: StaticAssets) {
    const tag = document.createElement(`${microName}-tag`);
    if (tag && tag.shadowRoot) {
      return of(staticAssets);
    }

    return this.reeadLinkToStyles(staticAssets.links).pipe(
      tap((linkToStyles: string[]) => {
        // tslint:disable-next-line:function-constructor
        new Function(createMicroElementTemplate(microName, { linkToStyles }))();
      }),
      map(() => staticAssets)
    );
  }

  public readMicroStatic(microName: string): Observable<any> {
    return this.http.get(`/static/${microName}/static/assets.json`).pipe(
      map((result: any) => this.parseStatic(microName, result.entrypoints)),
      switchMap((result: StaticAssets) => this.createMicroTag(microName, result))
    );
  }

  public reeadLinkToStyles(links: string[]) {
    return isEmpty(links) ? of(links) : forkJoin(links.map((href) => this.http.getText(href)));
  }
}
