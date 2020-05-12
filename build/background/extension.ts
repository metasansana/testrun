
let tab: number = -1;

browser.browserAction.onClicked.addListener((t: browser.tabs.Tab) => {

    tab = <number>t.id;

    browser.tabs.create({

        url: '/src/app/public/index.html',

    });

});
