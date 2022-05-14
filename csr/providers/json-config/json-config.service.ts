import { Injectable } from '@fm/di';
import { Observable } from '@fm/import-rxjs';
import { HttpClient } from '@fm/shared/common/http';
import { JsonConfigService as SharedJsonConfigService } from '@fm/shared/providers/json-config';

import { AppContextService } from '../app-context';

@Injectable()
export class JsonConfigService extends SharedJsonConfigService {
  declare appContext: AppContextService;
  private http = this.ls.getService(HttpClient);

  protected getServerFetchData(url: string): Observable<object> {
    const { publicPath = '/' } = this.appContext.getEnvironment() || {};
    return this.http.get<object>(/http|https/.test(url) ? url : `${publicPath}/${url}`.replace(/\/+/g, '/'));
  }
}
