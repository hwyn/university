"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Platform = void 0;
const _di_1 = require("@di");
const token_1 = require("@university/token");
const local_storage_service_1 = require("@university/provider/local-storage/local-storage.service");
const lodash_1 = require("lodash");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const token_2 = require("../../token");
class Platform {
    providers;
    rootInjector = (0, _di_1.getProvider)(_di_1.Injector);
    cacheObject = new Map();
    constructor(providers) {
        this.providers = providers;
    }
    bootstrapRender(render) {
        !this.isMicro ? render(this.beforeBootstrapRender()) : microStore.render = this.proxyRender.bind(this, render);
    }
    async proxyRender(render, container, options) {
        const { microManage, ..._options } = options;
        const head = container.shadowRoot?.querySelector('[data-app="head"]') || document.head;
        const shadowContainer = container.shadowRoot?.querySelector('[data-app="body"]');
        const injector = this.beforeBootstrapRender([
            { provide: token_1.MICRO_MANAGER, useValue: microManage },
            { provide: token_2.APPLICATION_CONTAINER, useValue: shadowContainer },
            { provide: token_2.INSERT_STYLE_CONTAINER, useValue: head }
        ]);
        return render(injector, _options);
    }
    beforeBootstrapRender(providers = []) {
        const injector = new _di_1.StaticInjector(this.rootInjector, { isScope: 'self' });
        const _providers = [
            ...this.providers,
            { provide: token_2.RENDER_SSR, useValue: true },
            { provide: token_1.IS_MICRO, useValue: this.isMicro },
            { provide: _di_1.LOCAL_STORAGE, useClass: local_storage_service_1.LocatorStorage },
            { provide: token_1.FETCH_TOKEN, useValue: this.proxyFetch() },
            { provide: token_2.INSERT_STYLE_CONTAINER, useValue: document.head },
            { provide: token_2.RESOURCE_TOKEN, useFactory: this.factoryResourceCache.bind(this, 'file-static') },
            ...providers
        ];
        _providers.forEach((provider) => injector.set(provider.provide, provider));
        return injector;
    }
    proxyFetch() {
        return (input, init) => fetch.apply(window, [input, init]);
    }
    factoryResourceCache(type) {
        if (!type || this.cacheObject.has(type)) {
            return type && this.cacheObject.get(type) || new Map();
        }
        const resourceObj = this.resource;
        const cacheResource = new Map();
        Object.keys(resourceObj).forEach((key) => {
            const { source, type: sourceType } = resourceObj[key];
            if (sourceType === type) {
                cacheResource.set(key, (0, rxjs_1.of)(source).pipe((0, operators_1.map)(lodash_1.cloneDeep)));
            }
        });
        this.cacheObject.set(type, cacheResource);
        return cacheResource;
    }
    get isMicro() {
        return typeof microStore !== 'undefined';
    }
    get resource() {
        return typeof fetchCacheData !== 'undefined' ? fetchCacheData : {};
    }
}
exports.Platform = Platform;
//# sourceMappingURL=platform.js.map