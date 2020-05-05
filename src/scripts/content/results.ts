
const URL_MOCHA_CSS = '/public/mocha.css';

const runResults = () => {

    browser.tabs.insertCSS({

        file: URL_MOCHA_CSS

    });

}

runResults();
