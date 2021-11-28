import { Router } from 'express';
import { SSRRender } from './ssr-render';
import { SSROptions } from './type-api';

const ssrMiiddleware = (entryFile: string, options: SSROptions): Router => {
  const router = Router();
  const ssr = new SSRRender(entryFile, options);
  router.get('/micro-ssr/:pathname', ssr.renderMicro.bind(ssr));
  router.get('/micro-ssr/*', ssr.renderMicro.bind(ssr));
  router.get('*', ssr.render.bind(ssr));
  return router;
};

export default ssrMiiddleware;
export const creareMicroSSRPath = (prefix: string = 'static') => (microName: string, pathname: string) => `/${prefix}/${microName}${pathname}`;
