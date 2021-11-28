"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadAssets = void 0;
const tslib_1 = require("tslib");
const _di_1 = require("@di");
const http_1 = require("@university/common/http");
const utils_1 = require("@university/common/micro/utils");
const lodash_1 = require("lodash");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
let LoadAssets = class LoadAssets {
    http;
    cacheServerData;
    constructor(http) {
        this.http = http;
        this.cacheServerData = this.initialCacheServerData();
    }
    initialCacheServerData() {
        return typeof microFetchData !== 'undefined' ? microFetchData : [];
    }
    parseStatic(microName, entryPoints) {
        const entryKeys = Object.keys(entryPoints);
        const microData = this.cacheServerData.find(({ microName: _microName }) => microName === _microName);
        const fetchCacheData = microData ? JSON.parse(microData.source) : {};
        const staticAssets = { javascript: [], script: [], links: [], fetchCacheData };
        entryKeys.forEach((staticKey) => {
            const { js: staticJs = [], css: staticLinks = [] } = entryPoints[staticKey].assets;
            staticAssets.javascript.push(...staticJs);
            staticAssets.links.push(...staticLinks);
        });
        return this.readJavascript(staticAssets);
    }
    reeadLinkToStyles(links) {
        return (0, lodash_1.isEmpty)(links) ? (0, rxjs_1.of)(links) : (0, rxjs_1.forkJoin)(links.map((href) => this.http.getText(href)));
    }
    readJavascript(staticAssets) {
        const { javascript, script, ...other } = staticAssets;
        return (0, rxjs_1.forkJoin)(javascript.map((src) => this.http.getText(src))).pipe((0, operators_1.map)((js) => ({ script: js, javascript, ...other })));
    }
    createMicroTag(microName, staticAssets) {
        const tag = document.createElement(`${microName}-tag`);
        return tag && tag.shadowRoot ? (0, rxjs_1.of)(staticAssets) : this.reeadLinkToStyles(staticAssets.links).pipe((0, operators_1.tap)((linkToStyles) => {
            // tslint:disable-next-line:function-constructor
            new Function((0, utils_1.createMicroElementTemplate)(microName, { linkToStyles }))();
        }), (0, operators_1.map)(() => staticAssets));
    }
    readMicroStatic(microName) {
        return this.http.get(`/static/${microName}/static/assets.json`).pipe((0, operators_1.switchMap)((result) => this.parseStatic(microName, result.entrypoints)), (0, operators_1.switchMap)((result) => this.createMicroTag(microName, result)));
    }
};
LoadAssets = (0, tslib_1.__decorate)([
    (0, _di_1.Injectable)(),
    (0, tslib_1.__metadata)("design:paramtypes", [http_1.HttpClient])
], LoadAssets);
exports.LoadAssets = LoadAssets;
//# sourceMappingURL=load-assets.js.map