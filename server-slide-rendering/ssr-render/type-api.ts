export type ProxyMicroUrl = (microName: string, pathname: string) => string;

export interface SSROptions {
  index?: string;
  staticDir?: string | ((url: string) => string);
  manifestFile: string;
  microName?: string;
  proxyTarget?: string;
  vmContext?: { [key: string]: any };
  microSSRPath?: ProxyMicroUrl;
}
