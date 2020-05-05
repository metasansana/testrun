"use strict";
var runInit = function () {
    var ID_MOCHA = 'mocha';
    var ID_MOCHA_SCRIPT = 'testrun-mocha-script';
    var ID_TEST_SCRIPT = 'testrun-test-script';
    var URL_MOCHA_JS = browser.runtime.getURL('/public/mocha.js');
    var URL_HANDLER_JS = browser.runtime.getURL('/lib/scripts/page/handler_bundle.js');
    var removeElementById = function (w, id) {
        var e = w.document.getElementById(id);
        if (e != null) {
            if (e.parentNode != null)
                e.parentNode.removeChild(e);
        }
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
    var handleMessages = function (code) { return function (e) {
        if (e.data.type === 'mocha-ready') {
            window.postMessage({ type: 'exec', code: code }, '*');
        }
        else if (e.data.type === 'results') {
            browser.runtime.sendMessage(e.data);
        }
    }; };
    var run = function (_a) {
        var code = _a.code;
        removeElementById(window, ID_MOCHA);
        removeElementById(window, ID_MOCHA_SCRIPT);
        removeElementById(window, ID_TEST_SCRIPT);
        var b = window.document.body;
        b.appendChild(createDiv(window, 'display:none', ID_MOCHA));
        b.appendChild(createScript(window, URL_MOCHA_JS, ID_MOCHA_SCRIPT));
        b.appendChild(createScript(window, URL_HANDLER_JS, ID_TEST_SCRIPT));
        window.addEventListener('message', handleMessages(code));
    };
    browser.runtime.onMessage.addListener(function (m) {
        if (m.type === 'run')
            run(m);
    });
};
runInit();
//# sourceMappingURL=init.js.map