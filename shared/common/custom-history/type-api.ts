import { ReactNode } from 'react';

export type RouteItem = [ReactNode, object];

export interface RouteInfo {
  path: string | null;
  list: RouteItem[];
}

export interface UseRouter extends RouteInfo {
  props?: any;
}
