"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REQUEST_TOKEN = exports.READ_FILE_STATIC = exports.SSR_MICRO_PATH = exports.REGISTRY_MICRO_MIDDER = exports.PROXY_HOST = void 0;
const _di_1 = require("@di");
exports.PROXY_HOST = _di_1.InjectorToken.get('PROXY_HOST');
exports.REGISTRY_MICRO_MIDDER = _di_1.InjectorToken.get('REGISTRY_HTML_MIDDER');
exports.SSR_MICRO_PATH = _di_1.InjectorToken.get('SSR_MICRO_PATH');
exports.READ_FILE_STATIC = _di_1.InjectorToken.get('READ_FILE_STATIC');
exports.REQUEST_TOKEN = _di_1.InjectorToken.get('REQUEST_TOKEN');
//# sourceMappingURL=index.js.map