"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
///<reference path="../../../global.d.ts" />
var nodeMessages = require("@metasansana/testrun/lib/node/message");
var bgMessages = require("@metasansana/testrun/lib/background/message");
var columns = require("./columns");
var record_1 = require("@quenk/noni/lib/data/record");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var message_1 = require("@metasansana/testrun/lib/node/message");
var content_1 = require("@metasansana/testrun/lib/content");
var app_1 = require("./view/app");
exports.ID_MAIN = 'main';
exports.ID_MOCHA = 'mocha';
exports.ID_MOCHA_SCRIPT = 'testrun-mocha-script';
exports.ID_TEST_SCRIPT = 'testrun-test-script';
var ERR_NAME_UNSAFE = "E001: Script name must match: (" + nodeMessages.REGEX_SAFE_STRING + ")!";
var ERR_ARGS_UNSAFE = "E002: Script arguments must match: (" + nodeMessages.REGEX_SAFE_STRING + ")!";
var ERR_SCRIPT_PATH_NOT_SET = "E003: No path for cli scripts set!";
var ERR_LOAD_FILES_FAILED = "E004: Unable to load the file(s) specified!";
var ERR_NODE_RUNNER_UNAVAILABLE = "E005: The cli runner is unavailable!";
var MSG_TYPE_RESULTS = 'results';
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
        this.targetTab = maybe_1.nothing();
        this.background = browser.runtime.connect();
        this.node = browser.runtime.connectNative('testrun_native');
        this.nodeRunnerAvailable = true;
        this.values = {
            url: {
                name: 'url',
                label: 'App URL',
                value: '',
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
         * handleError alerts the user and dumps an error to the console.
         */
        this.handleError = function (e) {
            alert("Error: " + e.message);
            error(e);
        };
        /**
         * handleNodeDisconnect handles the disconnect of the native cli runner.
         */
        this.handleNodeDisconnect = function (p) {
            _this.nodeRunnerAvailable = false;
            if (p.error != null)
                _this.handleError(p.error);
            if (browser.runtime.lastError != null)
                _this.handleError(browser.runtime.lastError);
        };
        /**
         * handleMessage received from the message passing hooks.
         *
         * Messages may come from:
         * 1. Page scripts.
         * 2. Content scripts.
         * 3. Native scripts.
         * 4. This.
         */
        this.handleMessage = function (m) {
            var msg = m;
            switch (msg.type) {
                case MSG_TYPE_RESULTS:
                    _this.showResults(msg);
                    break;
                case nodeMessages.MSG_EXEC:
                    _this.runCLIScript(msg);
                    break;
                case nodeMessages.MSG_EXEC_FAIL:
                case nodeMessages.MSG_EXEC_RESULT:
                    if (_this.targetTab.isJust())
                        browser
                            .tabs
                            .sendMessage(_this.targetTab.get().id, msg);
                    break;
                case bgMessages.MSG_TARGET_TAB:
                    _this
                        .updateURLFromTab(m.id)
                        .catch(_this.handleError);
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
     * createTargetTab is used to create a new tab for testing.
     *
     * This is only used if we detect the targetTab is not set.
     */
    Testrun.prototype.createTargetTab = function () {
        var _this = this;
        return browser
            .tabs
            .create({ url: this.values.url.value })
            .then(function (tab) {
            _this.targetTab = maybe_1.just(tab);
            return tab;
        });
    };
    /**
     * updateURLFromTab attempts to update the target url using the tab
     * id specified.
     */
    Testrun.prototype.updateURLFromTab = function (id) {
        var _this = this;
        return browser
            .tabs
            .get(id)
            .then(function (t) {
            if (t.url != null) {
                _this.values.url.value = t.url;
                _this.view.invalidate();
            }
        });
    };
    /**
     * showResults parses the html from the results and displays it
     * in the main UI.
     */
    Testrun.prototype.xshowResults = function (msg) {
        var code = msg.value || '';
        browser
            .tabs
            .create({
            url: '/src/app/public/results.html'
        })
            .then(function (tab) {
            return content_1.execContentScriptFile(tab.id, '/build/content/initTestResultEnv.js')
                .then(function () {
                return browser
                    .tabs
                    .sendMessage(tab.id, {
                    type: 'run',
                    code: code
                });
            });
        })
            .catch(this.handleError);
    };
    Testrun.prototype.showResults = function (msg) {
        var _this = this;
        var code = msg.value || '';
        browser
            .tabs
            .create({
            url: '/src/app/public/results.html'
        })
            .then(function (tab) {
            return browser.tabs.onUpdated.addListener(function (id, changes) {
                if (tab.id === id)
                    if (changes.status === 'complete')
                        browser
                            .tabs
                            .sendMessage(id, {
                            type: 'run',
                            code: code
                        })
                            .catch(_this.handleError);
            });
        })
            .catch(this.handleError);
    };
    /**
     * show the application.
     */
    Testrun.prototype.show = function () {
        var main = this.window.document.getElementById(exports.ID_MAIN);
        if (main != null) {
            main.appendChild(this.view.render());
        }
        else {
            return this.handleError(new Error("Missing \"" + exports.ID_MAIN + "\" id in application document!"));
        }
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
     * runCLIScript on behalf of the running test.
     *
     * This method is the bridge between the injected script and the CLI
     * provided by this extension.
     */
    Testrun.prototype.runCLIScript = function (e) {
        if (!this.isScriptPathSet()) {
            this.handleMessage(new message_1.NewFail(e.id, ERR_SCRIPT_PATH_NOT_SET));
        }
        else if (!this.nodeRunnerAvailable) {
            this.handleMessage(new message_1.NewFail(e.id, ERR_NODE_RUNNER_UNAVAILABLE));
        }
        else {
            if (!message_1.isCLISafe(e.name))
                this.handleMessage(new message_1.NewFail(e.id, ERR_NAME_UNSAFE));
            else if (!message_1.isCLISafe(e.args))
                this.handleMessage(new message_1.NewFail(e.id, ERR_ARGS_UNSAFE));
            else
                this.node.postMessage(record_1.merge(e, {
                    name: this.values.exec.value + "/" + e.name
                }));
        }
    };
    /**
     * runSuite
     */
    Testrun.prototype.runSuite = function (s) {
        this
            .createTargetTab()
            .then(function (tab) {
            return content_1.execContentScriptFile(tab.id, '/build/content/initTestEnv.js')
                .then(function () {
                return browser
                    .tabs
                    .sendMessage(tab.id, {
                    type: 'run',
                    code: s.code
                });
            });
        })
            .catch(this.handleError);
    };
    /**
     * run the application.
     */
    Testrun.prototype.run = function () {
        browser.runtime.onMessage.addListener(this.handleMessage);
        this.node.onMessage.addListener(this.handleMessage);
        this.node.onDisconnect.addListener(this.handleNodeDisconnect);
        this.background.onMessage.addListener(this.handleMessage);
        this.show();
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
    return console.error("[Testrun]: " + e.message);
};
//# sourceMappingURL=index.js.map