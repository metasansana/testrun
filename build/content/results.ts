(() => {

    const URL_MOCHA_CSS = '/lib/app/public/mocha.css';

    browser.tabs.insertCSS({

        file: URL_MOCHA_CSS

    });

})();
