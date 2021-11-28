"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const builder_extension_1 = require("./builder-extension");
const _di_1 = require("@di");
(0, _di_1.registryProvider)(builder_extension_1.builderExtensions);
(0, tslib_1.__exportStar)(require("./builder"), exports);
(0, tslib_1.__exportStar)(require("./builder-extension"), exports);
(0, tslib_1.__exportStar)(require("./token"), exports);
//# sourceMappingURL=index.js.map