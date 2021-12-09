import { Inject, Injectable, LocatorStorage } from '@di';
import { BrowserHistory } from 'history';
import { cloneDeep } from 'lodash';
import { parse } from 'querystring';
import { Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { HISTORY, ROUTER_CONFIG,ROUTER_INTERCEPT } from '../../token';
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

  private parse() {
    const { location: { pathname, search } } = this.history;
    const query = parse(search.replace(/^\?/, ''));
    const parsePath = `/${pathname}`.replace('//', '/');
    return [parsePath, query];
  }

  async resolve() {
    const [pathname, query] = this.parse();
    const [{list = [], ...route} = {}] = this.routerList.filter(({ path }: any) => path === pathname);
    const interceptData = this.intercept ? await this.intercept.resolve({ route, pathname, query }) : {};
    // tslint:disable-next-line:no-object-literal-type-assertion
    this._routeInfo = { list, ...route, path: pathname, props: { pathname, query, ...interceptData }} as RouteInfo;
    this.activeRoute.next(cloneDeep(this._routeInfo));
  }

  public get currentRouteInfo() {
    return this._routeInfo || { path: null, list: [] };
  }
}
