export type RouteItem = { path: string, component: any, props: { [key: string]: any } };

export interface RouteInfo {
  path: string | null;
  list: RouteItem[];
  query: { [key: string]: any };
  params: { [key: string]: any };
}

