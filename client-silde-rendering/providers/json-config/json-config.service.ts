import { RESOURCE } from '@client-silde-rendering/token';
import { Inject, Injectable, LocatorStorage } from '@di';
import { HttpClient } from '@shared/common/http';
import { AbstractJsonConfigService } from '@shared/providers/json-config';
import { ENVIRONMENT } from '@shared/token';
import { Observable } from 'rxjs';

@Injectable()
export class JsonConfigService extends AbstractJsonConfigService {
  constructor(
    protected http: HttpClient,
    protected ls: LocatorStorage,
    @Inject(ENVIRONMENT) protected environment: { [key: string]: any }
  ) {
    super(ls);
    this.cacheConfig = this.ls.getProvider(RESOURCE, 'file-static');
  }

  protected getServerFetchData(url: string): Observable<object> {
    const { publicPath = '/' } = this.environment || {};
    return this.http.get<object>(/http|https/.test(url) ? url : `${publicPath}/${url}`.replace(/\/+/g, '/'));
  }
}
