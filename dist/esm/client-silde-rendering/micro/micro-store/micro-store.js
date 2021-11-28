"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicroStore = void 0;
class MicroStore {
    microName;
    staticAssets;
    microManage;
    mountedList = [];
    _renderMicro;
    execMountedList = [];
    execFunctions;
    constructor(microName, staticAssets, microManage) {
        this.microName = microName;
        this.staticAssets = staticAssets;
        this.microManage = microManage;
        const { script } = staticAssets;
        // tslint:disable-next-line:function-constructor
        this.execFunctions = script.map((source) => new Function('microStore', 'fetchCacheData', source));
        this._renderMicro = this.execJavascript();
    }
    async onMounted(container, options) {
        this.execMountedList.push([container, options]);
        if (this.execMountedList.length === 1) {
            await this.execMounted();
        }
    }
    async unMounted(container) {
        const [exMicroInfo] = this.mountedList.filter((c) => container === c.container);
        if (!exMicroInfo) {
            return;
        }
        this.mountedList.splice(this.mountedList.indexOf(exMicroInfo), 1);
        const { unRender } = exMicroInfo;
        await unRender();
    }
    async execMounted() {
        const [[container, options]] = this.execMountedList;
        const ownerDocument = container.ownerDocument;
        const _options = { ...options, microManage: this.microManage };
        const unRender = await this._renderMicro(container, _options);
        this.mountedList.push({ unRender, container, document: ownerDocument });
        this.execMountedList.shift();
        if (this.execMountedList.length !== 0) {
            await this.execMounted();
        }
    }
    execJavascript() {
        const { fetchCacheData } = this.staticAssets;
        const microStore = { render: () => void (0) };
        this.execFunctions.forEach((fun) => fun(microStore, fetchCacheData));
        return microStore.render;
    }
}
exports.MicroStore = MicroStore;
//# sourceMappingURL=micro-store.js.map