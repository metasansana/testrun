
(function () {

    var pending = [];

    window.execCLIScript = function(name, args, cb) {

        var id = pending.push(cb) - 1;

        window.postMessage({

            id: id,

            type: 'testrun-exec-cli-script',

            name: name,

            args: String(args)

        });

    };

    window.addEventListener('message', function(evt) {

        //{ data: {id,type,value} }
        if(evt.source == window && evt.data)
            if(evt.data.type === 'testrun-exec-cli-script-result') {

                var cb = pending[evt.data.id];

                if(cb != null) {

                    pending.splice(evt.data.id, 1);

                    cb(evt.data.value);

                }

            }

    });

})();
