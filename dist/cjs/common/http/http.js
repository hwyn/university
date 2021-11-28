"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const tslib_1 = require("tslib");
const _di_1 = require("@di");
const rxjs_1 = require("rxjs");
const token_1 = require("../../token");
function factoryRequest(fetch, method, parseData) {
    return (url, params) => {
        const subject = new rxjs_1.Subject();
        fetch(url, { method, ...params })
            .then(parseData)
            .then(data => subject.next(data))
            .catch((error) => subject.error(error))
            .finally(() => subject.complete());
        return subject;
    };
}
let HttpClient = class HttpClient {
    fetch;
    constructor(fetch) {
        this.fetch = fetch;
    }
    get(url, params) {
        return factoryRequest(this.fetch, 'get', (res) => res.json())(url, params);
    }
    getText(url, params) {
        return factoryRequest(this.fetch, 'get', (res) => res.text())(url, params);
    }
};
HttpClient = (0, tslib_1.__decorate)([
    (0, _di_1.Injectable)(),
    (0, tslib_1.__param)(0, (0, _di_1.Inject)(token_1.FETCH_TOKEN)),
    (0, tslib_1.__metadata)("design:paramtypes", [Function])
], HttpClient);
exports.HttpClient = HttpClient;
//# sourceMappingURL=http.js.map