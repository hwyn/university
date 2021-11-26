import { JsonConfigImplements, LocatorStorageImplements } from '@di';
import { cloneDeep } from 'lodash';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

export abstract class AbstractJsonConfigService implements JsonConfigImplements {
  protected cacheConfig: Map<string, Observable<object>> = new Map();

  constructor(protected ls: LocatorStorageImplements) { }

  protected abstract getServerFetchData(url: string): Observable<object>;

  public getJsonConfig(url: string): Observable<object> {
    let subject = this.cacheConfig.get(url);
    if (!subject) {
      subject = this.getServerFetchData(url).pipe(shareReplay(1), map(cloneDeep));
      this.cacheConfig.set(url, subject);
    }
    return subject;
  }
}
