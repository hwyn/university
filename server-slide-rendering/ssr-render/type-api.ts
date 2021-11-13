export type ProxyMicroUrl = (microName: string, pathname: string) => string;

export interface SSROptions {
  port: number;
  staticDir: string;
  entryFile: string;
  assetFile: string;
  microName?: string;
  proxyMicroUrl?: ProxyMicroUrl;
}
