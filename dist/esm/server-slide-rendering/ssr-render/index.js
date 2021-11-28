"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creareMicroSSRPath = void 0;
const express_1 = require("express");
const ssr_render_1 = require("./ssr-render");
const ssrMiiddleware = (entryFile, options) => {
    const router = (0, express_1.Router)();
    const ssr = new ssr_render_1.SSRRender(entryFile, options);
    router.get('/micro-ssr/:pathname', ssr.renderMicro.bind(ssr));
    router.get('/micro-ssr/*', ssr.renderMicro.bind(ssr));
    router.get('*', ssr.render.bind(ssr));
    return router;
};
exports.default = ssrMiiddleware;
const creareMicroSSRPath = (prefix = 'static') => (microName, pathname) => `/${prefix}/${microName}${pathname}`;
exports.creareMicroSSRPath = creareMicroSSRPath;
//# sourceMappingURL=index.js.map