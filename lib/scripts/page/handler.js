"use strict";
function main() {
    var ID_TESTRUN_TEST = 'test-run-test';
    var runMocha = function (_a) {
        var code = _a.code;
        var prev = document.getElementById(ID_TESTRUN_TEST);
        if ((prev != null) && (prev.parentNode != null))
            prev.parentNode.removeChild(prev);
        var tag = document.createElement('script');
        var text = document.createTextNode(code);
        tag.setAttribute('id', ID_TESTRUN_TEST);
        //TODO: handle errors here when the parsing the script fails.
        tag.appendChild(text);
        document.body.appendChild(tag);
        window.mocha.run().on('end', function () {
            var results = window.document.getElementById('mocha');
            if (results == null) {
                alert('Missing results div!');
            }
            else {
                var value = results.outerHTML;
                window.postMessage({ type: 'results', value: value }, '*');
            }
        });
    };
    window.addEventListener('message', function (e) {
        //TODO: This is unsafe as we are not verifying the source of these messages.
        //     A solution must be found in future releases!.
        if (e.source === window) {
            if (e.data.type === 'exec')
                runMocha(e.data);
        }
        else {
            console.warn("Ignoring messsage: " + JSON.stringify(e.data) + " " +
                "from unknown window source!");
        }
    });
    //XXX: There seems to be a race condition between mocha being available
    //     and the code we run below.
    setTimeout(function () {
        window.mocha.setup({ ui: 'bdd' });
        window.postMessage({ type: 'mocha-ready' }, '*');
    }, 1000);
}
main();
//# sourceMappingURL=handler.js.map