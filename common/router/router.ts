import { Inject, Injectable, LOCAL_STORAGE, LocatorStorageImplements } from '@di';
import { BrowserHistory } from 'history';
import { cloneDeep } from 'lodash';
import { parse } from 'querystring';
import { Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { HISTORY_TOKEN, ROUTER_CONFIG, ROUTER_INTERCEPT } from '../token';
import { serializeRouter } from './resolve';
import { RouteInfo, RouterIntercept } from './type-api';

@Injectable()
export class CustomRouter {
  private history: BrowserHistory;
  private routerList: RouteInfo[] = [];
  private _routeInfo?: RouteInfo;
  public activeRoute = new Subject<RouteInfo>().pipe(shareReplay(1)) as Subject<RouteInfo>;

  constructor(
    @Inject(ROUTER_INTERCEPT) private intercept: RouterIntercept,
    @Inject(LOCAL_STORAGE) private ls: LocatorStorageImplements,
    @Inject(ROUTER_CONFIG) router: any
  ) {
    this.history = this.ls.getProvider<BrowserHistory>(HISTORY_TOKEN);
    this.routerList = serializeRouter(cloneDeep(router));
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
