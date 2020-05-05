"use strict";
var ID_MAIN = 'main';
var ID_MOCHA = 'mocha';
var URL_RESULT_HANDLER_JS = browser.runtime.getURL('/lib/scripts/page/handler_bundle.js');
var runResult = function () {
    var run = function (_a) {
        var code = _a.code;
        var node = document.getElementById(ID_MAIN);
        if (node != null) {
            node.innerHTML = code;
            var mocha_1 = document.getElementById(ID_MOCHA);
            if (mocha_1 != null)
                mocha_1.style.display = '';
        }
    };
    browser.runtime.onMessage.addListener(function (m) {
        if (m.type === 'run')
            run(m);
    });
};
runResult();
//# sourceMappingURL=init_result.js.map