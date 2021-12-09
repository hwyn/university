import { Router } from 'express';

import { SSRRender } from './ssr-render';
import { SSROptions } from './type-api';

// eslint-disable-next-line max-len
export const creareMicroSSRPath = (prefix = 'static') => (microName: string, pathname: string) => `/${prefix}/${microName}${pathname}`;

export default (entryFile: string, options: SSROptions): Router => {
  const router = Router();
  const ssr = new SSRRender(entryFile, options);
  router.get('/micro-ssr/:pathname', ssr.renderMicro.bind(ssr));
  router.get('/micro-ssr/*', ssr.renderMicro.bind(ssr));
  router.get('*', ssr.render.bind(ssr));
  return router;
};
