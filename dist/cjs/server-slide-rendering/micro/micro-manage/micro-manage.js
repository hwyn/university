"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicroManage = void 0;
const tslib_1 = require("tslib");
const _di_1 = require("@di");
const http_1 = require("@university/common/http");
const utils_1 = require("@university/common/micro/utils");
const token_1 = require("@university/token");
const provider_1 = require("@university/provider");
const lodash_1 = require("lodash");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const token_2 = require("../../token");
let MicroManage = class MicroManage {
    http;
    ls;
    registryParseHtmlMidde;
    microCache = new Map();
    microStaticCache = new Map();
    proxy;
    constructor(http, ls, registryParseHtmlMidde) {
        this.http = http;
        this.ls = ls;
        this.registryParseHtmlMidde = registryParseHtmlMidde;
        this.proxy = this.ls.getProvider(token_2.PROXY_HOST);
    }
    bootstrapMicro(microName) {
        let subject = this.microCache.get(microName);
        if (!subject) {
            const proxyMicroUrl = this.ls.getProvider(token_2.SSR_MICRO_PATH);
            const { location: { pathname } } = this.ls.getProvider(token_1.HISTORY_TOKEN);
            const microPath = `/${proxyMicroUrl(microName, `/micro-ssr/${pathname}`)}`.replace(/[\/]+/g, '/');
            subject = this.http.get(`${this.proxy}${microPath}`).pipe((0, operators_1.catchError)((error) => (0, rxjs_1.of)({ html: `${microName}<br/>${error.message}`, styles: '' })), (0, operators_1.switchMap)((microResult) => this.reeadLinkToStyles(microName, microResult)), (0, operators_1.map)((microResult) => ({ microResult: this.createMicroTag(microName, microResult), microName })), (0, operators_1.shareReplay)(1));
            subject.subscribe(() => { }, () => { });
            this.registryParseHtmlMidde(() => subject);
            this.microCache.set(microName, subject);
        }
        return (0, rxjs_1.of)(null);
    }
    reeadLinkToStyles(microName, microResult) {
        const { links = [] } = microResult;
        return (0, lodash_1.isEmpty)(links) ? (0, rxjs_1.of)(microResult) : (0, rxjs_1.forkJoin)(links.map((href) => this.getLinkCache(`${this.proxy}${href}`))).pipe((0, operators_1.map)((styles) => ({ ...microResult, linkToStyles: styles })));
    }
    getLinkCache(href) {
        let linkSubject = this.microStaticCache.get(href);
        if (!linkSubject) {
            linkSubject = this.http.getText(href).pipe((0, operators_1.shareReplay)(1), (0, operators_1.map)(lodash_1.cloneDeep));
            this.microStaticCache.set(href, linkSubject);
        }
        return linkSubject;
    }
    createMicroTag(microName, microResult) {
        const { html, styles, linkToStyles, microTags = [] } = microResult;
        const template = (0, utils_1.createMicroElementTemplate)(microName, { initHtml: html, initStyle: styles, linkToStyles });
        microTags.push((0, utils_1.templateZip)(`<script id="create-${microName}-tag">{template}
        (function() {
          const script = document.getElementById('create-${microName}-tag');
          script.parentNode.removeChild(script)
        })();
      </script>
    `, { template }));
        return { ...microResult, html: '', links: [], styles: '', microTags };
    }
};
MicroManage = (0, tslib_1.__decorate)([
    (0, _di_1.Injectable)(),
    (0, tslib_1.__param)(2, (0, _di_1.Inject)(token_2.REGISTRY_MICRO_MIDDER)),
    (0, tslib_1.__metadata)("design:paramtypes", [http_1.HttpClient,
        provider_1.LocatorStorage, Object])
], MicroManage);
exports.MicroManage = MicroManage;
//# sourceMappingURL=micro-manage.js.map