
const ID_MAIN = 'main';
const ID_MOCHA = 'mocha';

const URL_RESULT_HANDLER_JS =
    browser.runtime.getURL('/lib/scripts/page/handler_bundle.js');

const runResult = () => {

    const run = ({ code }: { code: string }) => {

        let node = document.getElementById(ID_MAIN);

        if (node != null) {

            node.innerHTML = code;

            let mocha = document.getElementById(ID_MOCHA);

            if (mocha != null)
                mocha.style.display = '';

        }

    }

    browser.runtime.onMessage.addListener((m: any) => {

        if (m.type === 'run') run(m);

    });

}

runResult();
