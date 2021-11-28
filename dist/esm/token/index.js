"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_INITIALIZER = exports.MICRO_MANAGER = exports.IS_MICRO = exports.HISTORY_TOKEN = exports.FETCH_TOKEN = exports.ENVIRONMENT = void 0;
const _di_1 = require("@di");
exports.ENVIRONMENT = _di_1.InjectorToken.get('ENVIRONMENT');
exports.FETCH_TOKEN = _di_1.InjectorToken.get('FETCH_TOKEN');
exports.HISTORY_TOKEN = _di_1.InjectorToken.get('HISTORY_TOKEN');
exports.IS_MICRO = _di_1.InjectorToken.get('IS_MICRO');
exports.MICRO_MANAGER = _di_1.InjectorToken.get('MICRO_MANAGER');
exports.APP_INITIALIZER = _di_1.InjectorToken.get('APP_INITIALIZER');
//# sourceMappingURL=index.js.map