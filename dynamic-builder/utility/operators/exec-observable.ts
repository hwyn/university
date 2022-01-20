import { Observable, Subscriber } from 'rxjs';

export function observableMap(fn: (result: any) => Observable<any>) {
  return (souce: Observable<any>) => souce.lift(function (this: Subscriber<any>, liftedSource: Observable<any>) {
    liftedSource.subscribe((result) => fn(result).subscribe(this));
  });
}
