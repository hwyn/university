"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeAction = exports.builderExtensions = void 0;
const tslib_1 = require("tslib");
const token_1 = require("../token");
const actions_1 = require("./action/actions");
const actions_extension_1 = require("./action/actions.extension");
const basic_extension_1 = require("./basic/basic.extension");
Object.defineProperty(exports, "serializeAction", { enumerable: true, get: function () { return basic_extension_1.serializeAction; } });
const datasource_extension_1 = require("./datasource/datasource.extension");
const form_extension_1 = require("./form/form.extension");
const grid_extension_1 = require("./grid/grid.extension");
const instance_extension_1 = require("./instance/instance.extension");
const life_cycle_extension_1 = require("./life-cycle/life-cycle.extension");
const metadata_extension_1 = require("./metadata/metadata.extension");
const view_model_extension_1 = require("./view-model/view-model.extension");
const check_visibility_extension_1 = require("./visibility/check-visibility.extension");
exports.builderExtensions = [
    { provide: token_1.ACTION_INTERCEPT, useClass: actions_1.Action },
    { provide: token_1.BUILDER_EXTENSION, multi: true, useValue: check_visibility_extension_1.CheckVisibilityExtension },
    { provide: token_1.BUILDER_EXTENSION, multi: true, useValue: grid_extension_1.GridExtension },
    { provide: token_1.BUILDER_EXTENSION, multi: true, useValue: instance_extension_1.InstanceExtension },
    { provide: token_1.BUILDER_EXTENSION, multi: true, useValue: view_model_extension_1.ViewModelExtension },
    { provide: token_1.BUILDER_EXTENSION, multi: true, useValue: form_extension_1.FormExtension },
    { provide: token_1.BUILDER_EXTENSION, multi: true, useValue: datasource_extension_1.DataSourceExtension },
    { provide: token_1.BUILDER_EXTENSION, multi: true, useValue: metadata_extension_1.MetadataExtension },
    { provide: token_1.BUILDER_EXTENSION, multi: true, useValue: actions_extension_1.ActionExtension },
    { provide: token_1.BUILDER_EXTENSION, multi: true, useValue: life_cycle_extension_1.LifeCycleExtension }
];
(0, tslib_1.__exportStar)(require("./type-api"), exports);
(0, tslib_1.__exportStar)(require("./action"), exports);
(0, tslib_1.__exportStar)(require("./action/create-actions"), exports);
(0, tslib_1.__exportStar)(require("./basic/basic.extension"), exports);
//# sourceMappingURL=index.js.map