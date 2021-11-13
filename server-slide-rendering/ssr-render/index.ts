import { SSRRender } from './ssr-render';
import { SSROptions } from './type-api';

function factorySSR({ port, assetFile, staticDir, entryFile, ...other }: SSROptions) {
  return new SSRRender(port, entryFile, assetFile, staticDir, other);
}

export default factorySSR;
export const render = (options: SSROptions) => {
  const ssr = factorySSR(options);
  return ssr.render.bind(ssr);
};

export const renderMicro = (options: SSROptions) => {
  const ssr = factorySSR(options);
  return ssr.renderMicro.bind(ssr);
};
