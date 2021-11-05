import { Injectable, JsonConfigImplements } from 'dynamic-builder';
import { cloneDeep } from 'lodash';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { HttpClient } from '../../common/http';

declare const serverFetchData: any;
@Injectable()
export class JsonConfigService implements JsonConfigImplements {
  private cacheConfig: Map<string, Observable<object>> = new Map();

  constructor(private http: HttpClient) {
    const fetchElement = document.querySelector('#fetch-static');
    fetchElement && document.head.removeChild(fetchElement);
  }

  private get fetchStatic() {
    return typeof serverFetchData !== 'undefined' ? serverFetchData : {};
  }

  private getServerFetchData(url: string): Observable<object> {
    const fetchData = this.fetchStatic[url];
    return fetchData && fetchData.type === 'file-static' ? of(fetchData.source) : this.http.get<object>(url);
  }

  getJsonConfig(url: string): Observable<object> {
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
