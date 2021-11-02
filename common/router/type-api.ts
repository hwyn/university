import { ReactNode } from 'react';

export type RouteItem = [ReactNode, object];

export interface RouteInfo {
  path: string | null;
  list: RouteItem[];
}

export interface UseRouter extends RouteInfo {
  props?: any;
}

export abstract class RouterIntercept {
  abstract resolve<T = any>(route: T): Promise<T>;
}
