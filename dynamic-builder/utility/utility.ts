import { Observable, of } from 'rxjs';

export function transformObservable(obj: any): Observable<any> {
  return obj && obj.subscribe ? obj : of(obj);
}

export function withValue(value: any): PropertyDescriptor {
  return { value, enumerable: true, configurable: true };
}

export function withGetOrSet(get: () => any, set?: (value: any) => void) {
  return { get, set, enumerable: true, configurable: true };
}
