"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicroManage = void 0;
const tslib_1 = require("tslib");
const _di_1 = require("@di");
const operators_1 = require("rxjs/operators");
const load_assets_1 = require("../load-assets/load-assets");
const micro_store_1 = require("../micro-store/micro-store");
let MicroManage = class MicroManage {
    la;
    microCache = new Map();
    _querySelector = document.querySelector.bind(document);
    constructor(la) {
        this.la = la;
        document.querySelector = this.querySelector.bind(this);
    }
    bootstrapMicro(microName) {
        let storeSubject = this.microCache.get(microName);
        if (!storeSubject) {
            storeSubject = this.la.readMicroStatic(microName).pipe((0, operators_1.map)((result) => new micro_store_1.MicroStore(microName, result, this)), (0, operators_1.shareReplay)(1));
            this.microCache.set(microName, storeSubject);
        }
        return storeSubject;
    }
    queryShadowSelector(selectors) {
        const shadowList = selectors.split('::shadow').filter((item) => !!item);
        const end = shadowList.pop();
        const ele = shadowList.reduce((dom, sel) => dom ? dom.querySelector(sel)?.shadowRoot : null, document);
        return ele && ele.querySelector(end);
    }
    querySelector(selectors) {
        const _querySelector = selectors.indexOf('::shadow') !== -1 ? this.queryShadowSelector : this._querySelector;
        return _querySelector.call(this, selectors);
    }
};
MicroManage = (0, tslib_1.__decorate)([
    (0, _di_1.Injectable)(),
    (0, tslib_1.__metadata)("design:paramtypes", [load_assets_1.LoadAssets])
], MicroManage);
exports.MicroManage = MicroManage;
//# sourceMappingURL=micro-manage.js.map