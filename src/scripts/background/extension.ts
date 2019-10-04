
let tab: number = 0;

browser.browserAction.onClicked.addListener((t: { id: number }) => {

    tab = t.id;

    browser.windows.create({

        type: 'panel',

        url: 'public/index.html',

        width: 640,

        height: 512

    });

});
