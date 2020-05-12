(() => {

    const ID_TESTRUN_TEST = 'test-run-test';

    const MSG_EXEC = 'testrun-exec-cli-script';

    const MSG_EXEC_RESULT = 'testrun-exec-cli-script-result';

    const MSG_EXEC_ERROR = 'testrun-exec-cli-script-error';

    const runMocha = ({ code }: { code: string }) => {

        let prev = document.getElementById(ID_TESTRUN_TEST);

        if ((prev != null) && (prev.parentNode != null))
            prev.parentNode.removeChild(prev);

        let tag = document.createElement('script');

        let text = document.createTextNode(code);

        tag.setAttribute('id', ID_TESTRUN_TEST);

        //TODO: handle errors here when the parsing the script fails.
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

    let pending = <Callback[]>[];

    window.execCLIScript = function(name: string, args: string, cb: Callback) {

        let id = pending.push(cb) - 1;

        let type = MSG_EXEC;

        let detail = {

            id: id,

            type,

            name,

            args: String(args)

        };

        let evt = new CustomEvent(type, { detail });

        window.document.documentElement.dispatchEvent(evt);

    };

    const handleCLIScriptResult = (evt: any) => {

        if (evt.detail)
            if ((evt.detail.type === MSG_EXEC_RESULT) ||
                (evt.detail.type === MSG_EXEC_ERROR)) {

                var cb = pending[evt.detail.id];

                if (cb != null) {

                    pending.splice(evt.detail.id, 1);

                    if (evt.detail.type === MSG_EXEC_ERROR) {

                        cb(new Error(evt.detail.message));

                    } else {

                        cb(undefined, evt.detail.value);

                    }

                }

            }

    }

    window
        .document
        .documentElement
        .addEventListener(MSG_EXEC_RESULT, handleCLIScriptResult);

    window
        .document
        .documentElement
        .addEventListener(MSG_EXEC_ERROR, handleCLIScriptResult);

    window.addEventListener('message', e => {

        //TODO: This is unsafe as we are not verifying the source of these messages.
        //     A solution must be found in future releases!.

        if (e.source === window) {

            if (e.data.type === 'exec')
                runMocha(e.data);

        } else {

            console.warn(`Ignoring messsage: ${JSON.stringify(e.data)} ` +
                `from unknown window source!`);

        }

    });

    //XXX: There seems to be a race condition between mocha being available
    //     and the code we run below.
    setTimeout(() => {

        window.mocha.setup({ ui: 'bdd' });
        window.postMessage({ type: 'mocha-ready' }, '*');

    }, 1000);

})();
