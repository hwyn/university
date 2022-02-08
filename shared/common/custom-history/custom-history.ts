import { Inject, Injectable, LocatorStorage } from '@di';
import { BrowserHistory } from 'history';
import { cloneDeep } from 'lodash';
import { parse } from 'querystring';
import { Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { HISTORY, ROUTER_CONFIG, ROUTER_INTERCEPT } from '../../token';
import { AbstractRouterIntercept } from './router-intercept.abstract';
import { serializeRouter } from './serialize-router';
import { RouteInfo } from './type-api';

@Injectable()
export class CustomHistory {
  private history: BrowserHistory;
  private routerList: RouteInfo[] = [];
  private _routeInfo?: RouteInfo;
  public activeRoute = new Subject<RouteInfo>().pipe(shareReplay(1)) as Subject<RouteInfo>;

  constructor(private ls: LocatorStorage, @Inject(ROUTER_INTERCEPT) private intercept: AbstractRouterIntercept) {
    this.history = this.ls.getProvider<BrowserHistory>(HISTORY);
    this.routerList = serializeRouter(this.ls.getProvider(ROUTER_CONFIG));
    this.history.listen(this.resolve.bind(this));
  }

  public async resolve() {
    const [pathname, query] = this.parse();
    const { params, list = [], ...route } = this.getRouterByPath(pathname);
    this.intercept ? await this.intercept.resolve({ pathname, query, params, list, ...route }) : {};
    this._routeInfo = { path: pathname, query, params, list };
    this.activeRoute.next(this._routeInfo);
  }

  public get currentRouteInfo(): RouteInfo {
    return this._routeInfo || { path: null, params: {}, query: {}, list: [] };
  }

  private parse(): [string, any] {
    const { location: { pathname, search } } = this.history;
    return [`/${pathname}`.replace('//', '/'), parse(search.replace(/^\?/, ''))];
  }

  private getRouterByPath(pathname: string) {
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
    return { ...cloneDeep(router), params };
  }
}
