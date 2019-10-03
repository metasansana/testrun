"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert_1 = require("@quenk/test/lib/assert");
describe('button', function () {
    describe('button0', function () {
        it('should be disabled', function () {
            var e = document.getElementById('button0');
            assert_1.assert(e.disabled).true();
        });
    });
});
//# sourceMappingURL=app_test.js.map