import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export function isObservable(obj: any) {
  return obj && !!obj.subscribe;
}

export function transformObservable(obj: any): Observable<any> {
  return obj && obj.subscribe ? obj : of(obj);
}

export function transformObj(result: any, returnValue?: any) {
  const notTransform = !isObservable(result) || typeof returnValue === 'undefined';
  return notTransform ? returnValue : result.pipe(map(() => returnValue));
}

export function withValue(value: any): PropertyDescriptor {
  return { value, enumerable: true, configurable: true };
}

export function withGetOrSet(get: () => any, set?: (value: any) => void) {
  return { get, set, enumerable: true, configurable: true };
}
