"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Platform = void 0;
const _di_1 = require("@di");
const token_1 = require("@university/token");
const provider_1 = require("@university/provider");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const micro_1 = require("../../micro");
const token_2 = require("../../token");
const json_config_service_1 = require("../json-config/json-config.service");
class Platform {
    providers;
    rootInjector;
    microMiddlewareList = [];
    staticFileSourceList = {};
    currentPageFileSourceList = {};
    constructor(providers = []) {
        this.providers = providers;
        this.rootInjector = (0, _di_1.getProvider)(_di_1.Injector);
    }
    bootstrapRender(render) {
        exports.render = this.proxyRender.bind(this, render);
    }
    async proxyRender(render, global, isMicro = false) {
        const { fetch, request, location, readAssets, readStaticFile, proxyHost, microSSRPath, ..._global } = global;
        const providers = [
            { provide: token_1.IS_MICRO, useValue: isMicro },
            { provide: token_2.PROXY_HOST, useValue: proxyHost },
            { provide: token_2.REQUEST_TOKEN, useValue: request },
            { provide: token_2.SSR_MICRO_PATH, useValue: microSSRPath },
            { provide: token_1.FETCH_TOKEN, useValue: this.proxyFetch(fetch) },
            { provide: token_2.READ_FILE_STATIC, useValue: this.proxyReadStaticFile(readStaticFile) },
            { provide: token_2.REGISTRY_MICRO_MIDDER, useValue: this.registryMicroMiddleware.bind(this) }
        ];
        const injector = this.beforeBootstrapRender(providers);
        injector.get(token_1.HISTORY_TOKEN).location = this.getLocation(request, isMicro);
        this.microMiddlewareList = [];
        this.currentPageFileSourceList = {};
        const { js = [], links = [] } = readAssets();
        const { html, styles } = await render(injector, { request, ..._global });
        const execlResult = await this.execlMicroMiddleware({ html, styles, js, links, microTags: [], microFetchData: [] });
        return { ...execlResult, fetchData: this.getStaticFileData() };
    }
    beforeBootstrapRender(providers = []) {
        const injector = new _di_1.StaticInjector(this.rootInjector, { isScope: 'self' });
        const _providers = [
            ...this.providers,
            { provide: token_1.MICRO_MANAGER, useClass: micro_1.MicroManage },
            { provide: _di_1.LOCAL_STORAGE, useClass: provider_1.LocatorStorage },
            { provide: _di_1.JSON_CONFIG, useClass: json_config_service_1.JsonConfigService },
            { provide: token_1.HISTORY_TOKEN, useValue: { location: {}, listen: () => () => void (0) } },
            ...providers
        ];
        _providers.forEach((provider) => injector.set(provider.provide, provider));
        return injector;
    }
    getStaticFileData() {
        return JSON.stringify(this.currentPageFileSourceList);
    }
    proxyFetch(fetch) {
        return (...args) => fetch(...args);
    }
    proxyReadStaticFile(readStaticFile) {
        return (url) => {
            let fileCache = this.staticFileSourceList[url];
            if (!fileCache) {
                fileCache = { type: 'file-static', source: JSON.parse(readStaticFile(url)) };
                this.staticFileSourceList[url] = fileCache;
            }
            this.currentPageFileSourceList[url] = fileCache;
            return (0, rxjs_1.of)(fileCache.source);
        };
    }
    mergeMicroToSSR(middleware) {
        return ({ html = ``, styles = ``, js = [], links = [], microTags = [], microFetchData = [] }) => middleware().pipe((0, operators_1.map)(({ microName, microResult }) => ({
            html: html.replace(`<!-- ${microName} -->`, microResult.html),
            styles: styles + microResult.styles,
            js: js.concat(...microResult.js || []),
            links: links.concat(...microResult.links || []),
            microTags: microTags.concat(...microResult.microTags || []),
            microFetchData: microFetchData.concat(...microResult.microFetchData || [])
        })));
    }
    execlMicroMiddleware(options) {
        return this.microMiddlewareList.reduce((input, middleware) => (input.pipe((0, operators_1.switchMap)(this.mergeMicroToSSR(middleware)))), (0, rxjs_1.of)(options)).toPromise();
    }
    registryMicroMiddleware(middleware) {
        this.microMiddlewareList.push(middleware);
    }
    getLocation(request, isMicro) {
        const { pathname = '' } = request.params;
        return { pathname: isMicro ? `/${pathname}` : request.path, search: '?' };
    }
}
exports.Platform = Platform;
//# sourceMappingURL=platform.js.map