import { LocatorStorage } from '@di';
import { cloneDeepWith, isBoolean, isFunction } from 'lodash';
import { forkJoin, from, isObservable, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { serializeRouter } from './serialize-router';
import { CanActivate, Resolve, RouteInfo, RouteItem } from './type-api';

export class Router {
  private routerList: RouteInfo[] = [];
  constructor(private ls: LocatorStorage, routerConfig: any) {
    this.routerList = serializeRouter([routerConfig]);
  }

  public async getRouterByPath(pathname: string) {
    let params: any = {};
    const pathList = pathname.split('/');
    const router = this.routerList.find(({ path }: RouteInfo) => {
      params = {};
      return !(path?.split('/') || []).some((itemPath: string, index: number) => {
        if (itemPath === '*' || itemPath === pathList[index]) {
          return false;
        }
        if (/^:[^:]*/.test(itemPath)) {
          params[itemPath.replace(/^:([^:]*)/, '$1')] = pathList[index];
          return false;
        }
        return true;
      });
    });
    return cloneDeepWith({ ...router, params }, (value) => isFunction(value) ? value : undefined);
  }

  public async loadModule(routeInfo: RouteInfo) {
    const { list = [] } = routeInfo;
    const promiseAll: Promise<any>[] = [];
    list.forEach((routeItem) => {
      const { loadModule } = routeItem;
      if (loadModule) {
        const promise = loadModule().then((result) => Object.assign(routeItem, result));
        promiseAll.push(promise);
      }
    });
    await Promise.all(promiseAll);
  }

  public canActivate(routeInfo: RouteInfo): Observable<boolean> {
    const execList = this.getExecList(routeInfo, (routeItem) => {
      const { canActivate = [] } = routeItem;
      return canActivate.map((item: CanActivate) => [routeItem, item]);
    });
    return execList.reduce((ob: Observable<boolean>, [routeItem, activate]) => ob.pipe(
      mergeMap((result: boolean) => {
        if (result !== false) {
          const activeResult = this.ls.getProvider<CanActivate>(activate).canActivate(routeInfo, routeItem);
          return isBoolean(activeResult) ? of(activeResult) : from(activeResult) as Observable<boolean>;
        }
        return of(result);
      })
    ), of(true));
  }

  public loadTesolve(routeInfo: RouteInfo): Observable<any> {
    const execList: [RouteItem, any][] = this.getExecList(routeInfo, (routeItem) => {
      const { resolve = {} } = routeItem;
      return Object.keys(resolve).map((key: string) => [routeItem, [key, resolve[key]]]);
    });
    const list: Observable<any>[] = [];
    execList.forEach(([routeItem, [key, result]]) => {
      const { props = {} } = routeItem;
      const server = this.ls.getProvider<Resolve<any>>(result);
      routeItem.props = props;
      if (server && server.resolve) {
        result = server.resolve(routeInfo, routeItem);

        if (result && (result.then || isObservable(result))) {
          return list.push(from(result).pipe((r: any) => props[key] = r));
        }
      }
      props[key] = result;
    });
    return list.length ? forkJoin(list) : of([]);
  }

  private getExecList(routeInfo: RouteInfo, handler: (routeItem: RouteItem) => [RouteItem, any][]) {
    const { list = [] } = routeInfo;
    return list.reverse().reduce((arr: any[], routeItem: RouteItem) => arr.concat(handler(routeItem)), []);
  }
}
