import { Injectable, LocatorStorage } from '@di';
import { HttpClient } from '@shared/common/http';
import { JsonConfigService as SharedJsonConfigService } from '@shared/providers/json-config';
import { Observable } from 'rxjs';

import { AppContextService } from '../app-context';

@Injectable()
export class JsonConfigService extends SharedJsonConfigService {
  declare appContext: AppContextService;

  constructor(protected http: HttpClient, protected ls: LocatorStorage) {
    super(ls);
  }

  protected getServerFetchData(url: string): Observable<object> {
    const { publicPath = '/' } = this.appContext.getEnvironment() || {};
    return this.http.get<object>(/http|https/.test(url) ? url : `${publicPath}/${url}`.replace(/\/+/g, '/'));
  }
}
