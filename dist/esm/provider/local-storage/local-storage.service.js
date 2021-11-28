"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocatorStorage = void 0;
const tslib_1 = require("tslib");
const _di_1 = require("@di");
let LocatorStorage = class LocatorStorage {
    injector;
    constructor(injector) {
        this.injector = injector;
    }
    getService(target) {
        return this.injector.get(target);
    }
    getProvider(token) {
        return this.injector.get(token);
    }
};
LocatorStorage = (0, tslib_1.__decorate)([
    (0, _di_1.Injectable)(),
    (0, tslib_1.__metadata)("design:paramtypes", [_di_1.Injector])
], LocatorStorage);
exports.LocatorStorage = LocatorStorage;
//# sourceMappingURL=local-storage.service.js.map