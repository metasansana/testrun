
let tab: number = -1;
let url = '/src/app/public/index.html';

const handleErr = (e: Error) => {

    alert('Error [B001]: Unable to create Testrun tab!');
    console.error(e);

}

browser.browserAction.onClicked.addListener((t: browser.tabs.Tab) => {

    tab = <number>t.id;

    browser.runtime.onConnect.addListener((p: browser.runtime.Port) => {

        p.postMessage({ id: t.id, type: 'testrun-target-tab' });

    });

    let conf = { url };

    browser.tabs.create(conf).catch(handleErr);

});
