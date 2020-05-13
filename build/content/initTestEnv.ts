///<reference path="../../global.d.ts" />
(() => {

    const MSG_EXEC_RESULT = 'testrun-exec-cli-script-result';

    const MSG_EXEC_ERROR = 'testrun-exec-cli-script-error';

    const ID_MOCHA = 'mocha';

    const ID_MOCHA_SCRIPT = 'testrun-mocha-script';

    const ID_RUNNER_SCRIPT = 'testrun-runner';

    const ID_TEST_SCRIPT = 'testrun-test-script';

    const URL_MOCHA_JS = browser.runtime.getURL('/src/app/public/mocha.js');

    const URL_RUNNER_JS = browser.runtime.getURL('/src/app/public/runner.js');

    const URL_HANDLER_JS = browser.runtime.getURL(
        '/build/page/handler_bundle.js');

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

    const handleMessages = (code: string) => (e: { data: any }) => {

        if (e.data.type === 'mocha-ready') {

            window.postMessage({ type: 'exec', code }, '*');

        } else if (e.data.type === 'results') {

            browser.runtime.sendMessage(e.data);

        }

    }

    const dispatchEvent = (name: string, obj: object) => {

        let detail = (cloneInto != null) ?
            cloneInto(obj, window) : obj;

        let evt = new CustomEvent(name, { detail });

        window
            .document
            .documentElement
            .dispatchEvent(evt);

    }

    const run = ({ code }: { code: string }) => {

        removeElementById(window, ID_MOCHA);

        removeElementById(window, ID_MOCHA_SCRIPT);

        removeElementById(window, ID_RUNNER_SCRIPT);

        removeElementById(window, ID_TEST_SCRIPT);

        let b = window.document.body;

        b.appendChild(createDiv(window, 'display:none', ID_MOCHA));

        b.appendChild(createScript(window, URL_MOCHA_JS, ID_MOCHA_SCRIPT));

        b.appendChild(createScript(window, URL_RUNNER_JS, ID_RUNNER_SCRIPT));

        b.appendChild(createScript(window, URL_HANDLER_JS, ID_TEST_SCRIPT));

        window.addEventListener('message', handleMessages(code));

        window
            .document
            .documentElement
            .addEventListener('testrun-exec-cli-script', (e: any) => {

                browser.runtime.sendMessage(e.detail);

            });

    }

    browser.runtime.onMessage.addListener((m: any) => {

        switch (m.type) {

            case 'run':
                run(m);
                break;

            case MSG_EXEC_RESULT:
            case MSG_EXEC_ERROR:
                dispatchEvent(m.type, m);
                break;

            default:
                break;

        }

    });

})();
