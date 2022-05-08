import { Inject, Injectable, LocatorStorage } from '@di';
import { BrowserHistory, Location, parsePath } from 'history';
import { parse } from 'querystring';
import { Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { HISTORY, ROUTER_CONFIG, ROUTER_INTERCEPT } from '../../token';
import { Router } from './router';
import { AbstractRouterIntercept } from './router-intercept.abstract';
import { RouteInfo } from './type-api';

@Injectable()
export class SharedHistory {
  private router: Router;
  private history: BrowserHistory;
  private _routeInfo?: RouteInfo;
  public activeRoute = new Subject<RouteInfo>().pipe(shareReplay(1)) as Subject<RouteInfo>;

  constructor(private ls: LocatorStorage, @Inject(ROUTER_INTERCEPT) private intercept: AbstractRouterIntercept) {
    this.history = this.ls.getProvider<BrowserHistory>(HISTORY);
    this.router = new Router(ls, this.ls.getProvider(ROUTER_CONFIG));
    this.history.listen(this.listener.bind(this));
  }

  public navigateTo(url: string) {
    const location = parsePath(url) as Location;
    this.resolveIntercept(location).then((status) => status && this.history.push(url));
  }

  public async resolve() {
    const { location } = this.history;
    const status = await this.resolveIntercept(location);
    status && await this.listener();
  }

  public get currentRouteInfo(): RouteInfo {
    return this._routeInfo || { path: null, params: {}, query: {}, list: [] };
  }

  private async listener() {
    if (this.intercept) {
      await this.intercept.resolve(this.currentRouteInfo);
    }
    await this.router.loadResolve(this.currentRouteInfo).toPromise();
    this.activeRoute.next(this._routeInfo);
  }

  private async resolveIntercept(location: Location): Promise<boolean> {
    const [pathname, query] = this.parse(location);
    const { params, list = [] } = await this.router.getRouterByPath(pathname);
    this._routeInfo = { path: pathname, query, params, list };
    const status = await this.router.canActivate(this.currentRouteInfo).toPromise();
    if (!status) {
      this._routeInfo.list = [];
    } else if (await this.router.loadModule(this.currentRouteInfo)) {
      return await this.resolveIntercept(location);
    }
    return status;
  }

  private parse(location: Location): [string, any] {
    const { pathname, search = '' } = location;
    return [`/${pathname}`.replace('//', '/'), parse(search.replace(/^\?/, ''))];
  }
}
