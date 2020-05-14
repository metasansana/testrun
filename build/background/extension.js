"use strict";
var tab = -1;
var url = '/src/app/public/index.html';
var handleErr = function (e) {
    alert('Error [B001]: Unable to create Testrun tab!');
    console.error(e);
};
browser.browserAction.onClicked.addListener(function (t) {
    tab = t.id;
    browser.runtime.onConnect.addListener(function (p) {
        p.postMessage({ id: t.id, type: 'testrun-target-tab' });
    });
    var conf = { url: url };
    browser.tabs.create(conf).catch(handleErr);
});
//# sourceMappingURL=extension.js.map