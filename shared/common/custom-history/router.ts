import { LocatorStorage } from '@di';
import { cloneDeepWith, isBoolean, isFunction } from 'lodash';
import { forkJoin, from, isObservable, Observable, of } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';

import { serializeRouter } from './serialize-router';
import { CanActivate, Resolve, RouteInfo, RouteItem } from './type-api';

const getRex = () => /^:([^:]+)/g;

export class Router {
  private routerList: RouteInfo[] = [];
  constructor(private ls: LocatorStorage, private routerConfig: any) {
    this.refreshRouterList();
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
        if (getRex().test(itemPath)) {
          params[itemPath.replace(getRex(), '$1')] = pathList[index];
          return false;
        }
        return true;
      });
    });
    const routeInfo = cloneDeepWith({ ...router, params }, (value) => isFunction(value) ? value : undefined);
    return this.pathKey(pathname, routeInfo);
  }

  public async loadModule(routeInfo: RouteInfo): Promise<boolean> {
    const { list = [] } = routeInfo;
    const promiseAll: Promise<any>[] = [];
    list.forEach((routeItem) => {
      const { loadModule } = routeItem;
      if (loadModule) {
        promiseAll.push(loadModule().then((result) => {
          Object.assign(routeInfo, { needRefresh: this.addRouteConfig(routeItem, result) });
        }));
      }
    });
    return await Promise.all(promiseAll).then(() => (routeInfo as any).needRefresh);
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

  public loadResolve(routeInfo: RouteInfo): Observable<any> {
    const execList: [RouteItem, any][] = this.getExecList(routeInfo, (routeItem) => {
      const { resolve = {} } = routeItem;
      return Object.keys(resolve).map((key: string) => [routeItem, [key, resolve[key]]]);
    });
    const list: Observable<any>[] = [];
    execList.forEach(([routeItem, [key, result]]) => {
      const { props = {} } = routeItem;
      const server = this.ls.getProvider<Resolve>(result);
      routeItem.props = props;
      if (server && server.resolve) {
        result = server.resolve(routeInfo, routeItem);

        if (result && (result.then || isObservable(result))) {
          return list.push(from(result).pipe(tap((r: any) => props[key] = r)));
        }
      }
      props[key] = result;
    });
    return list.length ? forkJoin(list) : of([]);
  }

  private pathKey(pathname: string, routeInfo: RouteInfo) {
    const { params, list = [] } = routeInfo;
    list.forEach((routeItem: any) => {
      const { path } = routeItem;
      const hasRex = path.indexOf('*') !== -1;
      routeItem.key = hasRex ? pathname : path.replace(getRex(), (a: string, b: string) => params[b]);
    });
    return routeInfo;
  }

  private getExecList(routeInfo: RouteInfo, handler: (routeItem: RouteItem) => [RouteItem, any][]) {
    const { list = [] } = routeInfo;
    return [...list].reverse().reduce((arr: any[], routeItem: RouteItem) => arr.concat(handler(routeItem)), []);
  }

  private addRouteConfig(routeItem: RouteItem, result: any) {
    const { children = [] } = result;
    const routeConfig = this.getRouteItemByPath(this.routerConfig, routeItem.path);
    const needRefresh = children.length;
    delete routeItem.loadModule;
    delete routeConfig.loadModule;
    Object.assign(routeConfig, result);
    needRefresh ? this.refreshRouterList() : Object.assign(routeItem, result);
    return needRefresh;
  }

  private getRouteItemByPath(routerConfig: any[], path: string): any {
    return routerConfig.find(({ path: _path, children }: any) => _path === path || children && this.getRouteItemByPath(children, path));
  }

  private refreshRouterList() {
    const routerConfig = this.routerConfig;
    this.routerConfig = Array.isArray(routerConfig) ? routerConfig : [routerConfig];
    this.routerList = serializeRouter(this.routerConfig);
  }
}
