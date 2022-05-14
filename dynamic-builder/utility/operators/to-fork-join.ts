import { forkJoin, map,Observable, of } from '@fm/import-rxjs';

import { isObservable } from '../utility';

export function toForkJoin(resultList: any[]): Observable<any> {
  const obsListIndex: number[] = [];
  const obsList = resultList.filter((result, index) => {
    const isObs = isObservable(result);
    isObs && obsListIndex.push(index);
    return isObs;
  });
  return !obsList.length ? of(resultList) : forkJoin(obsList).pipe(
    map((results: any) => {
      obsListIndex.forEach((key, index) => resultList[key] = results[index]);
      return resultList;
    })
  );
}