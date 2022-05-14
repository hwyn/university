import { Inject, LocatorStorage } from '@fm/di';
import { map, Observable, shareReplay } from '@fm/import-rxjs';
import { cloneDeep } from 'lodash';

import { AppContextService } from '../app-context';

export abstract class JsonConfigService {
  protected appContext: AppContextService;
  protected cacheConfig: Map<string, Observable<object>>;
  protected abstract getServerFetchData(url: string): Observable<object>;

  constructor(@Inject(LocatorStorage) protected ls: LocatorStorage) { 
    this.appContext = this.ls.getProvider(AppContextService);
    this.cacheConfig = this.appContext.getResourceCache('file-static');
  }


  public getJsonConfig(url: string): Observable<object> {
    let subject = this.cacheConfig.get(url);
    if (!subject) {
      subject = this.getServerFetchData(url).pipe(shareReplay(1), map(cloneDeep));
      this.cacheConfig.set(url, subject);
    }
    return subject;
  }
}
