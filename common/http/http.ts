import { getProvider, Inject, Injectable } from '@di';
import { Observable, Subject } from 'rxjs';
import { FETCH_TOKEN } from '../token';

type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

function factoryRequest<T>(method: string, parseData: (res: Response) => Promise<T>) {
  return (url: string, params?: RequestInit): Observable<T> => {
    const fetch = getProvider<Fetch>(FETCH_TOKEN);
    const subject = new Subject<T>();
    fetch(url, { method, ...params })
      .then(parseData)
      .then(data => subject.next(data))
      .catch((error) => subject.error(error))
      .finally(() => subject.complete());
    return subject;
  };
}

@Injectable()
export class HttpClient {
  constructor() { }

  public get<T = any>(req: RequestInfo, params?: RequestInit): Observable<T>;
  public get<T = any>(url: string, params?: RequestInit): Observable<T> {
    return factoryRequest<T>('get', (res: Response) => res.json())(url, params);
  }

  public getText(req: RequestInfo, params?: RequestInit): Observable<string>;
  public getText(url: string, params?: RequestInit): Observable<string> {
    return factoryRequest<string>('get', (res: Response) => res.text())(url, params);
  }
}
