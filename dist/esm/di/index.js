"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSON_CONFIG = exports.LOCAL_STORAGE = void 0;
const tslib_1 = require("tslib");
const injector_token_1 = require("./injector-token");
(0, tslib_1.__exportStar)(require("./injector-token"), exports);
(0, tslib_1.__exportStar)(require("./injectable"), exports);
(0, tslib_1.__exportStar)(require("./abstract-injector"), exports);
(0, tslib_1.__exportStar)(require("./type-api"), exports);
exports.LOCAL_STORAGE = injector_token_1.InjectorToken.get('LOCAL_STORAGE');
exports.JSON_CONFIG = injector_token_1.InjectorToken.get('GET_CONFIG_METHOD');
//# sourceMappingURL=index.js.map