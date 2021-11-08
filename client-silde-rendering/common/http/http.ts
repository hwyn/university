import { Injectable } from '@di';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class HttpClient {
  constructor() { }

  get<T = any>(req: RequestInfo, params?: RequestInit): Observable<T>;
  get<T = any>(url: string, params?: RequestInit): Observable<T> {
    const subject = new Subject<T>();
    fetch(url, params)
      .then(res => res.json())
      .then(data => subject.next(data))
      .catch((error) => subject.error(error))
      .finally(() => subject.complete());
    return subject;
  }

  getText(req: RequestInfo, params?: RequestInit): Observable<string>;
  getText(url: string, params?: RequestInit): Observable<string> {
    const subject = new Subject<string>();
    fetch(url, params)
      .then(res => res.text())
      .then(data => subject.next(data))
      .catch((error) => subject.error(error))
      .finally(() => subject.complete());
    return subject;
  }
}
