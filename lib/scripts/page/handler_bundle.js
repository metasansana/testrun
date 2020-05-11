(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
(function () {
    var ID_TESTRUN_TEST = 'test-run-test';
    var MSG_EXEC = 'testrun-exec-cli-script';
    var MSG_EXEC_RESULT = 'testrun-exec-cli-script-result';
    var MSG_EXEC_ERROR = 'testrun-exec-cli-script-error';
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
    var pending = [];
    window.execCLIScript = function (name, args, cb) {
        var id = pending.push(cb) - 1;
        var type = MSG_EXEC;
        var detail = {
            id: id,
            type: type,
            name: name,
            args: String(args)
        };
        var evt = new CustomEvent(type, { detail: detail });
        window.document.documentElement.dispatchEvent(evt);
    };
    var handleCLIScriptResult = function (evt) {
        if (evt.detail)
            if ((evt.detail.type === MSG_EXEC_RESULT) ||
                (evt.detail.type === MSG_EXEC_ERROR)) {
                var cb = pending[evt.detail.id];
                if (cb != null) {
                    pending.splice(evt.detail.id, 1);
                    if (evt.detail.type === MSG_EXEC_ERROR) {
                        cb(new Error(evt.detail.message));
                    }
                    else {
                        cb(undefined, evt.detail.value);
                    }
                }
            }
    };
    window
        .document
        .documentElement
        .addEventListener(MSG_EXEC_RESULT, handleCLIScriptResult);
    window
        .document
        .documentElement
        .addEventListener(MSG_EXEC_ERROR, handleCLIScriptResult);
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
})();

},{}]},{},[1]);
