"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
///<reference path="../../../global.d.ts" />
var nodeMessages = require("@metasansana/testrun/lib/node/message");
var columns = require("./columns");
var record_1 = require("@quenk/noni/lib/data/record");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var message_1 = require("@metasansana/testrun/lib/node/message");
var app_1 = require("./view/app");
exports.ID_MAIN = 'main';
exports.ID_MOCHA = 'mocha';
exports.ID_MOCHA_SCRIPT = 'testrun-mocha-script';
exports.ID_TEST_SCRIPT = 'testrun-test-script';
var ERR_NAME_UNSAFE = "E001: Script name must match: (" + nodeMessages.REGEX_SAFE_STRING + ")!";
var ERR_ARGS_UNSAFE = "E002: Script arguments must match: (" + nodeMessages.REGEX_SAFE_STRING + ")!";
var ERR_SCRIPT_PATH_NOT_SET = "E003: No path for cli scripts set!";
var ERR_LOAD_FILES_FAILED = "E004: Unable to load the file(s) specified!";
exports.URL_MOCHA_JS = 'testrun/mocha.js';
exports.MSG_TYPE_RESULTS = 'results';
/**
 * Testrun
 */
var Testrun = /** @class */ (function () {
    function Testrun(window, app) {
        var _this = this;
        this.window = window;
        this.app = app;
        this.view = new app_1.TestrunView(this);
        this.tab = -1;
        this.currentTab = maybe_1.nothing();
        this.runner = browser.runtime.connectNative('testrun_native');
        this.values = {
            url: {
                name: 'url',
                label: 'App URL',
                value: 'http://localhost:8080',
                onChange: function (e) {
                    _this.values.url.value = e.value;
                }
            },
            exec: {
                name: 'exec',
                label: 'Exec CLI Script Path',
                value: '',
                onChange: function (e) {
                    _this.values.exec.value = e.value;
                }
            },
            files: {
                text: 'Select test files',
                multiple: true,
                onChange: function (e) {
                    _this.loadFromFiles(e.value);
                }
            },
            table: {
                data: [],
                columns: [
                    new columns.NameColumn(),
                    new columns.ActionColumn(function (id) {
                        _this.runSuite(_this.values.table.data[id]);
                    })
                ]
            },
            results: {
                content: document.createElement('div')
            }
        };
        /**
         * handleMessage dispatches messages received via the postMessage() api.
         */
        this.handleMessage = function (m) {
            var msg = m;
            switch (msg.type) {
                case exports.MSG_TYPE_RESULTS:
                    _this.showResults(msg);
                    break;
                case nodeMessages.MSG_EXEC:
                    _this.runCLIScript(msg);
                    break;
                case nodeMessages.MSG_EXEC_FAIL:
                case nodeMessages.MSG_EXEC_RESULT:
                    if (_this.currentTab.isJust())
                        browser
                            .tabs
                            .sendMessage(_this.currentTab.get().id, msg);
                    break;
                default:
                    warn("Ignoring unknown message: " + JSON.stringify(msg) + ".");
                    break;
            }
        };
    }
    Testrun.create = function (w, a) {
        return new Testrun(w, a);
    };
    /**
     * isScriptPathSet detects whether the user has specified a path to read
     * "execCLIScript" targets from.
     */
    Testrun.prototype.isScriptPathSet = function () {
        return this.values.exec.value !== '';
    };
    /**
     * @private
     */
    Testrun.prototype.loadFromFiles = function (list) {
        var _this = this;
        file2Suites(list).fork(loadFromFilesFailed, function (s) {
            _this.values.table.data = s;
            _this.view.invalidate();
        });
    };
    /**
     * @private
     */
    Testrun.prototype.clearSuite = function () {
        removeElementById(this.app, exports.ID_MOCHA);
        removeElementById(this.app, exports.ID_MOCHA_SCRIPT);
        removeElementById(this.app, exports.ID_TEST_SCRIPT);
    };
    /**
     * @private
     */
    Testrun.prototype.runMocha = function (f) {
        this.app.mocha.run().on('end', f);
    };
    /**
     * showResults parses the html from the results and displays it
     * in the main UI.
     */
    Testrun.prototype.showResults = function (msg) {
        var _this = this;
        var code = msg.value || '';
        browser
            .tabs
            .create({
            url: '/src/app/public/results.html'
        })
            .then(function (tab) {
            return browser
                .tabs
                .executeScript(tab.id, {
                file: '/build/content/init_result.js'
            })
                .then(function () {
                return browser
                    .tabs
                    .sendMessage(tab.id, {
                    type: 'run',
                    code: code
                });
            });
        })
            .catch(function (e) { return _this.showError(e); });
    };
    /**
     * showError alerts the user and dumps an error to the console.
     */
    Testrun.prototype.showError = function (e) {
        alert("Error: " + e.message);
        error(e);
    };
    /**
     * runCLIScript on behalf of the running test.
     *
     * This method is the bridge between the injected script and the CLI
     * provided by this extension.
     */
    Testrun.prototype.runCLIScript = function (e) {
        if (this.isScriptPathSet()) {
            this.handleMessage(new message_1.NewFail(e.id, ERR_SCRIPT_PATH_NOT_SET));
        }
        else {
            if (!message_1.isCLISafe(e.name))
                this.handleMessage(new message_1.NewFail(e.id, ERR_NAME_UNSAFE));
            else if (!message_1.isCLISafe(e.args))
                this.handleMessage(new message_1.NewFail(e.id, ERR_ARGS_UNSAFE));
            else
                this.runner.postMessage(record_1.merge(e, {
                    name: this.values.exec.value + "/" + e.name
                }));
        }
    };
    /**
     * runSuite
     */
    Testrun.prototype.runSuite = function (s) {
        var _this = this;
        browser.runtime.onMessage.addListener(this.handleMessage);
        browser
            .tabs
            .create({ url: this.values.url.value })
            .then(function (tab) {
            _this.currentTab = maybe_1.just(tab);
            return tab;
        })
            .then(function (tab) {
            return browser
                .tabs
                .executeScript(tab.id, {
                file: '/build/content/init.js'
            })
                .then(function () {
                return browser
                    .tabs
                    .sendMessage(tab.id, {
                    type: 'run',
                    code: s.code
                });
            });
        })
            .catch(function (e) { return _this.showError(e); });
    };
    /**
     * run the application.
     */
    Testrun.prototype.run = function () {
        var main = this.window.document.getElementById(exports.ID_MAIN);
        if (main != null) {
            main.appendChild(this.view.render());
            this.runner.onMessage.addListener(this.handleMessage);
        }
        else {
            return this.showError(new Error("Missing \"" + exports.ID_MAIN + "\" id in application document!"));
        }
    };
    return Testrun;
}());
exports.Testrun = Testrun;
var file2Suites = function (files) {
    return readFiles(files).map(_2Suites(files));
};
var _2Suites = function (files) { return function (srcs) {
    return srcs.map(function (code, i) { return ({ name: files[i].name, code: code }); });
}; };
var readFiles = function (files) {
    return future_1.parallel(files.map(function (f) { return future_1.fromCallback(function (cb) {
        var r = new FileReader();
        r.onerror = function () { return cb(new Error('Read Error')); };
        r.onload = function () { return cb(undefined, r.result); };
        r.readAsText(f);
    }); }));
};
var getElementById = function (w, id) {
    return maybe_1.fromNullable(w.document.getElementById(id));
};
var removeElementById = function (w, id) {
    return getElementById(w, id)
        .map(function (e) {
        if (e.parentNode != null)
            e.parentNode.removeChild(e);
    });
};
var loadFromFilesFailed = function () { alert(ERR_LOAD_FILES_FAILED); };
var warn = function (msg) {
    return console.warn("[Testrun]: " + msg);
};
var error = function (e) {
    return console.error("[Testrun]: " + e.message, e);
};
//# sourceMappingURL=index.js.map