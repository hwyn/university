import { RESOURCE_TOKEN } from '@client-silde-rendering/token';
import { Inject, Injectable, LocatorStorage } from '@di';
import { HttpClient } from '@shared/common/http';
import { AbstractJsonConfigService } from '@shared/services/json-config';
import { ENVIRONMENT } from '@shared/token';
import { Observable } from 'rxjs';

@Injectable()
export class JsonConfigService extends AbstractJsonConfigService {
  constructor(
    protected ls: LocatorStorage,
    @Inject(ENVIRONMENT) protected environment: { [key: string]: any },
    @Inject(RESOURCE_TOKEN) protected cacheConfig: Map<string, Observable<object>> = new Map(),
    protected http: HttpClient,
  ) {
    super(ls);
  }

  protected getServerFetchData(url: string): Observable<object> {
    const { publicPath = '/' } = this.environment;
    return this.http.get<object>(`${publicPath}/${url}`.replace(/\/+/g, '/'));
  }
}
