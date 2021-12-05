export abstract class AbstractRouterIntercept {
  abstract resolve<T = any>(route: T): Promise<T>;
}
