"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicPlatform = void 0;
const platform_1 = require("./platform");
const dynamicPlatform = (providers = []) => new platform_1.Platform(providers);
exports.dynamicPlatform = dynamicPlatform;
//# sourceMappingURL=index.js.map