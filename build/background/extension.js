"use strict";
var tab = -1;
browser.browserAction.onClicked.addListener(function (t) {
    tab = t.id;
    browser.tabs.create({
        url: '/src/app/public/index.html',
    });
});
//# sourceMappingURL=extension.js.map