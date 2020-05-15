"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCRIPT_INIT_TEST_ENV = '/build/content/initTestEnv.js';
exports.SCRIPT_INIT_TEST_RESULT_ENV = '/build/content/initTestResultEnv.js';
/**
 * execContentScriptFile executes a content script using an extension file
 * path.
 *
 * This function preloads the chrome polyfill before execution.
 */
exports.execContentScriptFile = function (id, file) {
    return browser
        .tabs
        .executeScript(id, { file: '/vendor/browser-polyfill.js' })
        .then(function () {
        return browser
            .tabs
            .executeScript(id, { file: file });
    })
        .then(function () { return Promise.resolve(); });
};
//# sourceMappingURL=index.js.map