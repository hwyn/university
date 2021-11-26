import { RESOURCE_TOKEN } from '@client-silde-rendering/token';
import { Inject, Injectable, LOCAL_STORAGE, LocatorStorageImplements } from '@di';
import { HttpClient } from '@university/common/http';
import { ENVIRONMENT } from '@university/common/token';
import { AbstractJsonConfigService } from '@university/provider/services/json-config';
import { Observable } from 'rxjs';

@Injectable()
export class JsonConfigService extends AbstractJsonConfigService {
  protected http: HttpClient = this.ls.getProvider(HttpClient);
  protected environment = this.ls.getProvider(ENVIRONMENT);
  protected cacheConfig = this.ls.getProvider(RESOURCE_TOKEN);

  constructor(@Inject(LOCAL_STORAGE) protected ls: LocatorStorageImplements) {
    super(ls);
  }

  protected getServerFetchData(url: string): Observable<object> {
    const { publicPath = '/' } = this.environment;
    return this.http.get<object>(`${publicPath}/${url}`.replace(/\/+/g, '/'));
  }
}
