"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSRRender = void 0;
const tslib_1 = require("tslib");
const fs_1 = (0, tslib_1.__importDefault)(require("fs"));
const module_1 = require("module");
const node_fetch_1 = (0, tslib_1.__importDefault)(require("node-fetch"));
const path_1 = (0, tslib_1.__importDefault)(require("path"));
const vm_1 = (0, tslib_1.__importDefault)(require("vm"));
const vm_modules_1 = require("./vm-modules");
class SSRRender {
    entryFile;
    host;
    index;
    microName;
    manifestFile;
    _compiledRender;
    staticDir;
    microSSRPath;
    isDevelopment = process.env.NODE_ENV === 'development';
    constructor(entryFile, options) {
        this.entryFile = entryFile;
        const { index, manifestFile, staticDir, microName, proxyTarget = 'http://127.0.0.1:3000', microSSRPath } = options;
        this.manifestFile = manifestFile;
        this.index = index || '';
        this.staticDir = staticDir || '';
        this.microName = microName || '';
        this.host = proxyTarget;
        this.microSSRPath = microSSRPath;
    }
    get global() {
        return {
            proxyHost: this.host,
            microSSRPath: this.microSSRPath,
            fetch: this.proxyFetch.bind(this),
            readStaticFile: this.readStaticFile.bind(this),
            readAssets: this.readAssets.bind(this)
        };
    }
    proxyFetch(url, init) {
        const _url = /http|https/.test(url) ? url : `${this.host}/${url.replace(/^[\/]+/, '')}`;
        return (0, node_fetch_1.default)(_url, init).then((res) => {
            const { status, statusText } = res;
            if (![404, 504].includes(status)) {
                return res;
            }
            throw new Error(`${status}: ${statusText}`);
        });
    }
    readHtmlTemplate() {
        let template = `<!-- inner-style --><!-- inner-html -->`;
        if (this.index && fs_1.default.existsSync(this.index)) {
            template = fs_1.default.readFileSync(this.index, 'utf-8');
        }
        if (this.isDevelopment) {
            const { js } = this.readAssets();
            const hotResource = js.map((src) => `<script defer src="${src}"></script>`).join('');
            const rex = `<!-- inner-style -->`;
            template = template.replace(rex, `${hotResource}${rex}`);
        }
        return template;
    }
    readStaticFile(url) {
        let staticDir = this.staticDir;
        if (typeof staticDir === 'function') {
            staticDir = staticDir(url);
        }
        const filePath = staticDir ? path_1.default.join(staticDir, url) : '';
        return filePath && fs_1.default.existsSync(filePath) ? fs_1.default.readFileSync(filePath, 'utf-8') : '';
    }
    readAssets() {
        let assetsResult = '{entrypoints: {}}';
        if (this.manifestFile && fs_1.default.existsSync(this.manifestFile)) {
            assetsResult = fs_1.default.readFileSync(this.manifestFile, 'utf-8');
        }
        const { entrypoints = {} } = JSON.parse(assetsResult);
        const staticAssets = { js: [], links: [], linksToStyle: [] };
        Object.keys(entrypoints).forEach((key) => {
            const { js = [], css = [] } = entrypoints[key].assets;
            staticAssets.js.push(...js);
            staticAssets.links.push(...css);
        });
        return staticAssets;
    }
    factoryVmScript() {
        const m = { exports: {}, require: vm_modules_1.vmRequire };
        const wrapper = module_1.Module.wrap(fs_1.default.readFileSync(this.entryFile, 'utf-8'));
        const script = new vm_1.default.Script(wrapper, { filename: 'server-entry.js', displayErrors: true });
        const context = vm_1.default.createContext({ Buffer, process, console, setTimeout, setInterval });
        const compiledWrapper = script.runInContext(context);
        compiledWrapper(m.exports, m.require, m);
        this._compiledRender = m.exports.render;
    }
    async _render(request, isMicro) {
        try {
            const m = { exports: {}, require: vm_modules_1.vmRequire };
            if (this.isDevelopment || !this._compiledRender) {
                this.factoryVmScript();
            }
            return await this._compiledRender({ ...this.global, request }, isMicro);
        }
        catch (e) {
            console.log(e);
            return { html: e.message, styles: '' };
        }
    }
    createScriptTemplate(scriptId, insertInfo) {
        return `<script id="${scriptId}">${insertInfo}(function(){ const script = document.querySelector('#${scriptId}');script.parentNode.removeChild(script);}());</script>`;
    }
    async renderMicro(request, response) {
        const { html, styles, links, js, fetchData, microTags, microFetchData = [] } = await this._render(request, true);
        microFetchData.push({ microName: this.microName, source: fetchData });
        response.json({ html, styles, links, js, microTags, microFetchData });
    }
    async render(request, response) {
        const { html, styles, fetchData, microTags = [], microFetchData = [] } = await this._render(request);
        const _fetchData = this.createScriptTemplate('fetch-static', `var fetchCacheData = ${fetchData};`);
        const microData = this.createScriptTemplate('micro-fetch-static', `var microFetchData = ${JSON.stringify(microFetchData)};`);
        const _html = this.readHtmlTemplate()
            .replace('<!-- inner-html -->', html)
            .replace('<!-- inner-style -->', `${styles}${_fetchData}${microData}${microTags.join('')}`);
        response.send(_html);
    }
}
exports.SSRRender = SSRRender;
//# sourceMappingURL=ssr-render.js.map