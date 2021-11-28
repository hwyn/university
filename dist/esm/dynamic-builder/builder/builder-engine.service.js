"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuilderEngine = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const _di_1 = require("@di");
const token_1 = require("../token");
let BuilderEngine = class BuilderEngine {
    JsonConfigService;
    uiElement;
    constructor(uiComponents, JsonConfigService) {
        this.JsonConfigService = JsonConfigService;
        this.uiElement = (0, lodash_1.flatMap)(uiComponents);
    }
    getUiComponent(name) {
        const [{ component } = { component: null }] = this.uiElement.filter((ui) => ui.name === name);
        return component;
    }
    getJsonConfig(jsonName) {
        return this.JsonConfigService.getJsonConfig(jsonName);
    }
};
BuilderEngine = (0, tslib_1.__decorate)([
    (0, _di_1.Injectable)(),
    (0, tslib_1.__param)(0, (0, _di_1.Inject)(token_1.UI_ELEMENT)),
    (0, tslib_1.__param)(1, (0, _di_1.Inject)(_di_1.JSON_CONFIG)),
    (0, tslib_1.__metadata)("design:paramtypes", [Array, _di_1.JsonConfigImplements])
], BuilderEngine);
exports.BuilderEngine = BuilderEngine;
//# sourceMappingURL=builder-engine.service.js.map