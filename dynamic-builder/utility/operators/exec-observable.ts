import { Observable, Subscriber } from 'rxjs';
import { map } from 'rxjs/operators';

export function observableMap(fn: (result: any) => Observable<any>) {
  return (souce: Observable<any>) => souce.lift(function (this: Subscriber<any>, liftedSource: Observable<any>) {
    liftedSource.subscribe((result) => fn(result).subscribe(this));
  });
}

export function observableTap(fn: (result: any) => Observable<any>): any {
  return (souce: Observable<any>) => souce.lift(function(this: Subscriber<any>, liftedSource: Observable<any>) {
    liftedSource.subscribe((result) => fn(result).pipe(map(() => result)).subscribe(this));
  });
}