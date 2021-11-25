import { dynamicContext } from '@university/components';
import { isEmpty } from 'lodash';
import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { CustomRouter } from './router';
import { RouteInfo, UseRouter } from './type-api';

const EmptyComponent = ({ children }: any) => children;

const useRouter = (): [UseRouter] => {
  const injector = useContext(dynamicContext);
  const router = injector.get<CustomRouter>(CustomRouter);
  const [routeInfo, listenerRoute] = useState<RouteInfo>(router.currentRouteInfo);
  useEffect(() => {
    const ar = router.activeRoute.subscribe((route) => listenerRoute(route));
    return () => ar.unsubscribe();
  }, []);
  return [routeInfo];
};

export const RouterDom = (): ReactElement<any, any> => {
  const [route] = useRouter();
  const { list = [], props = {} } = route;
  if (isEmpty(list)) {
    return <></>;
  }

  const [[Component, firstProps = {}]] = list as any;
  list[1] = list[1] || [EmptyComponent];
  return list.slice(1).reduce((children, [Parent, propsParent]: any) => (
    <Parent {...propsParent}>{children}</Parent>
  ), <Component {...firstProps} {...props} />);
};
