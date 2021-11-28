"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonConfigService = void 0;
const tslib_1 = require("tslib");
const token_1 = require("@client-silde-rendering/token");
const _di_1 = require("@di");
const http_1 = require("@university/common/http");
const token_2 = require("@university/token");
const json_config_1 = require("@university/provider/json-config");
let JsonConfigService = class JsonConfigService extends json_config_1.AbstractJsonConfigService {
    ls;
    http = this.ls.getProvider(http_1.HttpClient);
    environment = this.ls.getProvider(token_2.ENVIRONMENT);
    cacheConfig = this.ls.getProvider(token_1.RESOURCE_TOKEN);
    constructor(ls) {
        super(ls);
        this.ls = ls;
    }
    getServerFetchData(url) {
        const { publicPath = '/' } = this.environment;
        return this.http.get(`${publicPath}/${url}`.replace(/\/+/g, '/'));
    }
};
JsonConfigService = (0, tslib_1.__decorate)([
    (0, _di_1.Injectable)(),
    (0, tslib_1.__param)(0, (0, _di_1.Inject)(_di_1.LOCAL_STORAGE)),
    (0, tslib_1.__metadata)("design:paramtypes", [_di_1.LocatorStorageImplements])
], JsonConfigService);
exports.JsonConfigService = JsonConfigService;
//# sourceMappingURL=json-config.service.js.map