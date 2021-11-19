export type ProxyMicroUrl = (microName: string, pathname: string) => string;

export interface SSROptions {
  staticDir: string;
  assetFile: string;
  microName?: string;
  proxyTarget?: string;
  ssrMicroPath?: ProxyMicroUrl;
}
