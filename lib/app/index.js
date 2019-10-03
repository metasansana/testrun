"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var columns = require("./columns");
var record_1 = require("@quenk/noni/lib/data/record");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var app_1 = require("./view/app");
exports.ID_MAIN = 'main';
exports.ID_MOCHA = 'mocha';
exports.ID_MOCHA_SCRIPT = 'testrun-mocha-script';
exports.ID_TEST_SCRIPT = 'testrun-test-script';
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
        this.values = {
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
    Testrun.prototype.loadGlobalSuites = function () {
        this.values.table.data = getGlobalSuites(this.window);
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
     * runSuite will run the code of the selected suite in the context
     * of the application window.
     */
    Testrun.prototype.runSuite = function (s) {
        var _this = this;
        //will have to be modified for extensions
        this.clearSuite();
        var b = getBody(this.app);
        b.appendChild(createScript(this.app, exports.URL_MOCHA_JS, exports.ID_MOCHA_SCRIPT));
        b.appendChild(createDiv(this.app, 'display:none', exports.ID_MOCHA));
        wait(1000, function () {
            _this.app.mocha.setup({ ui: 'bdd' });
            b.appendChild(createIScript(_this.app, s.code));
            wait(1000, function () { return _this.runMocha(function () {
                var mResults = getElementById(_this.app, exports.ID_MOCHA);
                if (mResults.isNothing()) {
                    alert('Missing results div!');
                }
                else {
                    var results = mResults.get();
                    _this.window.document.adoptNode(results);
                    results.style.display = 'unset';
                    _this.values.results.content = results;
                    _this.view.invalidate();
                }
            }); });
        });
    };
    /**
     * check the environment to ensure Testrun was initailzed correctly.
     */
    Testrun.prototype.check = function () {
        if (this.app == null) {
            alert(exports.MSG_NO_PARENT);
            return false;
        }
        return true;
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
            //give DOM time to change.
            wait(1000, function () {
                _this.loadGlobalSuites();
                main.appendChild(_this.view.render());
            });
        }
    };
    return Testrun;
}());
exports.Testrun = Testrun;
var wait = function (n, f) { return setTimeout(f, n); };
var getGlobalSuites = function (w) { return (w.TESTRUN_SUITES != null) ?
    record_1.reduce(w.TESTRUN_SUITES, [], function (p, code, name) {
        return p.concat({ name: name, code: atob(code) });
    }) : []; };
var getBody = function (w) {
    return w.document.body;
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
var createDiv = function (w, style, id) {
    var div = w.document.createElement('div');
    if (style)
        div.setAttribute('style', style);
    if (id)
        div.setAttribute('id', id);
    return div;
};
var createScript = function (w, src, id) {
    var script = w.document.createElement('script');
    script.setAttribute('src', src);
    if (id)
        script.setAttribute('id', id);
    return script;
};
var createIScript = function (w, code, id) {
    var script = w.document.createElement('script');
    var text = w.document.createTextNode(code);
    script.appendChild(text);
    if (id)
        script.setAttribute('id', id);
    return script;
};
//# sourceMappingURL=index.js.map