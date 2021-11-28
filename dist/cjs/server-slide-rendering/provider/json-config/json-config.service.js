"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonConfigService = void 0;
const tslib_1 = require("tslib");
const _di_1 = require("@di");
const provider_1 = require("@university/provider");
const token_1 = require("../../token");
let JsonConfigService = class JsonConfigService extends provider_1.AbstractJsonConfigService {
    ls;
    readFieldStatic = this.ls.getProvider(token_1.READ_FILE_STATIC);
    constructor(ls) {
        super(ls);
        this.ls = ls;
    }
    getServerFetchData(url) {
        return this.readFieldStatic(url);
    }
};
JsonConfigService = (0, tslib_1.__decorate)([
    (0, _di_1.Injectable)(),
    (0, tslib_1.__param)(0, (0, _di_1.Inject)(_di_1.LOCAL_STORAGE)),
    (0, tslib_1.__metadata)("design:paramtypes", [_di_1.LocatorStorageImplements])
], JsonConfigService);
exports.JsonConfigService = JsonConfigService;
//# sourceMappingURL=json-config.service.js.map