import { Injectable } from '@di';
import { AppContextService, Fetch } from '@shared/providers/app-context';
import { from, Observable } from 'rxjs';

function factoryRequest<T>(fetch: Fetch, method: string, parseData: (res: Response) => Promise<T>) {
  return (url: string | RequestInfo, params?: RequestInit): Observable<T> => from(fetch(url, { method, ...params }).then(parseData));
}

@Injectable()
export class HttpClient {
  private fetch: Fetch;
  constructor(private appContext: AppContextService) {
    this.fetch = this.appContext.fetch;
  }

  public get<T = any>(req: RequestInfo | string, params?: RequestInit): Observable<T> {
    return factoryRequest<T>(this.fetch, 'get', (res: Response) => res.json())(req, params);
  }

  public getText(req: RequestInfo | string, params?: RequestInit): Observable<string> {
    return factoryRequest<string>(this.fetch, 'get', (res: Response) => res.text())(req, params);
  }
}
