(() => {

    const URL_MOCHA_CSS = '/src/app/public/mocha.css';

    browser.tabs.insertCSS({

        file: URL_MOCHA_CSS

    });

})();
