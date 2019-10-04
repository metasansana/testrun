"use strict";
var tab = 0;
browser.browserAction.onClicked.addListener(function (t) {
    tab = t.id;
    browser.windows.create({
        type: 'panel',
        url: 'public/index.html',
        width: 640,
        height: 512
    });
});
//# sourceMappingURL=extension.js.map