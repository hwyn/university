"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vmRequire = void 0;
const vmModules = {
    querystring: require('querystring'),
    stream: require('stream'),
    buffer: require('buffer'),
    events: require('events'),
    util: require('util')
};
const vmRequire = (modelName) => vmModules[modelName];
exports.vmRequire = vmRequire;
//# sourceMappingURL=vm-modules.js.map