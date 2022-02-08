import { isEmpty } from 'lodash';

import { RouteInfo } from './type-api';

export const serializeRouter = (router: any, parentRouter?: any): RouteInfo[] => {
  if (isEmpty(router)) {
    return [];
  }

  if (Array.isArray(router)) {
    return serializeRouter({ path: ``, children: router, list: [] });
  }

  const { children = [], ...routeInfo } = router;
  const { path = ``, component: Children, } = routeInfo;
  const { path: parentPath = ``, list: parentList = [] } = parentRouter || {};

  const routePath = `${parentPath}/${path}`.replace(/[/]{1,}/ig, '/');
  const ComponentList = [routeInfo, ...parentList];

  if (!isEmpty(children)) {
    return children.reduce((list: any[], r: any) => [
      ...list,
      ...serializeRouter(r, { path: routePath, list: ComponentList })
    ], []);
  }

  return !Children ? [] : [{
    path: routePath,
    list: ComponentList.filter((item) => !!item.component)
  }] as any[];
};

