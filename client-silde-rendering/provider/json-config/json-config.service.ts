import { Inject, Injectable, JsonConfigImplements } from '@di';
import { HttpClient } from '@university/common';
import { cloneDeep } from 'lodash';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { RESOURCE_TOKEN } from '../../token';

@Injectable()
export class JsonConfigService implements JsonConfigImplements {
  protected cacheConfig: Map<string, Observable<object>> = new Map();

  constructor(@Inject(RESOURCE_TOKEN) private fetchStatic: any, protected http: HttpClient) {
    const fetchElement = document.querySelector('#fetch-static');
    if (fetchElement) {
      document.head.removeChild(fetchElement);
    }
  }

  protected getServerFetchData(url: string): Observable<object> {
    const fetchData = this.fetchStatic[url];
    return fetchData && fetchData.type === 'file-static' ? of(fetchData.source) : this.http.get<object>(url);
  }

  public getJsonConfig(url: string): Observable<object> {
    let subject = this.cacheConfig.get(url);
    if (!subject) {
      subject = this.getServerFetchData(url).pipe(
        shareReplay(1),
        map((json) => cloneDeep(json))
      );
      this.cacheConfig.set(url, subject);
    }
    return subject;
  }
}
