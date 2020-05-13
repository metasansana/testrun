(() => {

    const ID_MAIN = 'main';

    const ID_MOCHA = 'mocha';

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

})();
