"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSG_EXEC = 'testrun-exec-cli-script';
exports.MSG_EXEC_RESULT = 'testrun-exec-cli-script-result';
exports.MSG_EXEC_FAIL = 'testrun-exec-cli-script-error';
exports.REGEX_SAFE_STRING = /[\w]+/;
/**
 * NewExec constructor.
 */
var NewExec = /** @class */ (function () {
    function NewExec(id, name, args) {
        this.id = id;
        this.name = name;
        this.args = args;
        this.type = exports.MSG_EXEC;
    }
    return NewExec;
}());
exports.NewExec = NewExec;
/**
 * NewFail constructor.
 */
var NewFail = /** @class */ (function () {
    function NewFail(id, message) {
        this.id = id;
        this.message = message;
        this.type = exports.MSG_EXEC_FAIL;
    }
    return NewFail;
}());
exports.NewFail = NewFail;
/**
 * NewResult constructor.
 */
var NewResult = /** @class */ (function () {
    function NewResult(id, value) {
        this.id = id;
        this.value = value;
        this.type = exports.MSG_EXEC_RESULT;
    }
    return NewResult;
}());
exports.NewResult = NewResult;
/**
 * isCLISafe tests whether a string passed is "safe" for use on the cli.
 *
 * Safe in this regards means the string complies with REGEX_SAFE_STRING.
 */
exports.isCLISafe = function (value) {
    return value.split(' ').every(function (a) { return exports.REGEX_SAFE_STRING.test(a); });
};
//# sourceMappingURL=message.js.map