import { Inject, Injectable, LOCAL_STORAGE, LocatorStorageImplements } from '@di';
import { HttpClient } from '@university/common';
import { AbstractJsonConfigService } from '@university/provider/services';
import { Observable, of } from 'rxjs';
import { RESOURCE_TOKEN } from '../../token';

@Injectable()
export class JsonConfigService extends AbstractJsonConfigService {
  protected cacheConfig: Map<string, Observable<object>> = new Map();
  protected http: HttpClient = this.ls.getProvider(HttpClient);

  constructor(@Inject(LOCAL_STORAGE) protected ls: LocatorStorageImplements) {
    super(ls);
  }

  protected getServerFetchData(url: string): Observable<object> {
    return this.http.get<object>(url);
  }
}
