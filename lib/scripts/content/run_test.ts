
function runTest() {

    const ID_MOCHA = 'mocha';

    const ID_MOCHA_SCRIPT = 'testrun-mocha-script';

    const ID_TEST_SCRIPT = 'testrun-test-script';

    const URL_MOCHA_JS = browser.runtime.getURL('/public/mocha.js');

    const URL_HANDLER_JS = browser.runtime.getURL('/lib/scripts/page/handler.js');

    const removeElementById = (w: Window, id: string) => {

        let e = w.document.getElementById(id);

        if (e != null) {

            if (e.parentNode != null)
                e.parentNode.removeChild(e);

        }

    };

    const createDiv = (w: Window, style?: string, id?: string) => {

        let div = w.document.createElement('div');

        if (style) div.setAttribute('style', style);

        if (id) div.setAttribute('id', id);

        return div;

    }

    const createScript = (w: Window, src: string, id?: string) => {

        let script = w.document.createElement('script');

        script.setAttribute('src', src);

        if (id) script.setAttribute('id', id);

        return script;

    }

    const handleMessagess = (code: string) => (e: { data: any }) => {

        if (e.data.type === 'mocha-ready') {

            window.postMessage({ type: 'run', code }, '*');

        } else if (e.data.type === 'results') {

            browser.runtime.sendMessage(e.data);

        }

    }

    const run = ({ code }: { code: string }) => {

        removeElementById(window, ID_MOCHA);

        removeElementById(window, ID_MOCHA_SCRIPT);

        removeElementById(window, ID_TEST_SCRIPT);

        let b = window.document.body;

        b.appendChild(createScript(window, URL_MOCHA_JS, ID_MOCHA_SCRIPT));

        b.appendChild(createScript(window, URL_HANDLER_JS, ID_MOCHA_SCRIPT));

        b.appendChild(createDiv(window, 'display:none', ID_MOCHA));

        window.addEventListener('message', handleMessagess(code));

    }

    browser.runtime.onMessage.addListener((m: any) => {

        if (m.type === 'run') run(m);

    });

}

runTest();
