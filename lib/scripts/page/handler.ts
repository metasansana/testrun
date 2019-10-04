
function main() {

    const ID_TESTRUN_TEST = 'test-run-test';

    const runMocha = ({ code }: { code: string }) => {

        let prev = document.getElementById(ID_TESTRUN_TEST);

        if ((prev != null) && (prev.parentNode != null))
            prev.parentNode.removeChild(prev);

        let tag = document.createElement('script');

        let text = document.createTextNode(code);

        tag.setAttribute('id', ID_TESTRUN_TEST);

        tag.appendChild(text);

        document.body.appendChild(tag);

        window.mocha.run().on('end', function() {

            let results = window.document.getElementById('mocha');

            if (results == null) {

                alert('Missing results div!');

            } else {

                let value = results.outerHTML;

                window.postMessage({ type: 'results', value }, '*');

            }

        })

    }

    window.addEventListener('message', e => {

        //TODO: This is unsafe as we are not verifying the source of these messages.
        //     A solution must be found in future releases!.

        if (e.source === window) {

            if (e.data.type === 'run')
                runMocha(e.data);

        }

    });

    //XXX: There seems to be a race condition between mocha being available
    //     and the code we run below.
    setTimeout(() => {

        window.mocha.setup({ ui: 'bdd' });

        window.postMessage({ type: 'mocha-ready' }, '*');

    }, 1000);

}

main();
