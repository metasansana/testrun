"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var columns = require("./columns");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var app_1 = require("./view/app");
exports.ID_MAIN = 'main';
exports.ID_MOCHA = 'mocha';
exports.ID_MOCHA_SCRIPT = 'testrun-mocha-script';
exports.ID_TEST_SCRIPT = 'testrun-test-script';
var MSG_LOAD_FILES_FAILED = 'Unable to load the file(s) specified!';
exports.MSG_NO_PARENT = 'Unable to find a parent window for this Testrun ' +
    'instance. It may be that you have accessed the Testrun index file directly.' +
    ' Close this window and run the Testrun extension on your app page or ' +
    ' alternatively you can load Testrun using window.open() from your app.';
exports.URL_MOCHA_JS = 'testrun/mocha.js';
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
        this.values = {
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
    }
    Testrun.create = function (w, a) {
        return new Testrun(w, a);
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
     * runSuite
     */
    Testrun.prototype.runSuite = function (s) {
        browser.tabs.sendMessage(this.tab, { type: 'run', code: s.code })
            .catch(function (e) { return alert(e.message); });
    };
    /**
     * run the application.
     */
    Testrun.prototype.run = function () {
        var _this = this;
        var main = this.window.document.getElementById(exports.ID_MAIN);
        if (main == null) {
            alert("Missing \"" + exports.ID_MAIN + "\" id in application document!");
        }
        else {
            browser.runtime.getBackgroundPage()
                .then(function (p) { _this.tab = p.tab; })
                .then(function () {
                browser.runtime.onMessage.addListener(function (m) {
                    if (m.type === 'results') {
                        var div = document.createElement('div');
                        div.innerHTML = m.value;
                        div.style.display = undefined;
                        _this.values.results.content = div;
                        _this.view.invalidate();
                    }
                });
                main.appendChild(_this.view.render());
            })
                .then(function () { return browser.tabs.executeScript(_this.tab, {
                file: '/lib/scripts/content/run_test.js'
            }); })
                .catch(function (e) { return alert(e.message); });
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
var loadFromFilesFailed = function () { alert(MSG_LOAD_FILES_FAILED); };
//# sourceMappingURL=index.js.map