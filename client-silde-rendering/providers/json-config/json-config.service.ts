import { RESOURCE } from '@client-silde-rendering/token';
import { Injectable, LocatorStorage } from '@di';
import { HttpClient } from '@shared/common/http';
import { AppContextService } from '@shared/providers/app-context';
import { JsonConfigService as SharedJsonConfigService } from '@shared/providers/json-config';
import { Observable } from 'rxjs';

@Injectable()
export class JsonConfigService extends SharedJsonConfigService {
  constructor(
    protected http: HttpClient,
    protected ls: LocatorStorage,
    protected appConfig: AppContextService,
  ) {
    super(ls);
    this.cacheConfig = this.ls.getProvider(RESOURCE, 'file-static');
  }

  protected getServerFetchData(url: string): Observable<object> {
    const { publicPath = '/' } = this.appConfig.getEnvironment() || {};
    return this.http.get<object>(/http|https/.test(url) ? url : `${publicPath}/${url}`.replace(/\/+/g, '/'));
  }
}
