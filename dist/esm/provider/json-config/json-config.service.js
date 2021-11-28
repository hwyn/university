"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractJsonConfigService = void 0;
const lodash_1 = require("lodash");
const operators_1 = require("rxjs/operators");
class AbstractJsonConfigService {
    ls;
    cacheConfig = new Map();
    constructor(ls) {
        this.ls = ls;
    }
    getJsonConfig(url) {
        let subject = this.cacheConfig.get(url);
        if (!subject) {
            subject = this.getServerFetchData(url).pipe((0, operators_1.shareReplay)(1), (0, operators_1.map)(lodash_1.cloneDeep));
            this.cacheConfig.set(url, subject);
        }
        return subject;
    }
}
exports.AbstractJsonConfigService = AbstractJsonConfigService;
//# sourceMappingURL=json-config.service.js.map