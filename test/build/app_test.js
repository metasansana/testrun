"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert_1 = require("@quenk/test/lib/assert");
describe('button', function () {
    describe('button0', function () {
        it('should be disabled', function () {
            var e = document.getElementById('button0');
            assert_1.assert(e.disabled).true();
        });
        it('should execute cli scripts', function (done) {
            window.execCLIScript('echo', 'hello', function (e, msg) {
                try {
                    assert_1.assert(e).undefined();
                    assert_1.assert(msg).equal('hello');
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
        it('should not execute unknown cli scripts', function (done) {
            window.execCLIScript('tree', '/', function (e, _) {
                try {
                    assert_1.assert(e).not.undefined();
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });
});
//# sourceMappingURL=app_test.js.map