import { Inject, Injectable } from '@di';
import { from, Observable } from 'rxjs';

import { FETCH } from '../../token';

type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

function factoryRequest<T>(fetch: Fetch, method: string, parseData: (res: Response) => Promise<T>) {
  return (url: string | RequestInfo, params?: RequestInit): Observable<T> => from(fetch(url, { method, ...params }).then(parseData));
}

@Injectable()
export class HttpClient {
  constructor(@Inject(FETCH) private fetch: Fetch) { }

  public get<T = any>(req: RequestInfo | string, params?: RequestInit): Observable<T> {
    return factoryRequest<T>(this.fetch, 'get', (res: Response) => res.json())(req, params);
  }

  public getText(req: RequestInfo | string, params?: RequestInit): Observable<string> {
    return factoryRequest<string>(this.fetch, 'get', (res: Response) => res.text())(req, params);
  }
}
