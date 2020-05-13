(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
/**
 * This module provides functions and types to make dealing with ES errors
 * easier.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/** imports */
var either_1 = require("../data/either");
/**
 * convert an Err to an Error.
 */
exports.convert = function (e) {
    return (e instanceof Error) ? e : new Error(e.message);
};
/**
 * raise the supplied Error.
 *
 * This function exists to maintain a functional style in situations where
 * you may actually want to throw an error.
 */
exports.raise = function (e) {
    if (e instanceof Error) {
        throw e;
    }
    else {
        throw new Error(e.message);
    }
};
/**
 * attempt a synchronous computation that may throw an exception.
 */
exports.attempt = function (f) {
    try {
        return either_1.right(f());
    }
    catch (e) {
        return either_1.left(e);
    }
};

},{"../data/either":6}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var timer_1 = require("../timer");
var function_1 = require("../../data/function");
var error_1 = require("../error");
var Future = /** @class */ (function () {
    function Future() {
    }
    Future.prototype.of = function (a) {
        return new Pure(a);
    };
    Future.prototype.map = function (f) {
        return new Bind(this, function (value) { return new Pure(f(value)); });
    };
    Future.prototype.ap = function (ft) {
        return new Bind(this, function (value) { return ft.map(function (f) { return f(value); }); });
    };
    Future.prototype.chain = function (f) {
        return new Bind(this, f);
    };
    Future.prototype.catch = function (f) {
        return new Catch(this, f);
    };
    Future.prototype.finally = function (f) {
        return new Finally(this, f);
    };
    Future.prototype.fork = function (onError, onSuccess) {
        return (new Compute(undefined, onError, onSuccess, [this])).run();
    };
    /**
     * __trap
     * @private
     */
    Future.prototype.__trap = function (_, __) {
        return false;
    };
    return Future;
}());
exports.Future = Future;
/**
 * Pure constructor.
 */
var Pure = /** @class */ (function (_super) {
    __extends(Pure, _super);
    function Pure(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Pure.prototype.map = function (f) {
        return new Pure(f(this.value));
    };
    Pure.prototype.ap = function (ft) {
        var _this = this;
        return ft.map(function (f) { return f(_this.value); });
    };
    Pure.prototype.__exec = function (c) {
        c.value = this.value;
        timer_1.tick(function () { return c.run(); });
        return false;
    };
    return Pure;
}(Future));
exports.Pure = Pure;
/**
 * Bind constructor.
 * @private
 */
var Bind = /** @class */ (function (_super) {
    __extends(Bind, _super);
    function Bind(future, func) {
        var _this = _super.call(this) || this;
        _this.future = future;
        _this.func = func;
        return _this;
    }
    Bind.prototype.__exec = function (c) {
        //XXX: find a way to do this without any someday.
        c.stack.push(new Step(this.func));
        c.stack.push(this.future);
        return true;
    };
    return Bind;
}(Future));
exports.Bind = Bind;
/**
 * Step constructor.
 * @private
 */
var Step = /** @class */ (function (_super) {
    __extends(Step, _super);
    function Step(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Step.prototype.__exec = function (c) {
        c.stack.push(this.value(c.value));
        return true;
    };
    return Step;
}(Future));
exports.Step = Step;
/**
 * Catch constructor.
 * @private
 */
var Catch = /** @class */ (function (_super) {
    __extends(Catch, _super);
    function Catch(future, func) {
        var _this = _super.call(this) || this;
        _this.future = future;
        _this.func = func;
        return _this;
    }
    Catch.prototype.__exec = function (c) {
        c.stack.push(new Trap(this.func));
        c.stack.push(this.future);
        return true;
    };
    return Catch;
}(Future));
exports.Catch = Catch;
/**
 * Finally constructor.
 * @private
 */
var Finally = /** @class */ (function (_super) {
    __extends(Finally, _super);
    function Finally(future, func) {
        var _this = _super.call(this) || this;
        _this.future = future;
        _this.func = func;
        return _this;
    }
    Finally.prototype.__exec = function (c) {
        c.stack.push(new Trap(this.func));
        c.stack.push(new Step(this.func));
        c.stack.push(this.future);
        return true;
    };
    return Finally;
}(Future));
exports.Finally = Finally;
/**
 * Trap constructor.
 * @private
 */
var Trap = /** @class */ (function (_super) {
    __extends(Trap, _super);
    function Trap(func) {
        var _this = _super.call(this) || this;
        _this.func = func;
        return _this;
    }
    Trap.prototype.__exec = function (_) {
        return true;
    };
    Trap.prototype.__trap = function (e, c) {
        c.stack.push(this.func(e));
        return true;
    };
    return Trap;
}(Future));
exports.Trap = Trap;
/**
 * Raise constructor.
 */
var Raise = /** @class */ (function (_super) {
    __extends(Raise, _super);
    function Raise(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Raise.prototype.map = function (_) {
        return new Raise(this.value);
    };
    Raise.prototype.ap = function (_) {
        return new Raise(this.value);
    };
    Raise.prototype.chain = function (_) {
        return new Raise(this.value);
    };
    Raise.prototype.__exec = function (c) {
        var finished = false;
        var e = error_1.convert(this.value);
        while (!finished) {
            if (c.stack.length === 0) {
                c.exitError(e);
                return false;
            }
            else {
                finished = c.stack.pop().__trap(e, c);
            }
        }
        return finished;
    };
    return Raise;
}(Future));
exports.Raise = Raise;
/**
 * Run constructor.
 * @private
 */
var Run = /** @class */ (function (_super) {
    __extends(Run, _super);
    function Run(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Run.prototype.__exec = function (c) {
        c.running = true;
        c.canceller = this.value(c);
        return false;
    };
    return Run;
}(Future));
exports.Run = Run;
/**
 * Compute represents the workload of a forked Future.
 *
 * Results are computed sequentially and ends with either a value,
 * error or prematurely via the abort method.
 */
var Compute = /** @class */ (function () {
    function Compute(value, exitError, exitSuccess, stack) {
        this.value = value;
        this.exitError = exitError;
        this.exitSuccess = exitSuccess;
        this.stack = stack;
        this.canceller = function_1.noop;
        this.running = false;
    }
    /**
     * onError handler.
     *
     * This method will a 'Raise' instruction at the top of the stack
     * and continue execution.
     */
    Compute.prototype.onError = function (e) {
        if (this.running === false)
            return;
        this.stack.push(new Raise(e));
        this.running = false;
        this.run();
    };
    /**
     * onSuccess handler.
     *
     * Stores the resulting value and continues the execution.
     */
    Compute.prototype.onSuccess = function (value) {
        if (this.running === false)
            return;
        this.value = value;
        this.running = false;
        this.run();
    };
    /**
     * abort this Compute.
     *
     * Aborting a Compute will immediately clear its stack
     * and invoke the canceller for the currently executing Future.
     */
    Compute.prototype.abort = function () {
        this.stack = [];
        this.exitError = function_1.noop;
        this.exitSuccess = function_1.noop;
        this.running = false;
        this.canceller();
        this.canceller = function_1.noop;
    };
    Compute.prototype.run = function () {
        while (this.stack.length > 0) {
            var next = this.stack.pop();
            if ((next == null) || (typeof next.__exec !== 'function')) {
                try {
                    throw new Error("Invalid Compute stack member: \"" + next + "\"!");
                }
                catch (e) {
                    this.onError(e);
                    return this;
                }
            }
            if (!next.__exec(this))
                return this; // short-circuit
        }
        this.running = false;
        this.exitSuccess(this.value);
        return this;
    };
    return Compute;
}());
exports.Compute = Compute;
/**
 * pure wraps a synchronous value in a Future.
 */
exports.pure = function (a) { return new Pure(a); };
/**
 * raise wraps an Error in a Future.
 *
 * This future will be considered a failure.
 */
exports.raise = function (e) { return new Raise(e); };
/**
 * attempt a synchronous task, trapping any thrown errors in the Future.
 */
exports.attempt = function (f) { return new Run(function (s) {
    timer_1.tick(function () { try {
        s.onSuccess(f());
    }
    catch (e) {
        s.onError(e);
    } });
    return function_1.noop;
}); };
/**
 * delay execution of a function f after n milliseconds have passed.
 *
 * Any errors thrown are caught and processed in the Future chain.
 */
exports.delay = function (f, n) {
    if (n === void 0) { n = 0; }
    return new Run(function (s) {
        setTimeout(function () {
            try {
                s.onSuccess(f());
            }
            catch (e) {
                s.onError(e);
            }
        }, n);
        return function_1.noop;
    });
};
/**
 * wait n milliseconds before continuing the Future chain.
 */
exports.wait = function (n) {
    return new Run(function (s) {
        setTimeout(function () { s.onSuccess(undefined); }, n);
        return function_1.noop;
    });
};
/**
 * fromAbortable takes an Aborter and a node style async function and
 * produces a Future.
 *
 * Note: The function used here is not called in the "next tick".
 */
exports.fromAbortable = function (abort) { return function (f) { return new Run(function (s) {
    f(function (err, a) {
        return (err != null) ? s.onError(err) : s.onSuccess(a);
    });
    return abort;
}); }; };
/**
 * fromCallback produces a Future from a node style async function.
 *
 * Note: The function used here is not called in the "next tick".
 */
exports.fromCallback = function (f) { return exports.fromAbortable(function_1.noop)(f); };
var Tag = /** @class */ (function () {
    function Tag(index, value) {
        this.index = index;
        this.value = value;
    }
    return Tag;
}());
/**
 * batch runs a list of batched Futures one batch at a time.
 */
exports.batch = function (list) {
    return exports.sequential(list.map(function (w) { return exports.parallel(w); }));
};
/**
 * parallel runs a list of Futures in parallel failing if any
 * fail and succeeding with a list of successful values.
 */
exports.parallel = function (list) { return new Run(function (s) {
    var done = [];
    var failed = false;
    var comps = [];
    var reconcile = function () { return done.sort(indexCmp).map(function (t) { return t.value; }); };
    var indexCmp = function (a, b) { return a.index - b.index; };
    var onErr = function (e) {
        abortAll();
        s.onError(e);
    };
    var onSucc = function (t) {
        if (!failed) {
            done.push(t);
            if (done.length === list.length)
                s.onSuccess(reconcile());
        }
    };
    var abortAll = function () {
        comps.map(function (c) { return c.abort(); });
        failed = true;
    };
    comps.push.apply(comps, list.map(function (f, i) {
        return f.map(function (value) { return new Tag(i, value); }).fork(onErr, onSucc);
    }));
    if (comps.length === 0)
        s.onSuccess([]);
    return function () { return abortAll(); };
}); };
/**
 * sequential execution of a list of futures.
 *
 * This function succeeds with a list of all results or fails on the first
 * error.
 */
exports.sequential = function (list) { return new Run(function (s) {
    var i = 0;
    var r = [];
    var onErr = function (e) { return s.onError(e); };
    var onSuccess = function (a) { r.push(a); next(); };
    var abort;
    var next = function () {
        if (i < list.length)
            abort = list[i].fork(onErr, onSuccess);
        else
            s.onSuccess(r);
        i++;
    };
    next();
    return function () { if (abort)
        abort.abort(); };
}); };
/**
 * reduce a list of futures into a single value.
 *
 * Starts with an initial value passing the result of
 * each future to the next.
 */
exports.reduce = function (list, init, f) { return new Run(function (s) {
    var i = 0;
    var onErr = function (e) { return s.onError(e); };
    var onSuccess = function (a) {
        init = f(init, a, i);
        next(init);
    };
    var abort;
    var next = function (value) {
        if (i < list.length)
            abort = list[i].fork(onErr, onSuccess);
        else
            s.onSuccess(value);
        i++;
    };
    next(init);
    return function () { if (abort)
        abort.abort(); };
}); };
/**
 * race given a list of Futures, will return a Future that is settled by
 * the first error or success to occur.
 */
exports.race = function (list) { return new Run(function (s) {
    var comps = [];
    var finished = false;
    var abortAll = function () {
        finished = true;
        comps.map(function (c) { return c.abort(); });
    };
    var onErr = function (e) {
        abortAll();
        s.onError(e);
    };
    var onSucc = function (t) {
        if (!finished) {
            finished = true;
            comps.map(function (c, i) { return (i !== t.index) ? c.abort() : undefined; });
            s.onSuccess(t.value);
        }
    };
    comps.push.apply(comps, list.map(function (f, i) {
        return f.map(function (value) { return new Tag(i, value); }).fork(onErr, onSucc);
    }));
    if (comps.length === 0)
        s.onError(new Error("race(): Cannot race an empty list!"));
    return function () { return abortAll(); };
}); };
/**
 * toPromise transforms a Future into a Promise.
 *
 * This function depends on the global promise constructor and
 * will fail if the enviornment does not provide one.
 */
exports.toPromise = function (ft) { return new Promise(function (yes, no) {
    return ft.fork(no, yes);
}); };
/**
 * fromExcept converts an Except to a Future.
 */
exports.fromExcept = function (e) {
    return e.fold(function (e) { return exports.raise(e); }, function (a) { return exports.pure(a); });
};
/**
 * liftP turns a function that produces a Promise into a Future.
 */
exports.liftP = function (f) { return new Run(function (s) {
    f()
        .then(function (a) { return s.onSuccess(a); })
        .catch(function (e) { return s.onError(e); });
    return function_1.noop;
}); };

},{"../../data/function":7,"../error":1,"../timer":3}],3:[function(require,module,exports){
(function (process){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * tick runs a function in the "next tick" using process.nextTick in node
 * or setTimeout(f, 0) elsewhere.
 */
exports.tick = function (f) { return (typeof window == 'undefined') ?
    setTimeout(f, 0) :
    process.nextTick(f); };
/**
 * debounce delays the application of a function until the specified time
 * has passed.
 *
 * If multiple attempts to apply the function have occured, then each attempt
 * will restart the delay process. The function will only ever be applied once
 * after the delay, using the value of the final attempt for application.
 */
exports.debounce = function (f, delay) {
    var id = -1;
    return function (a) {
        if (id === -1) {
            id = setTimeout(function () { return f(a); }, delay);
        }
        else {
            clearTimeout(id);
            id = setTimeout(function () { return f(a); }, delay);
        }
    };
};
/**
 * throttle limits the application of a function to occur only one within the
 * specified duration.
 *
 * The first application will execute immediately subsequent applications
 * will be ignored until the duration has passed.
 */
exports.throttle = function (f, duration) {
    var wait = false;
    return function (a) {
        if (wait === false) {
            f(a);
            wait = true;
            setTimeout(function () { return wait = false; }, duration);
        }
    };
};

}).call(this,require('_process'))
},{"_process":51}],4:[function(require,module,exports){
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The array module provides helper functions
 * for working with JS arrays.
 */
var record_1 = require("../record");
var math_1 = require("../../math");
/**
 * head returns the item at index 0 of an array
 */
exports.head = function (list) { return list[0]; };
/**
 * tail returns the last item in an array
 */
exports.tail = function (list) { return list[list.length - 1]; };
/**
 * empty indicates whether an array is empty or not.
 */
exports.empty = function (list) { return (list.length === 0); };
/**
 * contains indicates whether an element exists in an array.
 */
exports.contains = function (list, a) { return (list.indexOf(a) > -1); };
/**
 * map is a curried version of the Array#map method.
 */
exports.map = function (list) { return function (f) { return list.map(f); }; };
/**
 * flatMap allows a function to produce a combined set of arrays from a map
 * operation over each member of a list.
 */
exports.flatMap = function (list, f) {
    return list.reduce(function (p, c, i) { return p.concat(f(c, i, list)); }, []);
};
/**
 * concat concatenates an element to an array without destructuring
 * the element if itself is an array.
 */
exports.concat = function (list, a) { return __spreadArrays(list, [a]); };
/**
 * partition an array into two using a partitioning function.
 *
 * The first array contains values that return true and the second false.
 */
exports.partition = function (list, f) { return exports.empty(list) ?
    [[], []] :
    list.reduce(function (_a, c, i) {
        var yes = _a[0], no = _a[1];
        return (f(c, i, list) ?
            [exports.concat(yes, c), no] :
            [yes, exports.concat(no, c)]);
    }, [[], []]); };
/**
 * group the elements of an array into a Record where each property
 * is an array of elements assigned to it's property name.
 */
exports.group = function (list, f) {
    return list.reduce(function (p, c, i) {
        var _a;
        var g = f(c, i, list);
        return record_1.merge(p, (_a = {},
            _a[g] = Array.isArray(p[g]) ?
                exports.concat(p[g], c) : [c],
            _a));
    }, {});
};
/**
 * distribute breaks an array into an array of equally (approximate) sized
 * smaller arrays.
 */
exports.distribute = function (list, size) {
    var r = list.reduce(function (p, c, i) {
        return math_1.isMultipleOf(size, i + 1) ?
            [exports.concat(p[0], exports.concat(p[1], c)), []] :
            [p[0], exports.concat(p[1], c)];
    }, [[], []]);
    return (r[1].length === 0) ? r[0] : exports.concat(r[0], r[1]);
};
/**
 * dedupe an array by filtering out elements
 * that appear twice.
 */
exports.dedupe = function (list) {
    return list.filter(function (e, i, l) { return l.indexOf(e) === i; });
};
/**
 * remove an element from an array returning a new copy with the element
 * removed.
 */
exports.remove = function (list, target) {
    var idx = list.indexOf(target);
    if (idx === -1) {
        return list.slice();
    }
    else {
        var a = list.slice();
        a.splice(idx, 1);
        return a;
    }
};
/**
 * removeAt removes an element at the specified index returning a copy
 * of the original array with the element removed.
 */
exports.removeAt = function (list, idx) {
    if ((list.length > idx) && (idx > -1)) {
        var a = list.slice();
        a.splice(idx, 1);
        return a;
    }
    else {
        return list.slice();
    }
};
/**
 * make an array of elements of a given size using a function to provide
 * each element.
 *
 * The function receives the index number for each step.
 */
exports.make = function (size, f) {
    var a = new Array(size);
    for (var i = 0; i < size; i++)
        a[i] = f(i);
    return a;
};
/**
 * combine a list of of lists into one list.
 */
exports.combine = function (list) {
    return list.reduce(function (p, c) { return p.concat(c); }, []);
};
/**
 * compact removes any occurences of null or undefined in the list.
 */
exports.compact = function (list) {
    return list.filter(function (v) { return (v != null); });
};

},{"../../math":12,"../record":9}],5:[function(require,module,exports){
"use strict";
/**
 * Useful functions for sorting data in an array.
 *
 * The functions are expected to be passed to Array#sort.
 * Defaults to ascending order unless specified otherwise.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * date sorts two strings representing dates.
 *
 * The dates are passed to the date constructor.
 */
exports.date = function (a, b) {
    var na = new Date(a).getTime();
    var nb = new Date(b).getTime();
    return na > nb ? -1 : na < nb ? 1 : 0;
};
/**
 * string sorts two strings by first lower casing them.
 */
exports.string = function (a, b) {
    var la = String(a).replace(/\s+/, '').toLowerCase();
    var lb = String(b).replace(/\s+/, '').toLowerCase();
    return (la > lb) ? -1 : (la < lb) ? 1 : 0;
};
/**
 * number sort
 */
exports.number = function (a, b) {
    var na = parseFloat(a);
    var nb = parseFloat(b);
    na = (isNaN(a)) ? -Infinity : a;
    nb = (isNaN(b)) ? -Infinity : b;
    return (na > nb) ? -1 : (na < nb) ? 1 : 0;
};
/**
 * natural sort impelmentation.
 */
exports.natural = function (a, b) {
    if (a === void 0) { a = ''; }
    if (b === void 0) { b = ''; }
    var reA = /[^a-zA-Z]/g;
    var reN = /[^0-9]/g;
    var aInt = parseInt(a, 10);
    var bInt = parseInt(b, 10);
    if (isNaN(aInt) && isNaN(bInt)) {
        var aA = String(a).replace(reA, '');
        var bA = String(b).replace(reA, '');
        if (aA === bA) {
            var aN = parseInt(String(a).replace(reN, ''), 10);
            var bN = parseInt(String(b).replace(reN, ''), 10);
            return aN === bN ? 0 : aN > bN ? -1 : 1;
        }
        else {
            return aA > bA ? -1 : 1;
        }
    }
    else if (isNaN(aInt)) { //A is not an Int
        return -1; //to make alphanumeric sort first return -1 here
    }
    else if (isNaN(bInt)) { //B is not an Int
        return 1; //to make alphanumeric sort first return 1 here
    }
    else {
        return aInt > bInt ? -1 : 1;
    }
};

},{}],6:[function(require,module,exports){
"use strict";
/**
 * Either represents a value that may be one of two types.
 *
 * An Either is either a Left or Right. Mapping and related functions over the
 * Left side returns the value unchanged. When the value is Right
 * functions are applied as normal.
 *
 * The Either concept is often used to accomodate error handling but there
 * are other places it may come in handy.
 *
 * An important point to note when using this type is that the left side
 * remains the same while chaining. That means, the types Either<number, string>
 * and Either<boolean, string> are two different types that can not be sequenced
 * together via map,chain etc.
 *
 * This turns up compiler errors in unexpected places and is sometimes rectified
 * by extracting the values out of the Either type completley and constructing
 * a fresh one.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var maybe_1 = require("./maybe");
/**
 * The abstract Either class.
 *
 * This is the type that will be used in signatures.
 */
var Either = /** @class */ (function () {
    function Either() {
    }
    Either.prototype.of = function (value) {
        return new Right(value);
    };
    return Either;
}());
exports.Either = Either;
/**
 * Left side of the Either implementation.
 */
var Left = /** @class */ (function (_super) {
    __extends(Left, _super);
    function Left(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Left.prototype.map = function (_) {
        return new Left(this.value);
    };
    Left.prototype.lmap = function (f) {
        return new Left(f(this.value));
    };
    Left.prototype.bimap = function (f, _) {
        return new Left(f(this.value));
    };
    Left.prototype.alt = function (a) {
        return a;
    };
    Left.prototype.chain = function (_) {
        return new Left(this.value);
    };
    Left.prototype.ap = function (_) {
        return new Left(this.value);
    };
    Left.prototype.extend = function (_) {
        return new Left(this.value);
    };
    Left.prototype.fold = function (f, _) {
        return f(this.value);
    };
    Left.prototype.eq = function (m) {
        return ((m instanceof Left) && (m.value === this.value));
    };
    Left.prototype.orElse = function (f) {
        return f(this.value);
    };
    Left.prototype.orRight = function (f) {
        return new Right(f(this.value));
    };
    Left.prototype.isLeft = function () {
        return true;
    };
    Left.prototype.isRight = function () {
        return false;
    };
    Left.prototype.takeLeft = function () {
        return this.value;
    };
    Left.prototype.takeRight = function () {
        throw new TypeError("Not right!");
    };
    Left.prototype.toMaybe = function () {
        return maybe_1.nothing();
    };
    return Left;
}(Either));
exports.Left = Left;
/**
 * Right side implementation.
 */
var Right = /** @class */ (function (_super) {
    __extends(Right, _super);
    function Right(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Right.prototype.map = function (f) {
        return new Right(f(this.value));
    };
    Right.prototype.lmap = function (_) {
        return new Right(this.value);
    };
    Right.prototype.bimap = function (_, g) {
        return new Right(g(this.value));
    };
    Right.prototype.alt = function (_) {
        return this;
    };
    Right.prototype.chain = function (f) {
        return f(this.value);
    };
    Right.prototype.ap = function (e) {
        var _this = this;
        return e.map(function (f) { return f(_this.value); });
    };
    Right.prototype.extend = function (f) {
        return new Right(f(this));
    };
    Right.prototype.eq = function (m) {
        return ((m instanceof Right) && (m.value === this.value));
    };
    Right.prototype.fold = function (_, g) {
        return g(this.value);
    };
    Right.prototype.orElse = function (_) {
        return this;
    };
    Right.prototype.orRight = function (_) {
        return this;
    };
    Right.prototype.isLeft = function () {
        return false;
    };
    Right.prototype.isRight = function () {
        return true;
    };
    Right.prototype.takeLeft = function () {
        throw new TypeError("Not left!");
    };
    Right.prototype.takeRight = function () {
        return this.value;
    };
    Right.prototype.toMaybe = function () {
        return maybe_1.just(this.value);
    };
    return Right;
}(Either));
exports.Right = Right;
/**
 * left constructor helper.
 */
exports.left = function (a) { return new Left(a); };
/**
 * right constructor helper.
 */
exports.right = function (b) { return new Right(b); };
/**
 * fromBoolean constructs an Either using a boolean value.
 */
exports.fromBoolean = function (b) {
    return b ? exports.right(true) : exports.left(false);
};
/**
 * either given two functions, first for Left, second for Right, will return
 * the result of applying the appropriate function to an Either's internal value.
 */
exports.either = function (f) { return function (g) { return function (e) {
    return (e instanceof Right) ? g(e.takeRight()) : f(e.takeLeft());
}; }; };

},{"./maybe":8}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * compose two functions into one.
 */
exports.compose = function (f, g) { return function (a) { return g(f(a)); }; };
/**
 * compose3 functions into one.
 */
exports.compose3 = function (f, g, h) { return function (a) { return h(g(f(a))); }; };
/**
 * compose4 functions into one.
 */
exports.compose4 = function (f, g, h, i) {
    return function (a) { return i(h(g(f(a)))); };
};
/**
 * compose5 functions into one.
 */
exports.compose5 = function (f, g, h, i, j) { return function (a) { return j(i(h(g(f(a))))); }; };
/**
 * cons given two values, ignore the second and always return the first.
 */
exports.cons = function (a) { return function (_) { return a; }; };
/**
 * flip the order of arguments to a curried function that takes 2 arguments.
 */
exports.flip = function (f) { return function (b) { return function (a) { return (f(a)(b)); }; }; };
/**
 * identity function.
 */
exports.identity = function (a) { return a; };
exports.id = exports.identity;
/**
 * curry an ES function that accepts 2 parameters.
 */
exports.curry = function (f) { return function (a) { return function (b) { return f(a, b); }; }; };
/**
 * curry3 curries an ES function that accepts 3 parameters.
 */
exports.curry3 = function (f) { return function (a) { return function (b) { return function (c) { return f(a, b, c); }; }; }; };
/**
 * curry4 curries an ES function that accepts 4 parameters.
 */
exports.curry4 = function (f) {
    return function (a) { return function (b) { return function (c) { return function (d) { return f(a, b, c, d); }; }; }; };
};
/**
 * curry5 curries an ES function that accepts 5 parameters.
 */
exports.curry5 = function (f) {
    return function (a) { return function (b) { return function (c) { return function (d) { return function (e) { return f(a, b, c, d, e); }; }; }; }; };
};
/**
 * noop function
 */
exports.noop = function () { };

},{}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Nothing represents the absence of a usable value.
 */
var Nothing = /** @class */ (function () {
    function Nothing() {
    }
    /**
     * map simply returns a Nothing<A>
     */
    Nothing.prototype.map = function (_) {
        return new Nothing();
    };
    /**
     * ap allows for a function wrapped in a Just to apply
     * to value present in this Just.
     */
    Nothing.prototype.ap = function (_) {
        return new Nothing();
    };
    /**
     * of wraps a value in a Just.
     */
    Nothing.prototype.of = function (a) {
        return new Just(a);
    };
    /**
     * chain simply returns a Nothing<A>.
     */
    Nothing.prototype.chain = function (_) {
        return new Nothing();
    };
    /**
     * alt will prefer whatever Maybe instance provided.
     */
    Nothing.prototype.alt = function (a) {
        return a;
    };
    /**
     * empty provides a default Maybe.
     * Maybe.empty() = new Nothing()
     */
    Nothing.prototype.empty = function () {
        return new Nothing();
    };
    /**
     * extend returns a Nothing<A>.
     */
    Nothing.prototype.extend = function (_) {
        return new Nothing();
    };
    /**
     * eq returns true if compared to another Nothing instance.
     */
    Nothing.prototype.eq = function (m) {
        return m instanceof Nothing;
    };
    /**
     * orJust converts a Nothing<A> to a Just
     * using the value from the provided function.
     */
    Nothing.prototype.orJust = function (f) {
        return new Just(f());
    };
    /**
     * orElse allows an alternative Maybe value
     * to be provided since this one is Nothing<A>.
     */
    Nothing.prototype.orElse = function (f) {
        return f();
    };
    Nothing.prototype.isNothing = function () {
        return true;
    };
    Nothing.prototype.isJust = function () {
        return false;
    };
    /**
     * get throws an error because there
     * is nothing here to get.
     */
    Nothing.prototype.get = function () {
        throw new TypeError('Cannot get a value from Nothing!');
    };
    return Nothing;
}());
exports.Nothing = Nothing;
/**
 * Just represents the presence of a usable value.
 */
var Just = /** @class */ (function () {
    function Just(value) {
        this.value = value;
    }
    /**
     * map over the value present in the Just.
     */
    Just.prototype.map = function (f) {
        return new Just(f(this.value));
    };
    /**
     * ap allows for a function wrapped in a Just to apply
     * to value present in this Just.
     */
    Just.prototype.ap = function (mb) {
        var _this = this;
        return mb.map(function (f) { return f(_this.value); });
    };
    /**
     * of wraps a value in a Just.
     */
    Just.prototype.of = function (a) {
        return new Just(a);
    };
    /**
     * chain allows the sequencing of functions that return a Maybe.
     */
    Just.prototype.chain = function (f) {
        return f(this.value);
    };
    /**
     * alt will prefer the first Just encountered (this).
     */
    Just.prototype.alt = function (_) {
        return this;
    };
    /**
     * empty provides a default Maybe.
     * Maybe.empty() = new Nothing()
     */
    Just.prototype.empty = function () {
        return new Nothing();
    };
    /**
     * extend allows sequencing of Maybes with
     * functions that unwrap into non Maybe types.
     */
    Just.prototype.extend = function (f) {
        return new Just(f(this));
    };
    /**
     * eq tests the value of two Justs.
     */
    Just.prototype.eq = function (m) {
        return ((m instanceof Just) && (m.value === this.value));
    };
    /**
     * orJust returns this Just.
     */
    Just.prototype.orJust = function (_) {
        return this;
    };
    /**
     * orElse returns this Just
     */
    Just.prototype.orElse = function (_) {
        return this;
    };
    Just.prototype.isNothing = function () {
        return false;
    };
    Just.prototype.isJust = function () {
        return true;
    };
    /**
     * get the value of this Just.
     */
    Just.prototype.get = function () {
        return this.value;
    };
    return Just;
}());
exports.Just = Just;
/**
 * of
 */
exports.of = function (a) { return new Just(a); };
/**
 * nothing convenience constructor
 */
exports.nothing = function () { return new Nothing(); };
/**
 * just convenience constructor
 */
exports.just = function (a) { return new Just(a); };
/**
 * fromNullable constructs a Maybe from a value that may be null.
 */
exports.fromNullable = function (a) { return a == null ?
    new Nothing() : new Just(a); };
/**
 * fromArray checks an array to see if it's empty
 *
 * Returns [[Nothing]] if it is, [[Just]] otherwise.
 */
exports.fromArray = function (a) {
    return (a.length === 0) ? new Nothing() : new Just(a);
};
/**
 * fromObject uses Object.keys to turn see if an object
 * has any own properties.
 */
exports.fromObject = function (o) {
    return Object.keys(o).length === 0 ? new Nothing() : new Just(o);
};
/**
 * fromString constructs Nothing<A> if the string is empty or Just<A> otherwise.
 */
exports.fromString = function (s) {
    return (s === '') ? new Nothing() : new Just(s);
};
/**
 * fromBoolean constructs Nothing if b is false, Just<A> otherwise
 */
exports.fromBoolean = function (b) {
    return (b === false) ? new Nothing() : new Just(b);
};
/**
 * fromNumber constructs Nothing if n is 0 Just<A> otherwise.
 */
exports.fromNumber = function (n) {
    return (n === 0) ? new Nothing() : new Just(n);
};
/**
 * fromNaN constructs Nothing if a value is not a number or
 * Just<A> otherwise.
 */
exports.fromNaN = function (n) {
    return isNaN(n) ? new Nothing() : new Just(n);
};

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The record module provides functions for treating ES objects as records.
 *
 * Some of the functions provided here are inherently unsafe (tsc will not
 * be able track integrity and may result in runtime errors if not used carefully.
 */
var array_1 = require("../array");
var type_1 = require("../type");
/**
 * assign polyfill.
 */
function assign(target) {
    var _varArgs = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        _varArgs[_i - 1] = arguments[_i];
    }
    if (target == null)
        throw new TypeError('Cannot convert undefined or null to object');
    var to = Object(target);
    for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        if (nextSource != null) {
            for (var nextKey in nextSource) {
                // Avoid bugs when hasOwnProperty is shadowed
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey))
                    to[nextKey] = nextSource[nextKey];
            }
        }
    }
    return to;
}
exports.assign = assign;
/**
 * isRecord tests whether a value is a record.
 *
 * The following are not considered records:
 * 1. Array
 * 2. Date
 * 3. RegExp
 *
 * This function is unsafe.
 */
exports.isRecord = function (value) {
    return (typeof value === 'object') &&
        (value != null) &&
        (!Array.isArray(value)) &&
        (!(value instanceof Date)) &&
        (!(value instanceof RegExp));
};
/**
 * keys produces a list of property names from a Record.
 */
exports.keys = function (value) { return Object.keys(value); };
/**
 * map over a Record's properties producing a new record.
 *
 * The order of keys processed is not guaranteed.
 */
exports.map = function (o, f) {
    return exports.keys(o).reduce(function (p, k) {
        var _a;
        return exports.merge(p, (_a = {}, _a[k] = f(o[k], k, o), _a));
    }, {});
};
/**
 * mapTo maps over a Record's properties producing an array of each result.
 *
 * The order of elements in the array is not guaranteed.
 */
exports.mapTo = function (o, f) {
    return exports.keys(o).map(function (k) { return f(o[k], k, o); });
};
/**
 * reduce a Record's keys to a single value.
 *
 * The initial value (accum) must be supplied to avoid errors when
 * there are no properites on the Record.
 * The order of keys processed is not guaranteed.
 */
exports.reduce = function (o, accum, f) {
    return exports.keys(o).reduce(function (p, k) { return f(p, o[k], k); }, accum);
};
/**
 * filter the keys of a record using a filter function.
 */
exports.filter = function (o, f) {
    return exports.keys(o).reduce(function (p, k) {
        var _a;
        return f(o[k], k, o) ? exports.merge(p, (_a = {}, _a[k] = o[k], _a)) : p;
    }, {});
};
/**
 * merge two objects into one.
 *
 * The return value's type is the product of the two types supplied.
 * This function may be unsafe.
 */
exports.merge = function (left, right) { return assign({}, left, right); };
/**
 * merge3 merges 3 records into one.
 */
exports.merge3 = function (a, b, c) { return assign({}, a, b, c); };
/**
 * merge4 merges 4 records into one.
 */
exports.merge4 = function (a, b, c, d) {
    return assign({}, a, b, c, d);
};
/**
 * merge5 merges 5 records into one.
 */
exports.merge5 = function (a, b, c, d, e) { return assign({}, a, b, c, d, e); };
/**
 * rmerge merges 2 records recursively.
 *
 * This function may be unsafe.
 */
exports.rmerge = function (left, right) {
    return exports.reduce(right, left, deepMerge);
};
/**
 * rmerge3 merges 3 records recursively.
 */
exports.rmerge3 = function (r, s, t) {
    return [s, t]
        .reduce(function (p, c) {
        return exports.reduce(c, (p), deepMerge);
    }, r);
};
/**
 * rmerge4 merges 4 records recursively.
 */
exports.rmerge4 = function (r, s, t, u) {
    return [s, t, u]
        .reduce(function (p, c) {
        return exports.reduce(c, (p), deepMerge);
    }, r);
};
/**
 * rmerge5 merges 5 records recursively.
 */
exports.rmerge5 = function (r, s, t, u, v) {
    return [s, t, u, v]
        .reduce(function (p, c) {
        return exports.reduce(c, (p), deepMerge);
    }, r);
};
var deepMerge = function (pre, curr, key) {
    var _a, _b;
    return exports.isRecord(curr) ?
        exports.merge(pre, (_a = {},
            _a[key] = exports.isRecord(pre[key]) ?
                exports.rmerge(pre[key], curr) :
                curr,
            _a)) :
        exports.merge(pre, (_b = {}, _b[key] = curr, _b));
};
/**
 * exclude removes the specified properties from a Record.
 */
exports.exclude = function (o, keys) {
    var list = Array.isArray(keys) ? keys : [keys];
    return exports.reduce(o, {}, function (p, c, k) {
        var _a;
        return list.indexOf(k) > -1 ? p : exports.merge(p, (_a = {}, _a[k] = c, _a));
    });
};
/**
 * partition a Record into two sub-records using a separating function.
 *
 * This function produces an array where the first element is a record
 * of passing values and the second the failing values.
 */
exports.partition = function (r, f) {
    return exports.reduce(r, [{}, {}], function (_a, c, k) {
        var _b, _c;
        var yes = _a[0], no = _a[1];
        return f(c, k, r) ?
            [exports.merge(yes, (_b = {}, _b[k] = c, _b)), no] :
            [yes, exports.merge(no, (_c = {}, _c[k] = c, _c))];
    });
};
/**
 * group the properties of a Record into another Record using a grouping
 * function.
 */
exports.group = function (r, f) {
    return exports.reduce(r, {}, function (p, c, k) {
        var _a, _b, _c;
        var g = f(c, k, r);
        return exports.merge(p, (_a = {},
            _a[g] = exports.isRecord(p[g]) ?
                exports.merge(p[g], (_b = {}, _b[k] = c, _b)) : (_c = {}, _c[k] = c, _c),
            _a));
    });
};
/**
 * values returns a shallow array of the values of a record.
 */
exports.values = function (r) {
    return exports.reduce(r, [], function (p, c) { return array_1.concat(p, c); });
};
/**
 * contains indicates whether a Record has a given key.
 */
exports.contains = function (r, key) {
    return Object.hasOwnProperty.call(r, key);
};
/**
 * clone a Record.
 *
 * Breaks references and deep clones arrays.
 * This function should only be used on Records or objects that
 * are not class instances.
 */
exports.clone = function (r) {
    return exports.reduce(r, {}, function (p, c, k) { p[k] = _clone(c); return p; });
};
var _clone = function (a) {
    if (type_1.isArray(a))
        return a.map(_clone);
    else if (exports.isRecord(a))
        return exports.clone(a);
    else
        return a;
};
/**
 * count how many properties exist on the record.
 */
exports.count = function (r) { return exports.keys(r).length; };
/**
 * empty tests whether the object has any properties or not.
 */
exports.empty = function (r) { return exports.count(r) === 0; };
/**
 * some tests whether at least one property of a Record passes the
 * test implemented by the provided function.
 */
exports.some = function (o, f) {
    return exports.keys(o).some(function (k) { return f(o[k], k, o); });
};
/**
 * every tests whether each  property of a Record passes the
 * test implemented by the provided function.
 */
exports.every = function (o, f) {
    return exports.keys(o).every(function (k) { return f(o[k], k, o); });
};

},{"../array":4,"../type":11}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This module provides a syntax and associated functions for
 * getting and setting values on ES objects easily.
 *
 * Given a path, a value can either be retrieved or set on an object.
 *
 * The path syntax follows typical ES dot notation, bracket notation or a mixture
 * of both.
 *
 * Note that quotes are not used when describing a path via bracket notation.
 *
 * If you need to use a dot or square brackets in your paths, prefix them with
 * the "\" (backslash) character.
 */
/** imports **/
var maybe_1 = require("../maybe");
var _1 = require("./");
var TOKEN_DOT = '.';
var TOKEN_BRACKET_LEFT = '[';
var TOKEN_BRACKET_RIGHT = ']';
var TOKEN_ESCAPE = '\\';
/**
 * tokenize a path into a list of sequential property names.
 */
exports.tokenize = function (str) {
    var i = 0;
    var buf = '';
    var curr = '';
    var next = '';
    var tokens = [];
    while (i < str.length) {
        curr = str[i];
        next = str[i + 1];
        if (curr === TOKEN_ESCAPE) {
            //escape sequence
            buf = "" + buf + next;
            i++;
        }
        else if (curr === TOKEN_DOT) {
            if (buf !== '')
                tokens.push(buf); //recognize a path and push a new token
            buf = '';
        }
        else if ((curr === TOKEN_BRACKET_LEFT) &&
            next === TOKEN_BRACKET_RIGHT) {
            //intercept empty bracket paths
            i++;
        }
        else if (curr === TOKEN_BRACKET_LEFT) {
            var bracketBuf = '';
            var firstDot = -1;
            var firstDotBuf = '';
            i++;
            while (true) {
                //everything between brackets is treated as a path
                //if no closing bracket is found, we back track to the first dot
                //if there is no dot the whole buffer is treated as a path
                curr = str[i];
                next = str[i + 1];
                if ((curr === TOKEN_BRACKET_RIGHT) &&
                    (next === TOKEN_BRACKET_RIGHT)) {
                    //escaped right bracket
                    bracketBuf = "" + bracketBuf + TOKEN_BRACKET_RIGHT;
                    i++;
                }
                else if (curr === TOKEN_BRACKET_RIGHT) {
                    //successfully tokenized the path
                    if (buf !== '')
                        tokens.push(buf); //save the previous path
                    tokens.push(bracketBuf); //save the current path
                    buf = '';
                    break;
                }
                else if (curr == null) {
                    //no closing bracket found and we ran out of string to search
                    if (firstDot !== -1) {
                        //backtrack to the first dot encountered
                        i = firstDot;
                        //save the paths so far
                        tokens.push("" + buf + TOKEN_BRACKET_LEFT + firstDotBuf);
                        buf = '';
                        break;
                    }
                    else {
                        //else if no dots were found treat the current buffer
                        // and rest of the string as part of one path.
                        buf = "" + buf + TOKEN_BRACKET_LEFT + bracketBuf;
                        break;
                    }
                }
                if ((curr === TOKEN_DOT) && (firstDot === -1)) {
                    //take note of the location and tokens between 
                    //the opening bracket and first dot.
                    //If there is no closing bracket, we use this info to
                    //lex properly.
                    firstDot = i;
                    firstDotBuf = bracketBuf;
                }
                bracketBuf = "" + bracketBuf + curr;
                i++;
            }
        }
        else {
            buf = "" + buf + curr;
        }
        i++;
    }
    if ((buf.length > 0))
        tokens.push(buf);
    return tokens;
};
/**
 * unsafeGet retrieves a value at the specified path
 * on any ES object.
 *
 * This function does not check if getting the value succeeded or not.
 */
exports.unsafeGet = function (path, src) {
    if (src == null)
        return undefined;
    var toks = exports.tokenize(path);
    var head = src[toks.shift()];
    return toks.reduce(function (p, c) { return (p == null) ? p : p[c]; }, head);
};
/**
 * get a value from a Record given its path safely.
 */
exports.get = function (path, src) {
    return maybe_1.fromNullable(exports.unsafeGet(path, src));
};
/**
 * getDefault is like get but takes a default value to return if
 * the path is not found.
 */
exports.getDefault = function (path, src, def) {
    return exports.get(path, src).orJust(function () { return def; }).get();
};
/**
 * getString casts the resulting value to a string.
 *
 * An empty string is provided if the path is not found.
 */
exports.getString = function (path, src) {
    return exports.get(path, src).map(function (v) { return String(v); }).orJust(function () { return ''; }).get();
};
/**
 * set sets a value on an object given a path.
 */
exports.set = function (p, v, r) {
    var toks = exports.tokenize(p);
    return _set(r, v, toks);
};
var _set = function (r, value, toks) {
    var o;
    if (toks.length === 0)
        return value;
    o = _1.isRecord(r) ? _1.clone(r) : {};
    o[toks[0]] = _set(o[toks[0]], value, toks.slice(1));
    return o;
};
/**
 * escape a path so that occurences of dots are not interpreted as paths.
 *
 * This function escapes dots and dots only.
 */
exports.escape = function (p) {
    var i = 0;
    var buf = '';
    var curr = '';
    while (i < p.length) {
        curr = p[i];
        if ((curr === TOKEN_ESCAPE) || (curr === TOKEN_DOT))
            buf = "" + buf + TOKEN_ESCAPE + curr;
        else
            buf = "" + buf + curr;
        i++;
    }
    return buf;
};
/**
 * unescape a path that has been previously escaped.
 */
exports.unescape = function (p) {
    var i = 0;
    var curr = '';
    var next = '';
    var buf = '';
    while (i < p.length) {
        curr = p[i];
        next = p[i + 1];
        if (curr === TOKEN_ESCAPE) {
            buf = "" + buf + next;
            i++;
        }
        else {
            buf = "" + buf + curr;
        }
        i++;
    }
    return buf;
};
/**
 * escapeRecord escapes each property of a record recursively.
 */
exports.escapeRecord = function (r) {
    return _1.reduce(r, {}, function (p, c, k) {
        if (typeof c === 'object')
            p[exports.escape(k)] = exports.escapeRecord(c);
        else
            p[exports.escape(k)] = c;
        return p;
    });
};
/**
 * unescapeRecord unescapes each property of a record recursively.
 */
exports.unescapeRecord = function (r) {
    return _1.reduce(r, {}, function (p, c, k) {
        if (_1.isRecord(c))
            p[exports.unescape(k)] = exports.unescapeRecord(c);
        else
            p[exports.unescape(k)] = c;
        return p;
    });
};
/**
 * flatten an object into a Record where each key is a path to a non-complex
 * value or array.
 *
 * If any of the paths contain dots, they will be escaped.
 */
exports.flatten = function (r) {
    return (flatImpl('')({})(r));
};
var flatImpl = function (pfix) { return function (prev) {
    return function (r) {
        return _1.reduce(r, prev, function (p, c, k) {
            var _a;
            return _1.isRecord(c) ?
                (flatImpl(prefix(pfix, k))(p)(c)) :
                _1.merge(p, (_a = {}, _a[prefix(pfix, k)] = c, _a));
        });
    };
}; };
var prefix = function (pfix, key) { return (pfix === '') ?
    exports.escape(key) : pfix + "." + exports.escape(key); };
/**
 * unflatten a flattened Record so that any nested paths are expanded
 * to their full representation.
 */
exports.unflatten = function (r) {
    return _1.reduce(r, {}, function (p, c, k) { return exports.set(k, c, p); });
};
/**
 * intersect set operation between the keys of two records.
 *
 * All the properties of the left record that have matching property
 * names in the right are retained.
 */
exports.intersect = function (a, b) {
    return _1.reduce(a, {}, function (p, c, k) {
        if (b.hasOwnProperty(k))
            p[k] = c;
        return p;
    });
};
/**
 * difference set operation between the keys of two records.
 *
 * All the properties on the left record that do not have matching
 * property names in the right are retained.
 */
exports.difference = function (a, b) {
    return _1.reduce(a, {}, function (p, c, k) {
        if (!b.hasOwnProperty(k))
            p[k] = c;
        return p;
    });
};
/**
 * map over the property names of a record.
 */
exports.map = function (a, f) {
    return _1.reduce(a, {}, function (p, c, k) {
        p[f(k)] = c;
        return p;
    });
};
/**
 * project a Record according to the field specification given.
 *
 * Only properties that appear in the spec and set to true will be retained.
 * This function is not safe. It may leave undefined values in the resulting
 * record.
 */
exports.project = function (spec, rec) {
    return _1.reduce(spec, {}, function (p, c, k) {
        return (c === true) ? exports.set(k, exports.unsafeGet(k, rec), p) : p;
    });
};

},{"../maybe":8,"./":9}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prims = ['string', 'number', 'boolean'];
/**
 * Any is a class used to represent typescript's "any" type.
 */
var Any = /** @class */ (function () {
    function Any() {
    }
    return Any;
}());
exports.Any = Any;
/**
 * isObject test.
 *
 * Does not consider an Array an object.
 */
exports.isObject = function (value) {
    return (typeof value === 'object') && (!exports.isArray(value));
};
/**
 * isArray test.
 */
exports.isArray = Array.isArray;
/**
 * isString test.
 */
exports.isString = function (value) {
    return typeof value === 'string';
};
/**
 * isNumber test.
 */
exports.isNumber = function (value) {
    return (typeof value === 'number') && (!isNaN(value));
};
/**
 * isBoolean test.
 */
exports.isBoolean = function (value) {
    return typeof value === 'boolean';
};
/**
 * isFunction test.
 */
exports.isFunction = function (value) {
    return typeof value === 'function';
};
/**
 * isPrim test.
 */
exports.isPrim = function (value) {
    return !(exports.isObject(value) ||
        exports.isArray(value) ||
        exports.isFunction(value));
};
/**
 * is performs a typeof of check on a type.
 */
exports.is = function (expected) { return function (value) {
    return typeof (value) === expected;
}; };
/**
 * test whether a value conforms to some pattern.
 *
 * This function is made available mainly for a crude pattern matching
 * machinery that works as followss:
 * string   -> Matches on the value of the string.
 * number   -> Matches on the value of the number.
 * boolean  -> Matches on the value of the boolean.
 * object   -> Each key of the object is matched on the value, all must match.
 * function -> Treated as a constructor and results in an instanceof check or
 *             for String,Number and Boolean, this uses the typeof check. If
 *             the function is RegExp then we uses the RegExp.test function
 *             instead.
 */
exports.test = function (value, t) {
    if ((prims.indexOf(typeof t) > -1) && (value === t))
        return true;
    else if ((typeof t === 'function') &&
        (((t === String) && (typeof value === 'string')) ||
            ((t === Number) && (typeof value === 'number')) ||
            ((t === Boolean) && (typeof value === 'boolean')) ||
            ((t === Array) && (Array.isArray(value))) ||
            (t === Any) ||
            (value instanceof t)))
        return true;
    else if ((t instanceof RegExp) &&
        ((typeof value === 'string') &&
            t.test(value)))
        return true;
    else if ((typeof t === 'object') && (typeof value === 'object'))
        return Object
            .keys(t)
            .every(function (k) { return Object.hasOwnProperty.call(value, k) ?
            exports.test(value[k], t[k]) : false; });
    return false;
};
/**
 * show the type of a value.
 *
 * Note: This may crash if the value is an
 * object literal with recursive references.
 */
exports.show = function (value) {
    if (typeof value === 'object') {
        if (Array.isArray(value))
            return "[" + value.map(exports.show) + "];";
        else if (value.constructor !== Object)
            return (value.constructor.name ||
                value.constructor);
        else
            return JSON.stringify(value);
    }
    else {
        return '' + value;
    }
};
/**
 * toString casts a value to a string.
 *
 * If the value is null or undefined an empty string is returned instead of
 * the default.
 */
exports.toString = function (val) {
    return (val == null) ? '' : String(val);
};

},{}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * isMultipleOf tests whether the Integer 'y' is a multiple of x.
 */
exports.isMultipleOf = function (x, y) { return ((y % x) === 0); };
/**
 * round a number "x" to "n" places (n defaults to 0 places).
 *
 * This uses the Math.round(x * n) / n method however we take into
 * consideration the Math.round(1.005 * 100) / 100 === 1 issue by use of an
 * offset:
 *
 * sign * (round((abs(x) * 10^n) + (1 / 10^n+1)) / 10^n)
 *
 * Where:
 *
 * sign is the sign of x
 * round is Math.round
 * abs is Math.abs
 * (1 / 10^n+1) is the offset.
 *
 * The offset is only used if n is more than zero. The absolute value of x
 * is used in the calculation to avoid JavaScript idiosyncracies when rounding
 * 0.5:
 * (Math.round((1.005 * 100)+0.001) / 100) === 1.01
 *
 * whereas
 * (Math.round((-1.005 * 100)+0.001) / 100) === -1
 *
 * See the description [here]( https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round)
 * for more details.
 *
 */
exports.round = function (x, n) {
    if (n === void 0) { n = 0; }
    var exp = Math.pow(10, n);
    var sign = x >= 0 ? 1 : -1;
    var offset = (n > 0) ? (1 / (Math.pow(10, n + 1))) : 0;
    return sign * (Math.round((Math.abs(x) * exp) + offset) / exp);
};

},{}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
///classNames:begin
/**
 * VERTICAL indicates an element is vertical rendererd.
 */
exports.VERTICAL = '-vertical';
/**
 * PUSHABLE indicates an element supports being pushed
 * and can have styles added to it around the concept.
 */
exports.PUSHABLE = '-pushable';
/**
 * POSITIONED indicates an element is positioned and responds
 * to the left,right etc. properties.
 */
exports.POSITIONED = '-positioned';
/**
 * BLOCK indicates an element should be block displayed.
 */
exports.BLOCK = '-block';
/**
 * CLEARFIX hack.
 */
exports.CLEARFIX = '-clearfix';
/**
 * JUSTIFIED content.
 */
exports.JUSTIFIED = '-justified';
/**
 * LEFT indicates content floated or positioned to the left.
 */
exports.LEFT = '-left';
/**
 * RIGHT indicates content floated or positioned to the right.
 */
exports.RIGHT = '-right';
/**
 * HORIZONTAL indicates a horizontal alignment.
 */
exports.HORIZONTAL = '-horizontal';
exports.MIDDLE = '-middle';
exports.BOTTOM = '-bottom';
///classNames:end
/**
 * getBlockClassName provides the __BLOCK__ class name if the attribute
 * value is set to true.
 */
exports.getBlockClassName = function (attrs) {
    return (attrs.ww && (attrs.ww.block === true)) ? exports.BLOCK : '';
};

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
///classNames:begin
exports.EXTRA_SMALL = '-extra-small';
exports.SMALL = '-small';
exports.MEDIUM = '-medium';
exports.LARGE = '-large';
exports.EXTRA_LARGE = '-extra-large';
///classNames:end
/**
 * Size
 */
var Size;
(function (Size) {
    Size["ExtraSmall"] = "extra-small";
    Size["Small"] = "small";
    Size["Medium"] = "medium";
    Size["Large"] = "large";
    Size["ExtraLarge"] = "extra-large";
})(Size = exports.Size || (exports.Size = {}));
/**
 * getSizeClassName
 */
exports.getSizeClassName = function (s) {
    if (s === Size.ExtraSmall)
        return exports.EXTRA_SMALL;
    else if (s === Size.Small)
        return exports.SMALL;
    else if (s === Size.Medium)
        return exports.MEDIUM;
    else if (s === Size.Large)
        return exports.LARGE;
    else if (s === Size.ExtraLarge)
        return exports.EXTRA_LARGE;
    return '';
};

},{}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("../../util");
///classNames:begin
/**
 * ACTIVE
 */
exports.ACTIVE = '-active';
/**
 * activate helper.
 *
 * Adds the ACTIVE class.
 */
exports.activate = function (view, id) {
    return util_1.getById(view, id)
        .map(function (e) {
        e.classList.remove(exports.ACTIVE);
        e.classList.add(exports.ACTIVE);
    });
};
/**
 * deactivate helper.
 *
 * Removes the ACTIVE class.
 */
exports.deactivate = function (view, id) {
    return util_1.getById(view, id)
        .map(function (e) { return e.classList.remove(exports.ACTIVE); });
};
/**
 * isActive helpder
 *
 * Queries whether the ACTIVE class is present.
 */
exports.isActive = function (view, id) {
    return util_1.getById(view, id)
        .map(function (e) { return e.classList.contains(exports.ACTIVE); })
        .orJust(function () { return false; })
        .get();
};

},{"../../util":48}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
///classNames:begin
/**
 * DEFAULT style.
 */
exports.DEFAULT = '-default';
/**
 * PRIMARY style.
 */
exports.PRIMARY = '-primary';
/**
 * SUCCESS style.
 */
exports.SUCCESS = '-success';
/**
 * INFO style.
 */
exports.INFO = '-info';
/**
 * WARNING style.
 */
exports.WARNING = '-warning';
/**
 * ERROR style.
 */
exports.ERROR = '-error';
/**
 * OUTLINE style.
 */
exports.OUTLINE = '-outline';
///classNames:end
/**
 * Style enum.
 */
var Style;
(function (Style) {
    Style["Default"] = "default";
    Style["Primary"] = "primary";
    Style["Success"] = "success";
    Style["Info"] = "info";
    Style["Warning"] = "warning";
    Style["Error"] = "error";
})(Style = exports.Style || (exports.Style = {}));
exports.styles = [
    Style.Default,
    Style.Success,
    Style.Info,
    Style.Warning,
    Style.Error
];
/**
 * getStyleClassName
 */
exports.getStyleClassName = function (s) {
    switch (s) {
        case Style.Default:
            return exports.DEFAULT;
        case Style.Primary:
            return exports.PRIMARY;
        case Style.Success:
            return exports.SUCCESS;
        case Style.Info:
            return exports.INFO;
        case Style.Warning:
            return exports.WARNING;
        case Style.Error:
            return exports.ERROR;
    }
    return exports.DEFAULT;
};

},{}],17:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var views = require("./wml/button");
var toolbar_1 = require("../toolbar");
var active_1 = require("../../content/state/active");
var orientation_1 = require("../../content/orientation");
var style_1 = require("../../content/style");
exports.Style = style_1.Style;
var size_1 = require("../../content/size");
var util_1 = require("../../util");
var __1 = require("../../");
var __2 = require("../");
///classNames:begin
exports.BUTTON = 'ww-button';
;
/**
 * ButtonClickedEvent
 */
var ButtonClickedEvent = /** @class */ (function (_super) {
    __extends(ButtonClickedEvent, _super);
    function ButtonClickedEvent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ButtonClickedEvent;
}(__2.Event));
exports.ButtonClickedEvent = ButtonClickedEvent;
/**
 * Button is an improvement over HTMLButtionElement
 */
var Button = /** @class */ (function (_super) {
    __extends(Button, _super);
    function Button() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = (_this.attrs.ww && _this.attrs.ww.anchor) ?
            new views.AnchorView(_this) : new views.ButtonView(_this);
        _this.values = {
            button: {
                wml: {
                    id: 'button'
                },
                id: __1.getId(_this.attrs),
                className: util_1.concat(exports.BUTTON, __1.getClassName(_this.attrs), toolbar_1.TOOLBAR_COMPAT, (_this.attrs.ww && _this.attrs.ww.style) ?
                    style_1.getStyleClassName(_this.attrs.ww.style) :
                    style_1.DEFAULT, (_this.attrs.ww && _this.attrs.ww.size) ?
                    size_1.getSizeClassName(_this.attrs.ww.size) : '', (_this.attrs.ww && _this.attrs.ww.outline) ?
                    style_1.OUTLINE : '', (_this.attrs.ww && _this.attrs.ww.block) ?
                    orientation_1.BLOCK : '', (_this.attrs.ww && _this.attrs.ww.active) ?
                    active_1.ACTIVE : ''),
                type: (_this.attrs.ww && _this.attrs.ww.type) ?
                    _this.attrs.ww.type : 'button',
                name: (_this.attrs.ww && _this.attrs.ww.name) ? _this.attrs.ww.name : '',
                disabled: (_this.attrs.ww && _this.attrs.ww.disabled) ? true : null,
                anchor: (_this.attrs.ww && _this.attrs.ww.anchor) ?
                    _this.attrs.ww.anchor : false,
                onclick: function (e) {
                    e.preventDefault();
                    _this.attrs.ww &&
                        _this.attrs.ww.onClick &&
                        _this.attrs.ww.onClick(new ButtonClickedEvent((_this.attrs.ww && _this.attrs.ww.name) ?
                            _this.attrs.ww.name : '', _this.attrs.ww.value));
                },
                content: function () { return (_this.attrs.ww && _this.attrs.ww.text) ?
                    [__1.text(_this.attrs.ww.text)] : _this.children; }
            }
        };
        return _this;
    }
    /**
     * disable this button.
     */
    Button.prototype.disable = function () {
        util_1.getById(this.view, this.values.button.wml.id)
            .map(function (b) { return b.setAttribute('disabled', 'disabled'); });
    };
    /**
     * enable this button.
     */
    Button.prototype.enable = function () {
        util_1.getById(this.view, this.values.button.wml.id)
            .map(function (b) { return b.removeAttribute('disabled'); });
    };
    /**
     * toggle the disabled state of this button.
     */
    Button.prototype.toggle = function () {
        var _this = this;
        util_1.getById(this.view, this.values.button.wml.id)
            .map(function (b) { return b.hasAttribute('disabled') ?
            _this.enable() : _this.disable(); });
    };
    return Button;
}(__2.AbstractControl));
exports.Button = Button;

},{"../":26,"../../":40,"../../content/orientation":13,"../../content/size":14,"../../content/state/active":15,"../../content/style":16,"../../util":48,"../toolbar":33,"./wml/button":18}],18:[function(require,module,exports){
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var __document = require("@quenk/wml/lib/dom");
//@ts-ignore: 6192
var maybe_1 = require("@quenk/noni/lib/data/maybe");
//@ts-ignore:6192
var __if = function (__expr, __conseq, __alt) {
    return (__expr) ? __conseq() : __alt ? __alt() : [];
};
//@ts-ignore:6192
var __forIn = function (list, f, alt) {
    var ret = [];
    for (var i = 0; i < list.length; i++)
        ret = ret.concat(f(list[i], i, list));
    return ret.length === 0 ? alt() : ret;
};
//@ts-ignore:6192
var __forOf = function (o, f, alt) {
    var ret = [];
    for (var key in o)
        if (o.hasOwnProperty(key))
            ret = ret.concat(f((o)[key], key, o));
    return ret.length === 0 ? alt() : ret;
};
var ButtonView = /** @class */ (function () {
    function ButtonView(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('button', { wml: { 'id': __context.values.button.wml.id }, 'id': __context.values.button.id, 'type': __context.values.button.type, 'name': __context.values.button.name, 'disabled': __context.values.button.disabled, 'class': __context.values.button.className, 'onclick': __context.values.button.onclick }, __spreadArrays((__context.values.button.content())));
        };
    }
    ButtonView.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    ButtonView.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    ButtonView.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    ButtonView.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    ButtonView.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    ButtonView.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    ButtonView.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    ButtonView.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return ButtonView;
}());
exports.ButtonView = ButtonView;
;
var AnchorView = /** @class */ (function () {
    function AnchorView(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('a', { wml: { 'id': __context.values.button.wml.id }, 'id': __context.values.button.id, 'type': __context.values.button.type, 'href': '#', 'name': __context.values.button.name, 'disabled': __context.values.button.disabled, 'class': __context.values.button.className, 'onclick': __context.values.button.onclick }, __spreadArrays((__context.values.button.content())));
        };
    }
    AnchorView.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    AnchorView.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    AnchorView.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    AnchorView.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    AnchorView.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    AnchorView.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    AnchorView.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    AnchorView.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return AnchorView;
}());
exports.AnchorView = AnchorView;

},{"@quenk/noni/lib/data/maybe":8,"@quenk/wml/lib/dom":49}],19:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var style = require("../content/style");
var util_1 = require("../util");
var control_1 = require("../control");
/**
 * ValidationState
 */
var ValidationState;
(function (ValidationState) {
    ValidationState["Neutral"] = "neutral";
    ValidationState["Error"] = "error";
    ValidationState["Success"] = "success";
    ValidationState["Warning"] = "warning";
})(ValidationState = exports.ValidationState || (exports.ValidationState = {}));
/**
 * AbstractFeedbackControl
 *
 * Provides a default implementaion of the interface methods.
 */
var AbstractFeedbackControl = /** @class */ (function (_super) {
    __extends(AbstractFeedbackControl, _super);
    function AbstractFeedbackControl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AbstractFeedbackControl.prototype.setMessage = function (msg) {
        exports.setMessage(this.view, this.values.messages.wml.id, msg);
        return this;
    };
    AbstractFeedbackControl.prototype.removeMessage = function () {
        exports.removeMessage(this.view, this.values.messages.wml.id);
        return this;
    };
    AbstractFeedbackControl.prototype.setValidationState = function (state) {
        exports.setValidationState(this.view, this.values.control.wml.id, state);
        return this;
    };
    AbstractFeedbackControl.prototype.removeValidationState = function () {
        exports.removeValidationState(this.view, this.values.control.wml.id);
        return this;
    };
    AbstractFeedbackControl.prototype.getValidationState = function () {
        return exports.getValidationState(this.view, this.values.control.wml.id);
    };
    return AbstractFeedbackControl;
}(control_1.AbstractControl));
exports.AbstractFeedbackControl = AbstractFeedbackControl;
/**
 * setMessage helper.
 */
exports.setMessage = function (view, id, msg) {
    return util_1.getById(view, id)
        .map(function (messages) {
        var node = document.createTextNode(msg);
        while (messages.lastChild)
            messages.removeChild(messages.lastChild);
        messages.appendChild(node);
    });
};
/**
 * removeMessage
 */
exports.removeMessage = function (view, id) {
    return util_1.getById(view, id)
        .map(function (messages) {
        while (messages.lastChild)
            messages.removeChild(messages.lastChild);
    });
};
/**
 * setValidationState helper.
 */
exports.setValidationState = function (view, id, state) {
    exports.removeValidationState(view, id);
    if (state !== ValidationState.Neutral)
        util_1.getById(view, id)
            .map(function (e) { return e.classList.add(exports.validationState2ClassName(state)); });
};
/**
 * removeValidationState helper.
 */
exports.removeValidationState = function (view, id) {
    util_1.getById(view, id)
        .map(function (h) {
        h.classList.remove(style.SUCCESS);
        h.classList.remove(style.ERROR);
        h.classList.remove(style.WARNING);
    });
};
/**
 * getValidationState calculates the ValidationState of an HTMLElement
 * (identified by id) by analysing its class list.
 */
exports.getValidationState = function (view, id) {
    return util_1.getById(view, id)
        .map(function (h) {
        if (h.classList.contains(style.SUCCESS))
            return ValidationState.Success;
        else if (h.classList.contains(style.WARNING))
            return ValidationState.Warning;
        else if (h.classList.contains(style.ERROR))
            return ValidationState.Error;
        else
            return ValidationState.Neutral;
    })
        .get();
};
/**
 * getValidityClassName provides the applicable style class by checking
 * the validity properties of FeedbackControAttrs.
 */
exports.getValidityClassName = function (attrs) {
    if (attrs.ww) {
        if (attrs.ww.error && (attrs.ww.error != ''))
            return style.ERROR;
        if (attrs.ww.warning && (attrs.ww.warning != ''))
            return style.WARNING;
        if (attrs.ww.success && (attrs.ww.success != ''))
            return style.SUCCESS;
    }
    return '';
};
/**
 * getMessage
 */
exports.getMessage = function (attrs) {
    if (attrs.ww) {
        if (attrs.ww.error && (attrs.ww.error != ''))
            return attrs.ww.error;
        if (attrs.ww.warning && (attrs.ww.warning != ''))
            return attrs.ww.warning;
        if (attrs.ww.success && (attrs.ww.success != ''))
            return attrs.ww.success;
        if (attrs.ww.message && (attrs.ww.message != ''))
            return attrs.ww.message;
    }
    return '';
};
/**
 * validationState2ClassName transforms a ValidationState into
 * the corresponding class name (if any).
 */
exports.validationState2ClassName = function (state) {
    if (state === ValidationState.Success)
        return style.SUCCESS;
    else if (state === ValidationState.Warning)
        return style.WARNING;
    else if (state === ValidationState.Error)
        return style.ERROR;
    else
        return '';
};

},{"../content/style":16,"../control":26,"../util":48}],20:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("../../util");
var __1 = require("../../");
var __2 = require("../");
var file_input_1 = require("./wml/file-input");
///classNames:begin
exports.FILE_INPUT = 'ww-file-input';
/**
 * FileChangedEvent is fired when
 */
var FileChangedEvent = /** @class */ (function (_super) {
    __extends(FileChangedEvent, _super);
    function FileChangedEvent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FileChangedEvent;
}(__2.Event));
exports.FileChangedEvent = FileChangedEvent;
/**
 * FileInput provides a surface for file selection.
 *
 * It supports drag and drop of the files as input.
 */
var FileInput = /** @class */ (function (_super) {
    __extends(FileInput, _super);
    function FileInput() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new file_input_1.FileInputView(_this);
        _this.values = {
            id: __1.getId(_this.attrs),
            className: util_1.concat(exports.FILE_INPUT, __1.getClassName(_this.attrs)),
            name: __2.getName(_this.attrs),
            accept: (_this.attrs.ww && _this.attrs.ww.accept) ?
                _this.attrs.ww.accept : '',
            multiple: (_this.attrs.ww && _this.attrs.ww.multiple) ?
                _this.attrs.ww.multiple : undefined,
            change: function (e) {
                var input = e.target;
                if ((input.files != null) &&
                    (input.files.length > 0) &&
                    _this.attrs.ww &&
                    _this.attrs.ww.onChange) {
                    _this.attrs.ww.onChange(new FileChangedEvent(input.name, exports.list2Array(input.files)));
                }
            }
        };
        return _this;
    }
    return FileInput;
}(__2.AbstractControl));
exports.FileInput = FileInput;
/**
 * list2Array converts a FileList into a plain array of files.
 */
exports.list2Array = function (list) {
    var ret = [];
    for (var i = 0; i < list.length; i++)
        ret[i] = list[i];
    return ret;
};

},{"../":26,"../../":40,"../../util":48,"./wml/file-input":21}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __document = require("@quenk/wml/lib/dom");
//@ts-ignore: 6192
var maybe_1 = require("@quenk/noni/lib/data/maybe");
//@ts-ignore:6192
var __if = function (__expr, __conseq, __alt) {
    return (__expr) ? __conseq() : __alt ? __alt() : [];
};
//@ts-ignore:6192
var __forIn = function (list, f, alt) {
    var ret = [];
    for (var i = 0; i < list.length; i++)
        ret = ret.concat(f(list[i], i, list));
    return ret.length === 0 ? alt() : ret;
};
//@ts-ignore:6192
var __forOf = function (o, f, alt) {
    var ret = [];
    for (var key in o)
        if (o.hasOwnProperty(key))
            ret = ret.concat(f((o)[key], key, o));
    return ret.length === 0 ? alt() : ret;
};
var FileInputView = /** @class */ (function () {
    function FileInputView(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('input', { 'id': __context.values.id, 'class': __context.values.className, 'name': __context.values.name, 'type': 'file', 'accept': __context.values.accept, 'onchange': __context.values.change, 'multiple': __context.values.multiple }, []);
        };
    }
    FileInputView.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    FileInputView.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    FileInputView.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    FileInputView.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    FileInputView.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    FileInputView.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    FileInputView.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    FileInputView.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return FileInputView;
}());
exports.FileInputView = FileInputView;

},{"@quenk/noni/lib/data/maybe":8,"@quenk/wml/lib/dom":49}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("../util");
/**
 * FocusGainedEvent
 */
var FocusGainedEvent = /** @class */ (function () {
    function FocusGainedEvent(name) {
        this.name = name;
    }
    return FocusGainedEvent;
}());
exports.FocusGainedEvent = FocusGainedEvent;
/**
 * FocusLostEvent
 */
var FocusLostEvent = /** @class */ (function () {
    function FocusLostEvent(name) {
        this.name = name;
    }
    return FocusLostEvent;
}());
exports.FocusLostEvent = FocusLostEvent;
/**
 * focus DOM helper.
 */
exports.focus = function (view, id) {
    util_1.getById(view, id)
        .map(function (e) { return e.focus(); });
};

},{"../util":48}],23:[function(require,module,exports){
"use strict";
/**
 * The form module deals with controls specifically for accepting user input.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("../util");
var feedback_1 = require("./feedback");
/**
 * AbstractFormControl provides a base implementation of a
 * FormControl.
 */
var AbstractFormControl = /** @class */ (function (_super) {
    __extends(AbstractFormControl, _super);
    function AbstractFormControl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return AbstractFormControl;
}(feedback_1.AbstractFeedbackControl));
exports.AbstractFormControl = AbstractFormControl;
/**
 * getLabel extracts the label value from FromControlAttrs.
 */
exports.getLabel = function (attrs) { return (attrs.ww && attrs.ww.label) ? attrs.ww.label : ''; };
/**
 * setMessage helper.
 *
 * Sets the message on the Help widget.
 */
exports.setMessage = function (view, id, msg) {
    util_1.getById(view, id).map(function (h) { h.setMessage(msg); });
};
/**
 * removeMessage helper.
 *
 * Removes the message from the Help widget.
 */
exports.removeMessage = function (view, id) {
    util_1.getById(view, id).map(function (h) { h.removeMessage(); });
};

},{"../util":48,"./feedback":19}],24:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var wml_1 = require("@quenk/wml");
var util_1 = require("../../util");
var feedback_1 = require("../feedback");
var __1 = require("../../");
var help_1 = require("./wml/help");
///classNames:begin
exports.HELP = 'ww-help';
/**
 * Help
 */
var Help = /** @class */ (function (_super) {
    __extends(Help, _super);
    function Help() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new help_1.Main(_this);
        _this.values = {
            help: {
                wml: {
                    id: 'help'
                },
                id: (_this.attrs.ww && _this.attrs.ww.id) ?
                    _this.attrs.ww.id : '',
                className: util_1.concat(exports.HELP, __1.getClassName(_this.attrs)),
                text: (_this.attrs.ww && _this.attrs.ww.text) ?
                    [document.createTextNode(_this.attrs.ww.text)] : _this.children
            }
        };
        return _this;
    }
    Help.prototype.setMessage = function (msg) {
        feedback_1.setMessage(this.view, this.values.help.wml.id, msg);
        return this;
    };
    Help.prototype.removeMessage = function () {
        feedback_1.removeMessage(this.view, this.values.help.wml.id);
        return this;
    };
    return Help;
}(wml_1.Component));
exports.Help = Help;

},{"../../":40,"../../util":48,"../feedback":19,"./wml/help":25,"@quenk/wml":50}],25:[function(require,module,exports){
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var __document = require("@quenk/wml/lib/dom");
//@ts-ignore: 6192
var maybe_1 = require("@quenk/noni/lib/data/maybe");
//@ts-ignore:6192
var __if = function (__expr, __conseq, __alt) {
    return (__expr) ? __conseq() : __alt ? __alt() : [];
};
//@ts-ignore:6192
var __forIn = function (list, f, alt) {
    var ret = [];
    for (var i = 0; i < list.length; i++)
        ret = ret.concat(f(list[i], i, list));
    return ret.length === 0 ? alt() : ret;
};
//@ts-ignore:6192
var __forOf = function (o, f, alt) {
    var ret = [];
    for (var key in o)
        if (o.hasOwnProperty(key))
            ret = ret.concat(f((o)[key], key, o));
    return ret.length === 0 ? alt() : ret;
};
var Main = /** @class */ (function () {
    function Main(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('span', { wml: { 'id': __context.values.help.wml.id }, 'id': __context.values.help.id, 'class': __context.values.help.className }, __spreadArrays((__context.values.help.text)));
        };
    }
    Main.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    Main.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    Main.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    Main.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    Main.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    Main.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    Main.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    Main.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return Main;
}());
exports.Main = Main;

},{"@quenk/noni/lib/data/maybe":8,"@quenk/wml/lib/dom":49}],26:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This module provides the parent interfaces for most of the
 * widgets considered 'controls'.
 *
 * Controls allow users to manipulate the state of an application
 * by interacting with widgets on screen. In simpler terms,
 * they are the widgets that accept user input or trigger
 * reactions when the user manipulates them.
 *
 * Generally, we use a streaming based workflow, that is
 * as the user preforms a supported action and event is generated
 * each and every time and some handler is applied to the event.
 */
/** @imports */
var wml_1 = require("@quenk/wml");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
/**
 * Event is the parent class of all events generated by controls.
 */
var Event = /** @class */ (function () {
    function Event(name, value) {
        this.name = name;
        this.value = value;
    }
    return Event;
}());
exports.Event = Event;
/**
 * AbstractControl implements the methods of the Control interface.
 */
var AbstractControl = /** @class */ (function (_super) {
    __extends(AbstractControl, _super);
    function AbstractControl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return AbstractControl;
}(wml_1.Component));
exports.AbstractControl = AbstractControl;
/**
 * getName
 */
exports.getName = function (attrs) {
    return (attrs.ww && attrs.ww.name) ? attrs.ww.name : '';
};
/**
 * getDisabled
 */
exports.getDisabled = function (attrs) {
    return (attrs.ww && attrs.ww.disabled) ? attrs.ww.disabled : undefined;
};
/**
 * getValue
 */
exports.getValue = function (attrs) {
    return (attrs.ww && attrs.ww.value) ? maybe_1.just(attrs.ww.value) : maybe_1.nothing();
};

},{"@quenk/noni/lib/data/maybe":8,"@quenk/wml":50}],27:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var wml_1 = require("@quenk/wml");
var util_1 = require("../../util");
var __1 = require("../../");
var label_1 = require("./wml/label");
///classNames:begin
exports.LABEL = 'ww-label';
/**
 * Label
 */
var Label = /** @class */ (function (_super) {
    __extends(Label, _super);
    function Label() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new label_1.Main(_this);
        _this.values = {
            label: {
                className: util_1.concat(exports.LABEL, __1.getClassName(_this.attrs)),
                for: (_this.attrs.ww && _this.attrs.ww.for) ?
                    _this.attrs.ww.for : '',
                text: (_this.attrs.ww && _this.attrs.ww.text) ?
                    [document.createTextNode(_this.attrs.ww.text)] : _this.children
            }
        };
        return _this;
    }
    return Label;
}(wml_1.Component));
exports.Label = Label;

},{"../../":40,"../../util":48,"./wml/label":28,"@quenk/wml":50}],28:[function(require,module,exports){
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var __document = require("@quenk/wml/lib/dom");
//@ts-ignore: 6192
var maybe_1 = require("@quenk/noni/lib/data/maybe");
//@ts-ignore:6192
var __if = function (__expr, __conseq, __alt) {
    return (__expr) ? __conseq() : __alt ? __alt() : [];
};
//@ts-ignore:6192
var __forIn = function (list, f, alt) {
    var ret = [];
    for (var i = 0; i < list.length; i++)
        ret = ret.concat(f(list[i], i, list));
    return ret.length === 0 ? alt() : ret;
};
//@ts-ignore:6192
var __forOf = function (o, f, alt) {
    var ret = [];
    for (var key in o)
        if (o.hasOwnProperty(key))
            ret = ret.concat(f((o)[key], key, o));
    return ret.length === 0 ? alt() : ret;
};
var Main = /** @class */ (function () {
    function Main(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('label', { 'for': __context.values.label.for, 'class': __context.values.label.className }, __spreadArrays((__context.values.label.text)));
        };
    }
    Main.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    Main.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    Main.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    Main.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    Main.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    Main.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    Main.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    Main.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return Main;
}());
exports.Main = Main;

},{"@quenk/noni/lib/data/maybe":8,"@quenk/wml/lib/dom":49}],29:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var views = require("./wml/text-field");
var util_1 = require("../../util");
var feedback_1 = require("../feedback");
var form_1 = require("../form");
var text_input_1 = require("../text-input");
exports.TextChangedEvent = text_input_1.TextChangedEvent;
var __1 = require("../../");
var __2 = require("../");
///classNames:begin
exports.TEXT_FIELD = 'ww-text-field';
/**
 * TextField provides a wrapped native text input control.
 */
var TextField = /** @class */ (function (_super) {
    __extends(TextField, _super);
    function TextField() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new views.Main(_this);
        _this.values = {
            root: {
                wml: {
                    id: 'root'
                },
                className: util_1.concat(exports.TEXT_FIELD, __1.getClassName(_this.attrs), feedback_1.getValidityClassName(_this.attrs))
            },
            messages: {
                wml: {
                    id: 'message'
                },
                text: feedback_1.getMessage(_this.attrs)
            },
            label: {
                id: __2.getName(_this.attrs),
                text: form_1.getLabel(_this.attrs)
            },
            control: {
                wml: {
                    id: 'control'
                },
                id: __1.getId(_this.attrs),
                name: __2.getName(_this.attrs),
                type: (_this.attrs.ww && _this.attrs.ww.type) ?
                    _this.attrs.ww.type : 'text',
                min: (_this.attrs.ww && _this.attrs.ww.min) ?
                    _this.attrs.ww.min : undefined,
                max: (_this.attrs.ww && _this.attrs.ww.max) ?
                    _this.attrs.ww.max : undefined,
                focus: (_this.attrs.ww && _this.attrs.ww.focus) ?
                    _this.attrs.ww.focus : undefined,
                placeholder: (_this.attrs.ww && _this.attrs.ww.placeholder) ?
                    _this.attrs.ww.placeholder : '',
                match: (_this.attrs.ww && _this.attrs.ww.match) ?
                    _this.attrs.ww.match : undefined,
                length: (_this.attrs.ww && _this.attrs.ww.length) ?
                    _this.attrs.ww.length : undefined,
                value: (_this.attrs.ww && _this.attrs.ww.value) ?
                    _this.attrs.ww.value : '',
                disabled: (_this.attrs.ww && _this.attrs.ww.disabled) ? true : undefined,
                readOnly: (_this.attrs.ww && _this.attrs.ww.readOnly) ?
                    true : undefined,
                rows: (_this.attrs.ww && _this.attrs.ww.rows) ?
                    _this.attrs.ww.rows : 1,
                oninput: (_this.attrs.ww && _this.attrs.ww.onChange) ?
                    oninput(_this) : function () { },
                onChange: (_this.attrs.ww && _this.attrs.ww.onChange) ?
                    _this.attrs.ww.onChange : function () { }
            }
        };
        return _this;
    }
    TextField.prototype.setMessage = function (msg) {
        getHelp(this).map(function (h) { return h.setMessage(msg); });
        return this;
    };
    TextField.prototype.removeMessage = function () {
        getHelp(this).map(function (h) { return h.removeMessage(); });
        return this;
    };
    return TextField;
}(form_1.AbstractFormControl));
exports.TextField = TextField;
var getHelp = function (t) {
    return util_1.getById(t.view, t.values.messages.wml.id);
};
var oninput = function (f) { return function (e) {
    if (f.attrs.ww && f.attrs.ww && f.attrs.ww.onChange)
        f.attrs.ww.onChange(new text_input_1.TextChangedEvent((f.attrs.ww && f.attrs.ww.name) ?
            f.attrs.ww.name : '', e.target.value));
}; };

},{"../":26,"../../":40,"../../util":48,"../feedback":19,"../form":23,"../text-input":31,"./wml/text-field":30}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __document = require("@quenk/wml/lib/dom");
//@ts-ignore: 6192
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var label_1 = require("../../label");
;
var help_1 = require("../../help");
;
var text_input_1 = require("../../text-input");
;
//@ts-ignore:6192
var __if = function (__expr, __conseq, __alt) {
    return (__expr) ? __conseq() : __alt ? __alt() : [];
};
//@ts-ignore:6192
var __forIn = function (list, f, alt) {
    var ret = [];
    for (var i = 0; i < list.length; i++)
        ret = ret.concat(f(list[i], i, list));
    return ret.length === 0 ? alt() : ret;
};
//@ts-ignore:6192
var __forOf = function (o, f, alt) {
    var ret = [];
    for (var key in o)
        if (o.hasOwnProperty(key))
            ret = ret.concat(f((o)[key], key, o));
    return ret.length === 0 ? alt() : ret;
};
var Main = /** @class */ (function () {
    function Main(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('div', { wml: { 'id': __context.values.root.wml.id }, 'class': __context.values.root.className }, [
                __this.widget(new label_1.Label({ ww: { 'for': __context.values.control.id, 'text': __context.values.label.text } }, []), { ww: { 'for': __context.values.control.id, 'text': __context.values.label.text } }),
                __this.widget(new text_input_1.TextInput({ ww: { 'id': __context.values.control.id, 'name': __context.values.control.name, 'focus': __context.values.control.focus, 'placeholder': __context.values.control.placeholder, 'onChange': __context.values.control.onChange, 'block': true, 'type': __context.values.control.type, 'min': __context.values.control.min, 'max': __context.values.control.max, 'match': __context.values.control.match, 'length': __context.values.control.length, 'value': __context.values.control.value, 'rows': __context.values.control.rows, 'disabled': __context.values.control.disabled, 'readOnly': __context.values.control.readOnly } }, []), { ww: { 'id': __context.values.control.id, 'name': __context.values.control.name, 'focus': __context.values.control.focus, 'placeholder': __context.values.control.placeholder, 'onChange': __context.values.control.onChange, 'block': true, 'type': __context.values.control.type, 'min': __context.values.control.min, 'max': __context.values.control.max, 'match': __context.values.control.match, 'length': __context.values.control.length, 'value': __context.values.control.value, 'rows': __context.values.control.rows, 'disabled': __context.values.control.disabled, 'readOnly': __context.values.control.readOnly } }),
                __this.widget(new help_1.Help({ wml: { 'id': __context.values.messages.wml.id }, ww: { 'text': __context.values.messages.text } }, []), { wml: { 'id': __context.values.messages.wml.id }, ww: { 'text': __context.values.messages.text } })
            ]);
        };
    }
    Main.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    Main.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    Main.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    Main.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    Main.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    Main.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    Main.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    Main.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return Main;
}());
exports.Main = Main;

},{"../../help":24,"../../label":27,"../../text-input":31,"@quenk/noni/lib/data/maybe":8,"@quenk/wml/lib/dom":49}],31:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var views = require("./wml/text-input");
var timer_1 = require("@quenk/noni/lib/control/timer");
var util_1 = require("../../util");
var orientation_1 = require("../../content/orientation");
var size_1 = require("../../content/size");
var focus_1 = require("../focus");
var __1 = require("../../");
var __2 = require("../");
///classNames:begin
exports.TEXT_INPUT = 'ww-text-input';
/**
 * TextChangedEvent
 */
var TextChangedEvent = /** @class */ (function (_super) {
    __extends(TextChangedEvent, _super);
    function TextChangedEvent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TextChangedEvent;
}(__2.Event));
exports.TextChangedEvent = TextChangedEvent;
/**
 * TextInput provides some extra styling to the native input.
 */
var TextInput = /** @class */ (function (_super) {
    __extends(TextInput, _super);
    function TextInput() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = (_this.attrs.ww && _this.attrs.ww.rows && _this.attrs.ww.rows > 1) ?
            new views.Textarea(_this) : new views.Input(_this);
        _this.values = {
            control: {
                wml: {
                    id: 'root'
                }
            },
            id: __1.getId(_this.attrs),
            className: util_1.concat(exports.TEXT_INPUT, __1.getClassName(_this.attrs), (_this.attrs.ww && _this.attrs.ww.size) ?
                size_1.getSizeClassName(_this.attrs.ww.size) : '', (_this.attrs.ww && _this.attrs.ww.block) ?
                orientation_1.BLOCK : ''),
            name: __2.getName(_this.attrs),
            type: (_this.attrs.ww && _this.attrs.ww.type) ?
                _this.attrs.ww.type : 'text',
            min: (_this.attrs.ww && _this.attrs.ww.min) ?
                String(_this.attrs.ww.min) : null,
            max: (_this.attrs.ww && _this.attrs.ww.max) ?
                String(_this.attrs.ww.max) : null,
            match: new RegExp((_this.attrs.ww && _this.attrs.ww.match) ?
                _this.attrs.ww.match : '.'),
            length: (_this.attrs.ww && _this.attrs.ww.length) ?
                _this.attrs.ww.length : Infinity,
            placeholder: (_this.attrs.ww && _this.attrs.ww.placeholder) ?
                _this.attrs.ww.placeholder : '',
            value: (_this.attrs.ww && _this.attrs.ww.value) ?
                _this.attrs.ww.value : '',
            rows: String((_this.attrs.ww && _this.attrs.ww.rows) ?
                _this.attrs.ww.rows : 1),
            disabled: (_this.attrs.ww && _this.attrs.ww.disabled === true) ?
                true : null,
            readOnly: (_this.attrs.ww && _this.attrs.ww.readOnly === true) ?
                true : null,
            onkeydown: function (e) {
                if (e.key.length === 1) {
                    var value = e.target.value || '';
                    if ((!_this.values.match.test(e.key)) ||
                        (value.length > _this.values.length))
                        e.preventDefault();
                }
            },
            oninput: dispatchInput(_this),
            autofocus: (_this.attrs.ww && _this.attrs.ww.focus) ? true : undefined,
            onfocus: function () {
                if (_this.attrs.ww && _this.attrs.ww.onFocusGained)
                    _this.attrs.ww.onFocusGained(new focus_1.FocusGainedEvent(__2.getName(_this.attrs)));
            },
            onblur: function () {
                if (_this.attrs.ww && _this.attrs.ww.onFocusLost)
                    _this.attrs.ww.onFocusLost(new focus_1.FocusLostEvent(__2.getName(_this.attrs)));
            }
        };
        return _this;
    }
    TextInput.prototype.rendered = function () {
        if (this.values.autofocus === true)
            this.focus();
    };
    TextInput.prototype.focus = function () {
        var _this = this;
        return timer_1.tick(function () { return focus_1.focus(_this.view, _this.values.control.wml.id); });
    };
    return TextInput;
}(__2.AbstractControl));
exports.TextInput = TextInput;
/**
 * dispatchInput when the user inputs some text.
 */
var dispatchInput = function (i) { return function (e) {
    if (i.attrs.ww && i.attrs.ww.onChange)
        i.attrs.ww.onChange(new TextChangedEvent((i.attrs && i.attrs.ww.name) ?
            i.attrs.ww.name : '', e.target.value));
}; };

},{"../":26,"../../":40,"../../content/orientation":13,"../../content/size":14,"../../util":48,"../focus":22,"./wml/text-input":32,"@quenk/noni/lib/control/timer":3}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __document = require("@quenk/wml/lib/dom");
//@ts-ignore: 6192
var maybe_1 = require("@quenk/noni/lib/data/maybe");
//@ts-ignore:6192
var __if = function (__expr, __conseq, __alt) {
    return (__expr) ? __conseq() : __alt ? __alt() : [];
};
//@ts-ignore:6192
var __forIn = function (list, f, alt) {
    var ret = [];
    for (var i = 0; i < list.length; i++)
        ret = ret.concat(f(list[i], i, list));
    return ret.length === 0 ? alt() : ret;
};
//@ts-ignore:6192
var __forOf = function (o, f, alt) {
    var ret = [];
    for (var key in o)
        if (o.hasOwnProperty(key))
            ret = ret.concat(f((o)[key], key, o));
    return ret.length === 0 ? alt() : ret;
};
var Textarea = /** @class */ (function () {
    function Textarea(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('textarea', { wml: { 'id': __context.values.control.wml.id }, 'id': __context.values.id, 'name': __context.values.name, 'placeholder': __context.values.placeholder, 'oninput': __context.values.oninput, 'value': __context.values.value, 'disabled': __context.values.disabled, 'readonly': __context.values.readOnly, 'rows': __context.values.rows, 'class': __context.values.className }, [
                document.createTextNode(__context.values.value)
            ]);
        };
    }
    Textarea.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    Textarea.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    Textarea.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    Textarea.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    Textarea.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    Textarea.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    Textarea.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    Textarea.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return Textarea;
}());
exports.Textarea = Textarea;
;
var Input = /** @class */ (function () {
    function Input(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('input', { wml: { 'id': __context.values.control.wml.id }, 'id': __context.values.id, 'name': __context.values.name, 'type': __context.values.type, 'min': __context.values.min, 'max': __context.values.max, 'placeholder': __context.values.placeholder, 'oninput': __context.values.oninput, 'onkeydown': __context.values.onkeydown, 'autofocus': __context.values.autofocus, 'value': __context.values.value, 'disabled': __context.values.disabled, 'readonly': __context.values.readOnly, 'class': __context.values.className }, []);
        };
    }
    Input.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    Input.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    Input.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    Input.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    Input.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    Input.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    Input.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    Input.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return Input;
}());
exports.Input = Input;

},{"@quenk/noni/lib/data/maybe":8,"@quenk/wml/lib/dom":49}],33:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var views = require("./wml/toolbar");
var wml_1 = require("@quenk/wml");
var util_1 = require("../../util");
var __1 = require("../../");
///classNames:begin
exports.TOOLBAR = 'ww-toolbar';
exports.TOOLBAR_COMPAT = '-toolbar-compat';
/**
 * Toolbar provides a widget for grouping related controls into a
 * single row.
 */
var Toolbar = /** @class */ (function (_super) {
    __extends(Toolbar, _super);
    function Toolbar() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new views.Main(_this);
        _this.values = {
            root: {
                id: __1.getId(_this.attrs),
                className: util_1.concat(exports.TOOLBAR, __1.getClassName(_this.attrs))
            }
        };
        return _this;
    }
    return Toolbar;
}(wml_1.Component));
exports.Toolbar = Toolbar;

},{"../../":40,"../../util":48,"./wml/toolbar":34,"@quenk/wml":50}],34:[function(require,module,exports){
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var __document = require("@quenk/wml/lib/dom");
//@ts-ignore: 6192
var maybe_1 = require("@quenk/noni/lib/data/maybe");
//@ts-ignore:6192
var __if = function (__expr, __conseq, __alt) {
    return (__expr) ? __conseq() : __alt ? __alt() : [];
};
//@ts-ignore:6192
var __forIn = function (list, f, alt) {
    var ret = [];
    for (var i = 0; i < list.length; i++)
        ret = ret.concat(f(list[i], i, list));
    return ret.length === 0 ? alt() : ret;
};
//@ts-ignore:6192
var __forOf = function (o, f, alt) {
    var ret = [];
    for (var key in o)
        if (o.hasOwnProperty(key))
            ret = ret.concat(f((o)[key], key, o));
    return ret.length === 0 ? alt() : ret;
};
var Main = /** @class */ (function () {
    function Main(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('div', { 'id': __context.values.root.id, 'class': __context.values.root.className }, __spreadArrays((__context.children)));
        };
    }
    Main.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    Main.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    Main.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    Main.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    Main.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    Main.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    Main.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    Main.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return Main;
}());
exports.Main = Main;

},{"@quenk/noni/lib/data/maybe":8,"@quenk/wml/lib/dom":49}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("@quenk/noni/lib/data/record/path");
var sort_1 = require("@quenk/noni/lib/data/array/sort");
/**
 * SortRequest contains the info needed to preform a sort.
 */
var SortRequest = /** @class */ (function () {
    function SortRequest(column, data, key) {
        this.column = column;
        this.data = data;
        this.key = key;
    }
    return SortRequest;
}());
exports.SortRequest = SortRequest;
/**
 * sortById sorts a dataset by a column using the columns id.
 *
 * Data is only sorted by one column at a time.
 */
exports.sortById = function (cols, key, data, id) {
    var spec = cols[id];
    var current = data[0], original = data[1];
    if (spec === undefined)
        return [current, key];
    if (!spec.sort)
        return [current, key];
    if (key[0] === id) {
        return [current.reverse(), [key[0], key[1] * -1]];
    }
    else {
        var strategy = getSortStrategy(spec.sort);
        var alias = spec.alias ? spec.alias : spec.name;
        return [doSort(original.slice(), strategy, alias), [id, -1]];
    }
};
var getSortStrategy = function (s) {
    if (typeof s === 'function')
        return s;
    if (s === 'date')
        return sort_1.date;
    if (s === 'number')
        return sort_1.number;
    if (s === 'string')
        return sort_1.string;
    return sort_1.natural;
};
var doSort = function (data, s, alias) {
    return data.sort(function (a, b) { return s(getAny(alias, a), getAny(alias, b)); });
};
var getAny = function (path, src) {
    return path_1.getDefault(path, src, undefined);
};

},{"@quenk/noni/lib/data/array/sort":5,"@quenk/noni/lib/data/record/path":10}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * HeadingClickedEvent is triggered when the user clicks on
 * one of the column headings.
 */
var HeadingClickedEvent = /** @class */ (function () {
    function HeadingClickedEvent(column) {
        this.column = column;
    }
    return HeadingClickedEvent;
}());
exports.HeadingClickedEvent = HeadingClickedEvent;
/**
 * CellClickedEvent triggered when a cell is clicked on.
 */
var CellClickedEvent = /** @class */ (function () {
    function CellClickedEvent(column, row) {
        this.column = column;
        this.row = row;
    }
    return CellClickedEvent;
}());
exports.CellClickedEvent = CellClickedEvent;
/**
 * DataChangedEvent generated when the internal representation of the data
 * changes.
 */
var DataChangedEvent = /** @class */ (function () {
    function DataChangedEvent(name, data, key) {
        this.name = name;
        this.data = data;
        this.key = key;
    }
    return DataChangedEvent;
}());
exports.DataChangedEvent = DataChangedEvent;

},{}],37:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var views = require("./wml/table");
var wml_1 = require("@quenk/wml");
var array_1 = require("@quenk/noni/lib/data/array");
var path_1 = require("@quenk/noni/lib/data/record/path");
var util_1 = require("../../util");
var __1 = require("../../");
var sort_1 = require("./column/sort");
exports.SortRequest = sort_1.SortRequest;
var event_1 = require("./event");
exports.DataChangedEvent = event_1.DataChangedEvent;
exports.CellClickedEvent = event_1.CellClickedEvent;
exports.HeadingClickedEvent = event_1.HeadingClickedEvent;
var range_1 = require("./range");
///classNames:begin
exports.DATA_TABLE = 'ww-data-table';
exports.DATA_TABLE_HEAD = 'ww-data-table__head';
exports.DATA_TABLE_HEADING = 'ww-data-table__heading';
exports.DATA_TABLE_BODY = 'ww-data-table__body';
exports.DATA_TABLE_CELL = 'ww-data-table__cell';
exports.ASC = '-asc';
exports.DESC = '-desc';
/**
 * NewHeadContext
 */
var NewHeadContext = /** @class */ (function () {
    function NewHeadContext(table) {
        var _this = this;
        this.table = table;
        this.className = util_1.concat(exports.DATA_TABLE_HEAD, (this.table.attrs.ww && this.table.attrs.ww.headClassName || ''));
        this.columns = this.table.values.columns;
        this.data = this.table.values.dataset[0];
        this.heading = function (c, i) {
            return getHeadingView(_this.table, new NewHeadingContext(_this.table, _this, c, i), c).render();
        };
    }
    return NewHeadContext;
}());
exports.NewHeadContext = NewHeadContext;
/**
 * NewHeadingContext
 */
var NewHeadingContext = /** @class */ (function () {
    function NewHeadingContext(table, headContext, column, index) {
        var _this = this;
        this.table = table;
        this.headContext = headContext;
        this.column = column;
        this.index = index;
        this.className = util_1.concat(exports.DATA_TABLE_HEADING, (this.table.attrs.ww && this.table.attrs.ww.headingClassName || ''), this.column.headingClassName, getSortClassName(this.table.values.sortKey, this.index));
        this.onclick = function (_) {
            if (_this.column.sort)
                _this.table.values.sort(_this.index);
            if (_this.column.onHeadingClicked)
                _this.column.onHeadingClicked(new event_1.HeadingClickedEvent(_this.index));
            if (_this.table.attrs.ww && _this.table.attrs.ww.onHeadingClicked)
                _this.table.attrs.ww.onHeadingClicked(new event_1.HeadingClickedEvent(_this.index));
        };
    }
    return NewHeadingContext;
}());
exports.NewHeadingContext = NewHeadingContext;
/**
 * NewBodyContext
 */
var NewBodyContext = /** @class */ (function () {
    function NewBodyContext(table) {
        var _this = this;
        this.table = table;
        this.className = util_1.concat(exports.DATA_TABLE_BODY, (this.table.attrs.ww && this.table.attrs.ww.bodyClassName || ''));
        this.columns = this.table.values.columns;
        this.data = this.table.values.dataset[0];
        this.cell = function (c, id, row) {
            return getCellView(_this.table, new NewCellContext(_this.table, _this, c, id, row), c).render();
        };
    }
    return NewBodyContext;
}());
exports.NewBodyContext = NewBodyContext;
/**
 * NewCellContext
 */
var NewCellContext = /** @class */ (function () {
    function NewCellContext(table, bodyContext, spec, column, row) {
        var _this = this;
        this.table = table;
        this.bodyContext = bodyContext;
        this.spec = spec;
        this.column = column;
        this.row = row;
        this.id = cellId(this.column, this.row);
        this.className = util_1.concat(exports.DATA_TABLE_CELL, (this.table.attrs.ww && this.table.attrs.ww.cellClassName || ''), this.spec.cellClassName, getSortClassName(this.table.values.sortKey, this.column));
        this.value = path_1.unsafeGet(this.spec.name, this.table.values.dataset[0][this.row]);
        this.datum = this.table.values.dataset[0][this.row];
        this.format = this.spec.format ?
            this.spec.format :
            function (c) { return String(c == null ? '' : c); };
        this.onclick = function () {
            if (_this.spec.onCellClicked)
                _this.spec.onCellClicked(new event_1.CellClickedEvent(_this.column, _this.row));
            if (_this.table.attrs.ww && _this.table.attrs.ww.onCellClicked)
                _this.table.attrs.ww.onCellClicked(new event_1.CellClickedEvent(_this.column, _this.row));
        };
    }
    return NewCellContext;
}());
exports.NewCellContext = NewCellContext;
/**
 * DataTable can be used for displaying sortable
 * tabular data.
 */
var DataTable = /** @class */ (function (_super) {
    __extends(DataTable, _super);
    function DataTable() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new views.Main(_this);
        _this.theadView = new views.EmptyView({});
        _this.tbodyView = new views.EmptyView({});
        _this.values = {
            wml: { id: 'table' },
            id: __1.getId(_this.attrs),
            className: util_1.concat(exports.DATA_TABLE, __1.getClassName(_this.attrs)),
            name: (_this.attrs.ww && _this.attrs.ww.name || ''),
            sortable: (_this.attrs.ww && (_this.attrs.ww.sortable != null)) ?
                _this.attrs.ww.sortable : true,
            sortKey: ((_this.attrs.ww && _this.attrs.ww.sortKey) ?
                _this.attrs.ww.sortKey : [-1, 1]),
            sort: function (col) {
                if (_this.values.sortable)
                    _this.sort(col);
            },
            dataset: ((_this.attrs.ww && _this.attrs.ww.data) ?
                [_this.attrs.ww.data.slice(), _this.attrs.ww.data.slice()] :
                [[], []]),
            columns: (_this.attrs.ww && _this.attrs.ww.columns) ?
                _this.attrs.ww.columns : [],
            thead: function () {
                _this.theadView = getHeadView(_this, new NewHeadContext(_this));
                return _this.theadView.render();
            },
            tbody: function () {
                _this.tbodyView = getBodyView(_this, new NewBodyContext(_this));
                return _this.tbodyView.render();
            }
        };
        return _this;
    }
    /**
     * @private
     */
    DataTable.prototype.fireChange = function () {
        if (this.attrs.ww && this.attrs.ww.onChange)
            this.attrs.ww.onChange(new event_1.DataChangedEvent(this.values.name, this.values.dataset[0].slice(), this.values.sortKey.slice()));
    };
    /**
     * update the data displayed with a new data.
     */
    DataTable.prototype.update = function (data) {
        this.values.dataset = [data.slice(), data.slice()];
        this.view.invalidate();
        this.fireChange();
        return this;
    };
    /**
     * updateWithSortKey is like update but will set the sort key as well.
     */
    DataTable.prototype.updateWithSortKey = function (data, key) {
        this.values.sortKey = key;
        this.update(data);
        return this;
    };
    /**
     * sort the table data by the column id specified.
     *
     * The data can only be sorted by one column at a time and that column
     * must specify the "sort" key.
     *
     * This method causes a repaint.
     */
    DataTable.prototype.sort = function (id) {
        var _a = this.values, sortKey = _a.sortKey, dataset = _a.dataset;
        var del = getSortDelegate(this);
        var _b = del(new sort_1.SortRequest(id, dataset[1], sortKey)), data = _b[0], key = _b[1];
        this.values.dataset[0] = data;
        this.values.sortKey = key;
        this.view.invalidate();
        this.fireChange();
        return this;
    };
    /**
     * getRow returns a Range of HTMLTableCellElements for the row
     * that matches the provided id.
     *
     * If no rows are found by that id, the Range will be empty.
     * In order for this method to work the body view MUST include
     * the wml:id on each <tr> element that represents a row of data.
     */
    DataTable.prototype.getRow = function (row) {
        var mTr = util_1.getById(this.tbodyView, "" + row);
        if (mTr.isNothing())
            return new range_1.RangeInstance([]);
        var tr = mTr.get();
        return new range_1.RangeInstance(array_1.make(tr.cells.length, function (n) { return tr.cells[n]; }));
    };
    /**
     * getCell provides a Range containing a cell located at the
     * intersection of the column and row.
     */
    DataTable.prototype.getCell = function (column, row) {
        var cells = this.getRow(row).cells;
        if (!cells[column])
            return new range_1.RangeInstance([]);
        return new range_1.RangeInstance([cells[column]]);
    };
    return DataTable;
}(wml_1.Component));
exports.DataTable = DataTable;
var getHeadView = function (table, ctx) {
    return (table.attrs.ww && table.attrs.ww.headFragment) ?
        table.attrs.ww.headFragment(ctx) : new views.HeadView(ctx);
};
var getHeadingView = function (table, ctx, c) {
    return c.headingFragment ? c.headingFragment(ctx) :
        (table.attrs.ww && table.attrs.ww.headingFragment) ?
            table.attrs.ww.headingFragment(ctx) : new views.HeadingView(ctx);
};
var getBodyView = function (table, ctx) {
    return (table.attrs.ww && table.attrs.ww.bodyFragment) ?
        table.attrs.ww.bodyFragment(ctx) :
        new views.BodyView(ctx);
};
var getCellView = function (table, ctx, c) {
    return c.cellFragment ? c.cellFragment(ctx) :
        (table.attrs.ww && table.attrs.ww.cellFragment) ?
            table.attrs.ww.cellFragment(ctx) :
            new views.CellView(ctx);
};
var getSortDelegate = function (table) {
    return (table.attrs.ww && table.attrs.ww.sortDelegate) ?
        table.attrs.ww.sortDelegate :
        function (r) { return sort_1.sortById(table.values.columns, r.key, [table.values.dataset[0], r.data], r.column); };
};
var getSortClassName = function (key, index) {
    return (key[0] === index) ? (key[1] === 1) ? exports.ASC : exports.DESC : '';
};
var cellId = function (column, row) { return column + "," + row; };

},{"../../":40,"../../util":48,"./column/sort":35,"./event":36,"./range":38,"./wml/table":39,"@quenk/noni/lib/data/array":4,"@quenk/noni/lib/data/record/path":10,"@quenk/wml":50}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * RangeInstance
 */
var RangeInstance = /** @class */ (function () {
    function RangeInstance(cells) {
        this.cells = cells;
    }
    return RangeInstance;
}());
exports.RangeInstance = RangeInstance;

},{}],39:[function(require,module,exports){
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var __document = require("@quenk/wml/lib/dom");
//@ts-ignore: 6192
var maybe_1 = require("@quenk/noni/lib/data/maybe");
;
var table_1 = require("../../../layout/table");
;
var __1 = require("../../../");
;
//@ts-ignore:6192
var __if = function (__expr, __conseq, __alt) {
    return (__expr) ? __conseq() : __alt ? __alt() : [];
};
//@ts-ignore:6192
var __forIn = function (list, f, alt) {
    var ret = [];
    for (var i = 0; i < list.length; i++)
        ret = ret.concat(f(list[i], i, list));
    return ret.length === 0 ? alt() : ret;
};
//@ts-ignore:6192
var __forOf = function (o, f, alt) {
    var ret = [];
    for (var key in o)
        if (o.hasOwnProperty(key))
            ret = ret.concat(f((o)[key], key, o));
    return ret.length === 0 ? alt() : ret;
};
var EmptyView = /** @class */ (function () {
    function EmptyView(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('div', {}, []);
        };
    }
    EmptyView.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    EmptyView.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    EmptyView.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    EmptyView.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    EmptyView.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    EmptyView.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    EmptyView.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    EmptyView.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return EmptyView;
}());
exports.EmptyView = EmptyView;
;
var HeadView = /** @class */ (function () {
    function HeadView(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('thead', { 'class': __context.className }, [
                __this.node('tr', {}, __spreadArrays(__forIn(__context.columns, function (col, idx, _$$all) {
                    return ([
                        __context.heading(col, idx)
                    ]);
                }, function () { return ([]); })))
            ]);
        };
    }
    HeadView.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    HeadView.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    HeadView.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    HeadView.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    HeadView.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    HeadView.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    HeadView.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    HeadView.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return HeadView;
}());
exports.HeadView = HeadView;
;
var HeadingView = /** @class */ (function () {
    function HeadingView(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('th', { 'class': __context.className, 'onclick': __context.onclick }, [
                __1.text(__context.column.heading)
            ]);
        };
    }
    HeadingView.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    HeadingView.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    HeadingView.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    HeadingView.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    HeadingView.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    HeadingView.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    HeadingView.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    HeadingView.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return HeadingView;
}());
exports.HeadingView = HeadingView;
;
var BodyView = /** @class */ (function () {
    function BodyView(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('tbody', { 'class': __context.className }, __spreadArrays(__forIn(__context.data, function (_, row, _$$all) {
                return ([
                    __this.node('tr', { wml: { 'id': String(row) } }, __spreadArrays(__forIn(__context.columns, function (col, idx, _$$all) {
                        return ([
                            __context.cell(col, idx, row)
                        ]);
                    }, function () { return ([]); })))
                ]);
            }, function () { return ([]); })));
        };
    }
    BodyView.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    BodyView.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    BodyView.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    BodyView.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    BodyView.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    BodyView.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    BodyView.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    BodyView.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return BodyView;
}());
exports.BodyView = BodyView;
;
var CellView = /** @class */ (function () {
    function CellView(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('td', { wml: { 'id': __context.id }, 'class': __context.className, 'onclick': __context.onclick }, [
                __1.text(__context.format(__context.value))
            ]);
        };
    }
    CellView.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    CellView.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    CellView.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    CellView.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    CellView.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    CellView.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    CellView.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    CellView.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return CellView;
}());
exports.CellView = CellView;
;
var Main = /** @class */ (function () {
    function Main(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.widget(new table_1.TableLayout({ wml: { 'id': __context.values.wml.id }, ww: { 'id': __context.values.id, 'className': __context.values.className } }, [
                __context.values.thead(),
                __context.values.tbody()
            ]), { wml: { 'id': __context.values.wml.id }, ww: { 'id': __context.values.id, 'className': __context.values.className } });
        };
    }
    Main.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    Main.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    Main.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    Main.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    Main.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    Main.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    Main.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    Main.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return Main;
}());
exports.Main = Main;

},{"../../../":40,"../../../layout/table":46,"@quenk/noni/lib/data/maybe":8,"@quenk/wml/lib/dom":49}],40:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * getId from a widget's passed attributes.
 */
exports.getId = function (attrs) {
    return (attrs.ww && attrs.ww.id) ? attrs.ww.id : '';
};
/**
 * getClassName from a widget's passed attributes.
 */
exports.getClassName = function (attrs) {
    return (attrs.ww && attrs.ww.className) ? attrs.ww.className : '';
};
/**
 * text constructor.
 */
exports.text = function (str) {
    return document.createTextNode(String((str == null) ? '' : str));
};

},{}],41:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var views = require("./wml/grid");
var util_1 = require("../../util");
var __1 = require("../");
///classNames:begin
exports.GRID_LAYOUT = 'ww-grid-layout';
exports.GRID_LAYOUT_ROW = 'ww-grid-layout__row';
exports.GRID_LAYOUT_COLUMN = 'ww-grid-layout__column';
;
/**
 * GridLayout
 */
var GridLayout = /** @class */ (function (_super) {
    __extends(GridLayout, _super);
    function GridLayout() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new views.GridLayout(_this);
        _this.values = {
            content: {
                id: _this.attrs.ww && _this.attrs.ww.id,
                wml: {
                    id: 'root',
                },
                className: function () {
                    var c = (_this.attrs.ww && _this.attrs.ww.className) ?
                        _this.attrs.ww.className : '';
                    return util_1.concat(exports.GRID_LAYOUT, __1.LAYOUT, c);
                }
            }
        };
        return _this;
    }
    return GridLayout;
}(__1.AbstractLayout));
exports.GridLayout = GridLayout;
/**
 * Row
 */
var Row = /** @class */ (function (_super) {
    __extends(Row, _super);
    function Row() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new views.Row(_this);
        _this.values = {
            content: {
                id: _this.attrs.ww && _this.attrs.ww.id,
                wml: {
                    id: 'row',
                },
                className: function () {
                    var c = (_this.attrs.ww && _this.attrs.ww.className) ?
                        _this.attrs.ww.className : '';
                    return util_1.concat(exports.GRID_LAYOUT_ROW, c);
                }
            }
        };
        return _this;
    }
    return Row;
}(__1.AbstractLayout));
exports.Row = Row;
/**
 * Column
 */
var Column = /** @class */ (function (_super) {
    __extends(Column, _super);
    function Column() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new views.Column(_this);
        _this.values = {
            content: {
                id: _this.attrs.ww && _this.attrs.ww.id,
                wml: {
                    id: 'column'
                },
                className: function () {
                    if (_this.attrs.ww != null) {
                        return util_1.concat(exports.GRID_LAYOUT_COLUMN, _this.attrs.ww.span ?
                            "-span" + _this.attrs.ww.span :
                            '-span12', _this.attrs.ww.offset ?
                            "-offset" + _this.attrs.ww.offset :
                            '', _this.attrs.ww.className);
                    }
                    else {
                        return util_1.concat(exports.GRID_LAYOUT_COLUMN, '-span12');
                    }
                }
            }
        };
        return _this;
    }
    return Column;
}(__1.AbstractLayout));
exports.Column = Column;

},{"../":43,"../../util":48,"./wml/grid":42}],42:[function(require,module,exports){
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var __document = require("@quenk/wml/lib/dom");
//@ts-ignore: 6192
var maybe_1 = require("@quenk/noni/lib/data/maybe");
//@ts-ignore:6192
var __if = function (__expr, __conseq, __alt) {
    return (__expr) ? __conseq() : __alt ? __alt() : [];
};
//@ts-ignore:6192
var __forIn = function (list, f, alt) {
    var ret = [];
    for (var i = 0; i < list.length; i++)
        ret = ret.concat(f(list[i], i, list));
    return ret.length === 0 ? alt() : ret;
};
//@ts-ignore:6192
var __forOf = function (o, f, alt) {
    var ret = [];
    for (var key in o)
        if (o.hasOwnProperty(key))
            ret = ret.concat(f((o)[key], key, o));
    return ret.length === 0 ? alt() : ret;
};
var GridLayout = /** @class */ (function () {
    function GridLayout(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('div', { wml: { 'id': __context.values.content.wml.id }, 'id': __context.values.content.id, 'class': __context.values.content.className() }, __spreadArrays((__context.children)));
        };
    }
    GridLayout.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    GridLayout.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    GridLayout.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    GridLayout.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    GridLayout.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    GridLayout.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    GridLayout.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    GridLayout.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return GridLayout;
}());
exports.GridLayout = GridLayout;
;
var Row = /** @class */ (function () {
    function Row(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('div', { wml: { 'id': __context.values.content.wml.id }, 'id': __context.values.content.id, 'class': __context.values.content.className() }, __spreadArrays((__context.children)));
        };
    }
    Row.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    Row.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    Row.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    Row.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    Row.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    Row.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    Row.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    Row.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return Row;
}());
exports.Row = Row;
;
var Column = /** @class */ (function () {
    function Column(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('div', { wml: { 'id': __context.values.content.wml.id }, 'id': __context.values.content.id, 'class': __context.values.content.className() }, __spreadArrays((__context.children)));
        };
    }
    Column.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    Column.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    Column.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    Column.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    Column.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    Column.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    Column.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    Column.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return Column;
}());
exports.Column = Column;

},{"@quenk/noni/lib/data/maybe":8,"@quenk/wml/lib/dom":49}],43:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var wml_1 = require("@quenk/wml");
var util_1 = require("../util");
///classNames:begin
exports.LAYOUT = '-layout';
/**
 * AbstractLayout provides an implementation of Layout.
 */
var AbstractLayout = /** @class */ (function (_super) {
    __extends(AbstractLayout, _super);
    function AbstractLayout() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AbstractLayout.prototype.setContent = function (c) {
        exports.doSetContent(this.view, this.values.content.wml.id, c);
        return this;
    };
    AbstractLayout.prototype.removeContent = function () {
        exports.doRemoveContent(this.view, this.values.content.wml.id);
        return this;
    };
    return AbstractLayout;
}(wml_1.Component));
exports.AbstractLayout = AbstractLayout;
/**
 * doSetContent on a Node found in a view.
 */
exports.doSetContent = function (view, id, content) {
    var maybeRoot = view.findById(id);
    if (maybeRoot.isNothing())
        return util_1.warnMissing(view, id);
    var n = maybeRoot.get();
    while (n.firstChild)
        n.removeChild(n.firstChild);
    for (var i = 0; i < content.length; i++)
        n.appendChild(content[i]);
};
/**
 * doRemoveContent from a View.
 */
exports.doRemoveContent = function (view, id) {
    var maybeNode = view.findById(id);
    if (maybeNode.isNothing())
        return util_1.warnMissing(view, id);
    var n = maybeNode.get();
    while (n.firstChild)
        n.removeChild(n.firstChild);
};

},{"../util":48,"@quenk/wml":50}],44:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var views = require("./wml/main");
var util_1 = require("../../util");
var __1 = require("../");
///classNames:begin
exports.MAIN_LAYOUT = 'ww-main-layout';
/**
 * MainLayout provides a container for the main content of an application.
 */
var MainLayout = /** @class */ (function (_super) {
    __extends(MainLayout, _super);
    function MainLayout() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new views.Main(_this);
        _this.values = {
            content: {
                wml: {
                    id: 'main'
                },
                id: (_this.attrs && _this.attrs.ww) ? _this.attrs.ww.id : '',
                className: util_1.concat(exports.MAIN_LAYOUT, __1.LAYOUT, (_this.attrs && _this.attrs.ww) ?
                    _this.attrs.ww.className : '')
            }
        };
        return _this;
    }
    return MainLayout;
}(__1.AbstractLayout));
exports.MainLayout = MainLayout;

},{"../":43,"../../util":48,"./wml/main":45}],45:[function(require,module,exports){
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var __document = require("@quenk/wml/lib/dom");
//@ts-ignore: 6192
var maybe_1 = require("@quenk/noni/lib/data/maybe");
//@ts-ignore:6192
var __if = function (__expr, __conseq, __alt) {
    return (__expr) ? __conseq() : __alt ? __alt() : [];
};
//@ts-ignore:6192
var __forIn = function (list, f, alt) {
    var ret = [];
    for (var i = 0; i < list.length; i++)
        ret = ret.concat(f(list[i], i, list));
    return ret.length === 0 ? alt() : ret;
};
//@ts-ignore:6192
var __forOf = function (o, f, alt) {
    var ret = [];
    for (var key in o)
        if (o.hasOwnProperty(key))
            ret = ret.concat(f((o)[key], key, o));
    return ret.length === 0 ? alt() : ret;
};
var Main = /** @class */ (function () {
    function Main(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('div', { wml: { 'id': __context.values.content.wml.id }, 'id': __context.values.content.id, 'class': __context.values.content.className }, __spreadArrays((__context.children)));
        };
    }
    Main.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    Main.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    Main.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    Main.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    Main.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    Main.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    Main.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    Main.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return Main;
}());
exports.Main = Main;

},{"@quenk/noni/lib/data/maybe":8,"@quenk/wml/lib/dom":49}],46:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var views = require("./wml/table");
var wml_1 = require("@quenk/wml");
var util_1 = require("../../util");
var __1 = require("../../");
///classNames:begin
exports.TABLE_HEADER = 'ww-table-layout__header';
exports.TABLE_BODY = 'ww-table-layout__body';
exports.TABLE_FOOTER = 'ww-table-layout__footer';
exports.TABLE_ROW = 'ww-table-layout__row';
exports.TABLE_HEADING = 'ww-table-layout _heading';
exports.TABLE_CELL = 'ww-table-layout__cell';
exports.TABLE_LAYOUT = 'ww-table-layout';
exports.TABLE_WINDOW = 'ww-table-window';
exports.BORDERED = '-bordered';
exports.COMPACT = '-compact';
exports.ALTERNATE = '-alternate';
exports.HOVERABLE = '-hoverable';
/**
 * TableHeader (<thead>)
 */
var TableHeader = /** @class */ (function (_super) {
    __extends(TableHeader, _super);
    function TableHeader() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new views.TableHeader(_this);
        _this.values = {
            id: __1.getId(_this.attrs),
            className: util_1.concat(exports.TABLE_HEADER, __1.getClassName(_this.attrs))
        };
        return _this;
    }
    return TableHeader;
}(wml_1.Component));
exports.TableHeader = TableHeader;
/**
 * TableBody
 */
var TableBody = /** @class */ (function (_super) {
    __extends(TableBody, _super);
    function TableBody() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new views.TableBody(_this);
        _this.values = {
            id: __1.getId(_this.attrs),
            className: util_1.concat(exports.TABLE_BODY, __1.getClassName(_this.attrs))
        };
        return _this;
    }
    return TableBody;
}(wml_1.Component));
exports.TableBody = TableBody;
/**
 * TableFooter
 */
var TableFooter = /** @class */ (function (_super) {
    __extends(TableFooter, _super);
    function TableFooter() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new views.TableFooter(_this);
        _this.values = {
            id: __1.getId(_this.attrs),
            className: util_1.concat(exports.TABLE_FOOTER, __1.getClassName(_this.attrs))
        };
        return _this;
    }
    return TableFooter;
}(wml_1.Component));
exports.TableFooter = TableFooter;
/**
 * TableRow
 */
var TableRow = /** @class */ (function (_super) {
    __extends(TableRow, _super);
    function TableRow() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new views.TableRow(_this);
        _this.values = {
            id: __1.getId(_this.attrs),
            className: util_1.concat(exports.TABLE_ROW, __1.getClassName(_this.attrs)),
            onclick: (_this.attrs.ww && _this.attrs.ww.onclick) ?
                _this.attrs.ww.onclick : undefined
        };
        return _this;
    }
    return TableRow;
}(wml_1.Component));
exports.TableRow = TableRow;
/**
 * TableHeading
 */
var TableHeading = /** @class */ (function (_super) {
    __extends(TableHeading, _super);
    function TableHeading() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new views.TableHeading(_this);
        _this.values = {
            id: __1.getId(_this.attrs),
            className: util_1.concat(exports.TABLE_HEADING, __1.getClassName(_this.attrs)),
            onclick: (_this.attrs.ww && _this.attrs.ww.onclick) ?
                _this.attrs.ww.onclick : undefined
        };
        return _this;
    }
    return TableHeading;
}(wml_1.Component));
exports.TableHeading = TableHeading;
/**
 * TableCell
 */
var TableCell = /** @class */ (function (_super) {
    __extends(TableCell, _super);
    function TableCell() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new views.TableCell(_this);
        _this.values = {
            id: __1.getId(_this.attrs),
            className: util_1.concat(exports.TABLE_CELL, __1.getClassName(_this.attrs)),
            colspan: (_this.attrs.ww && _this.attrs.ww.colspan) ?
                _this.attrs.ww.colspan : 1,
            rowspan: (_this.attrs.ww && _this.attrs.ww.rowspan) ?
                _this.attrs.ww.rowspan : 1,
            onclick: (_this.attrs.ww && _this.attrs.ww.onclick) ?
                _this.attrs.ww.onclick : undefined
        };
        return _this;
    }
    return TableCell;
}(wml_1.Component));
exports.TableCell = TableCell;
/**
 * TableWindow allows a TableLayout to be scrolled on smaller screens.
 */
var TableWindow = /** @class */ (function (_super) {
    __extends(TableWindow, _super);
    function TableWindow() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new views.TableWindow(_this);
        _this.values = {
            id: __1.getId(_this.attrs),
            className: util_1.concat(exports.TABLE_WINDOW, __1.getClassName(_this.attrs))
        };
        return _this;
    }
    return TableWindow;
}(wml_1.Component));
exports.TableWindow = TableWindow;
/**
 * TableLayout provides a <table> based layout.
 */
var TableLayout = /** @class */ (function (_super) {
    __extends(TableLayout, _super);
    function TableLayout() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.view = new views.TableLayout(_this);
        _this.values = {
            wml: {
                id: 'table'
            },
            id: __1.getId(_this.attrs),
            className: util_1.concat(exports.TABLE_LAYOUT, __1.getClassName(_this.attrs), (_this.attrs.ww && _this.attrs.ww.alternate) ? exports.ALTERNATE : '', (_this.attrs.ww && _this.attrs.ww.bordered) ? exports.BORDERED : '', (_this.attrs.ww && _this.attrs.ww.compact) ? exports.COMPACT : '', (_this.attrs.ww && _this.attrs.ww.hoverable) ? exports.HOVERABLE : ''),
        };
        return _this;
    }
    return TableLayout;
}(wml_1.Component));
exports.TableLayout = TableLayout;

},{"../../":40,"../../util":48,"./wml/table":47,"@quenk/wml":50}],47:[function(require,module,exports){
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var __document = require("@quenk/wml/lib/dom");
//@ts-ignore: 6192
var maybe_1 = require("@quenk/noni/lib/data/maybe");
//@ts-ignore:6192
var __if = function (__expr, __conseq, __alt) {
    return (__expr) ? __conseq() : __alt ? __alt() : [];
};
//@ts-ignore:6192
var __forIn = function (list, f, alt) {
    var ret = [];
    for (var i = 0; i < list.length; i++)
        ret = ret.concat(f(list[i], i, list));
    return ret.length === 0 ? alt() : ret;
};
//@ts-ignore:6192
var __forOf = function (o, f, alt) {
    var ret = [];
    for (var key in o)
        if (o.hasOwnProperty(key))
            ret = ret.concat(f((o)[key], key, o));
    return ret.length === 0 ? alt() : ret;
};
var TableHeader = /** @class */ (function () {
    function TableHeader(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('thead', { 'id': __context.values.id, 'class': __context.values.className }, __spreadArrays((__context.children)));
        };
    }
    TableHeader.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    TableHeader.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    TableHeader.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    TableHeader.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    TableHeader.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    TableHeader.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    TableHeader.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    TableHeader.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return TableHeader;
}());
exports.TableHeader = TableHeader;
;
var TableBody = /** @class */ (function () {
    function TableBody(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('tbody', { 'id': __context.values.id, 'class': __context.values.className }, __spreadArrays((__context.children)));
        };
    }
    TableBody.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    TableBody.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    TableBody.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    TableBody.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    TableBody.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    TableBody.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    TableBody.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    TableBody.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return TableBody;
}());
exports.TableBody = TableBody;
;
var TableFooter = /** @class */ (function () {
    function TableFooter(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('tfoot', { 'id': __context.values.id, 'class': __context.values.className }, __spreadArrays((__context.children)));
        };
    }
    TableFooter.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    TableFooter.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    TableFooter.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    TableFooter.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    TableFooter.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    TableFooter.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    TableFooter.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    TableFooter.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return TableFooter;
}());
exports.TableFooter = TableFooter;
;
var TableRow = /** @class */ (function () {
    function TableRow(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('tr', { 'id': __context.values.id, 'class': __context.values.className, 'onclick': __context.values.onclick }, __spreadArrays((__context.children)));
        };
    }
    TableRow.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    TableRow.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    TableRow.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    TableRow.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    TableRow.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    TableRow.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    TableRow.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    TableRow.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return TableRow;
}());
exports.TableRow = TableRow;
;
var TableHeading = /** @class */ (function () {
    function TableHeading(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('th', { 'id': __context.values.id, 'class': __context.values.className, 'onclick': __context.values.onclick }, __spreadArrays((__context.children)));
        };
    }
    TableHeading.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    TableHeading.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    TableHeading.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    TableHeading.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    TableHeading.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    TableHeading.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    TableHeading.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    TableHeading.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return TableHeading;
}());
exports.TableHeading = TableHeading;
;
var TableCell = /** @class */ (function () {
    function TableCell(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('td', { 'id': __context.values.id, 'class': __context.values.className, 'colspan': String(__context.values.colspan), 'rowspan': String(__context.values.rowspan), 'onclick': __context.values.onclick }, __spreadArrays((__context.children)));
        };
    }
    TableCell.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    TableCell.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    TableCell.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    TableCell.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    TableCell.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    TableCell.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    TableCell.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    TableCell.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return TableCell;
}());
exports.TableCell = TableCell;
;
var TableWindow = /** @class */ (function () {
    function TableWindow(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('div', { 'id': __context.values.id, 'class': __context.values.className }, __spreadArrays((__context.children)));
        };
    }
    TableWindow.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    TableWindow.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    TableWindow.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    TableWindow.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    TableWindow.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    TableWindow.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    TableWindow.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    TableWindow.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return TableWindow;
}());
exports.TableWindow = TableWindow;
;
var TableLayout = /** @class */ (function () {
    function TableLayout(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('table', { 'id': __context.values.id, 'class': __context.values.className }, __spreadArrays((__context.children)));
        };
    }
    TableLayout.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    TableLayout.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    TableLayout.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    TableLayout.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    TableLayout.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    TableLayout.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    TableLayout.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    TableLayout.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return TableLayout;
}());
exports.TableLayout = TableLayout;

},{"@quenk/noni/lib/data/maybe":8,"@quenk/wml/lib/dom":49}],48:[function(require,module,exports){
"use strict";
/**
 * This module provides utility functions and constants used
 * through out the wml-widgets module.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * getById retreives an WMLElement from a view by its id.
 *
 * If the WMLElement is not found a warning is logged to console.
 */
exports.getById = function (view, id) {
    var m = view.findById(id);
    if (m.isNothing()) {
        exports.warnMissing(view, id);
    }
    return m;
};
/**
 * warn via console that an element is missing.
 */
exports.warnMissing = function (view, id) {
    console.warn('The view ', view, " does not have an id \"" + id + "\"!");
};
/**
 * combine the members of an array into one string.
 */
exports.combine = function (str, joiner) {
    if (joiner === void 0) { joiner = ' '; }
    return str.filter(function (s) { return ((s != null) || s != ''); }).join(joiner);
};
/**
 * concat joins various strings together to form an html class attribute value.
 *
 * Removes empty strings, null and undefined values.
 */
exports.concat = function () {
    var str = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        str[_i] = arguments[_i];
    }
    return str.filter(function (s) { return ((s == null) || (s == '')) ? false : true; })
        .map(function (s) { return s.trim(); }).join(' ');
};
/**
 * noop
 */
exports.noop = function () { };
/**
 * replaceContent
 */
exports.replaceContent = function (r, node) {
    while (node.lastChild)
        node.removeChild(node.lastChild);
    node.appendChild(r.render());
};
/**
 * debounce a function so that it is only called once after
 * a period of time.
 */
exports.debounce = function (f, delay) {
    var timer = -1;
    return delay === 0 ? f : function (a) {
        if (timer === -1) {
            timer = window.setTimeout(function () { return f(a); }, delay);
        }
        else {
            clearTimeout(timer);
            timer = window.setTimeout(function () { return f(a); }, delay);
        }
    };
};

},{}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This module provides functions used in templates to generate supported DOM
 * nodes.
 *
 * The idea here is to provide an abstraction over DOM construction so
 * we can detect whether we are in a browser or elsewhere and adjust to
 * suite.
 */
var ATTRS_ESC_REGEX = /[><&\u2028\u2029]/g;
var HTML_ESC_REGEX = /["'&<>]/;
var ATTR_ESC_MAP = {
    '&': '\\u0026',
    '>': '\\u003e',
    '<': '\\u003c',
    '"': '\\u0022',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029'
};
var HTML_ENT_MAP = {
    '"': '&quot;',
    '&': '&amp;',
    '\'': '&#x27;',
    '<': '&lt;',
    '>': '&gt;'
};
var voidElements = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr',
    'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
/**
 * SSRText is used to represent Text nodes on the server side.
 */
var SSRText = /** @class */ (function () {
    function SSRText(value) {
        this.value = value;
    }
    SSRText.prototype.renderToString = function () {
        return escapeHTML(this.value);
    };
    return SSRText;
}());
exports.SSRText = SSRText;
/**
 * SSRElement is used to represent Element nodes on the server side.
 */
var SSRElement = /** @class */ (function () {
    function SSRElement(name) {
        this.name = name;
        this.attrs = [];
        this.children = [];
    }
    SSRElement.prototype.setAttribute = function (key, value) {
        var newKey = escapeAttrValue(key);
        this.attrs.push((value === '') ? newKey :
            newKey + "=\"" + escapeAttrValue(value) + "\"");
    };
    SSRElement.prototype.appendChild = function (node) {
        this.children.push(node);
    };
    SSRElement.prototype.renderToString = function () {
        var name = this.name;
        var childs = this.children.map(function (c) { return c.renderToString(); }).join('');
        var attrs = this.attrs.join(' ');
        var open = "<" + name + " " + attrs + ">";
        return (voidElements.indexOf(name) > -1) ?
            open : "<" + open + ">" + childs + "</" + name + ">";
    };
    return SSRElement;
}());
exports.SSRElement = SSRElement;
var isBrowser = ((window != null) && (document != null));
var escapeAttrValue = function (value) {
    return value.replace(ATTRS_ESC_REGEX, function (hit) { return ATTR_ESC_MAP[hit]; });
};
var escapeHTML = function (value) {
    return value.replace(HTML_ESC_REGEX, function (hit) { return HTML_ENT_MAP[hit]; });
};
/**
 * createTextNode wrapper.
 */
exports.createTextNode = function (txt) { return isBrowser ?
    document.createTextNode(txt) : new SSRText(txt); };
/**
 * createElement wrapper.
 */
exports.createElement = function (name) {
    return isBrowser ? document.createElement(name) : new SSRElement(name);
};

},{}],50:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
/**
 * Component is an abstract Widget implementation
 * that can be used instead of manually implementing the whole interface.
 */
var Component = /** @class */ (function () {
    /**
     * @param {A} attrs is the attributes this Component excepts.
     * @param {Content[]} children is an array of content for Component.
     */
    function Component(attrs, children) {
        this.attrs = attrs;
        this.children = children;
    }
    Component.prototype.rendered = function () { };
    Component.prototype.removed = function () { };
    Component.prototype.render = function () { return this.view.render(); };
    return Component;
}());
exports.Component = Component;
;
/**
 * renderAsNode content from a Renderable.
 *
 * This function unsafely assumes the Renderable always returns DOM content.
 */
exports.renderAsNode = function (r) {
    return r.render();
};

},{}],51:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],52:[function(require,module,exports){
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

},{}],53:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var columns_1 = require("./view/columns");
/**
 * NameColumn
 */
var NameColumn = /** @class */ (function () {
    function NameColumn() {
        this.name = 'name';
        this.heading = 'Name';
    }
    return NameColumn;
}());
exports.NameColumn = NameColumn;
/**
 * ActionColumn
 */
var ActionColumn = /** @class */ (function () {
    function ActionColumn(onClick) {
        var _this = this;
        this.onClick = onClick;
        this.name = '';
        this.heading = 'Action';
        this.cellFragment = function (c) { return new columns_1.ActionColumnView({
            id: c.id,
            className: c.className,
            onClick: function () { return _this.onClick(c.row); }
        }); };
    }
    return ActionColumn;
}());
exports.ActionColumn = ActionColumn;

},{"./view/columns":57}],54:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
///<reference path="../../../global.d.ts" />
var nodeMessages = require("@metasansana/testrun/lib/node/message");
var columns = require("./columns");
var record_1 = require("@quenk/noni/lib/data/record");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var message_1 = require("@metasansana/testrun/lib/node/message");
var app_1 = require("./view/app");
exports.ID_MAIN = 'main';
exports.ID_MOCHA = 'mocha';
exports.ID_MOCHA_SCRIPT = 'testrun-mocha-script';
exports.ID_TEST_SCRIPT = 'testrun-test-script';
var ERR_NAME_UNSAFE = "E001: Script name must match: (" + nodeMessages.REGEX_SAFE_STRING + ")!";
var ERR_ARGS_UNSAFE = "E002: Script arguments must match: (" + nodeMessages.REGEX_SAFE_STRING + ")!";
var ERR_SCRIPT_PATH_NOT_SET = "E003: No path for cli scripts set!";
var ERR_LOAD_FILES_FAILED = "E004: Unable to load the file(s) specified!";
exports.URL_MOCHA_JS = 'testrun/mocha.js';
exports.MSG_TYPE_RESULTS = 'results';
/**
 * Testrun
 */
var Testrun = /** @class */ (function () {
    function Testrun(window, app) {
        var _this = this;
        this.window = window;
        this.app = app;
        this.view = new app_1.TestrunView(this);
        this.tab = -1;
        this.currentTab = maybe_1.nothing();
        this.runner = browser.runtime.connectNative('testrun_native');
        this.values = {
            url: {
                name: 'url',
                label: 'App URL',
                value: 'http://localhost:8080',
                onChange: function (e) {
                    _this.values.url.value = e.value;
                }
            },
            exec: {
                name: 'exec',
                label: 'Exec CLI Script Path',
                value: '',
                onChange: function (e) {
                    _this.values.exec.value = e.value;
                }
            },
            files: {
                text: 'Select test files',
                multiple: true,
                onChange: function (e) {
                    _this.loadFromFiles(e.value);
                }
            },
            table: {
                data: [],
                columns: [
                    new columns.NameColumn(),
                    new columns.ActionColumn(function (id) {
                        _this.runSuite(_this.values.table.data[id]);
                    })
                ]
            },
            results: {
                content: document.createElement('div')
            }
        };
        /**
         * handleMessage dispatches messages received via the postMessage() api.
         */
        this.handleMessage = function (m) {
            var msg = m;
            switch (msg.type) {
                case exports.MSG_TYPE_RESULTS:
                    _this.showResults(msg);
                    break;
                case nodeMessages.MSG_EXEC:
                    _this.runCLIScript(msg);
                    break;
                case nodeMessages.MSG_EXEC_FAIL:
                case nodeMessages.MSG_EXEC_RESULT:
                    if (_this.currentTab.isJust())
                        browser
                            .tabs
                            .sendMessage(_this.currentTab.get().id, msg);
                    break;
                default:
                    warn("Ignoring unknown message: " + JSON.stringify(msg) + ".");
                    break;
            }
        };
    }
    Testrun.create = function (w, a) {
        return new Testrun(w, a);
    };
    /**
     * isScriptPathSet detects whether the user has specified a path to read
     * "execCLIScript" targets from.
     */
    Testrun.prototype.isScriptPathSet = function () {
        return this.values.exec.value !== '';
    };
    /**
     * @private
     */
    Testrun.prototype.loadFromFiles = function (list) {
        var _this = this;
        file2Suites(list).fork(loadFromFilesFailed, function (s) {
            _this.values.table.data = s;
            _this.view.invalidate();
        });
    };
    /**
     * @private
     */
    Testrun.prototype.clearSuite = function () {
        removeElementById(this.app, exports.ID_MOCHA);
        removeElementById(this.app, exports.ID_MOCHA_SCRIPT);
        removeElementById(this.app, exports.ID_TEST_SCRIPT);
    };
    /**
     * @private
     */
    Testrun.prototype.runMocha = function (f) {
        this.app.mocha.run().on('end', f);
    };
    /**
     * showResults parses the html from the results and displays it
     * in the main UI.
     */
    Testrun.prototype.showResults = function (msg) {
        var _this = this;
        var code = msg.value || '';
        browser
            .tabs
            .create({
            url: '/src/app/public/results.html'
        })
            .then(function (tab) {
            return browser
                .tabs
                .executeScript(tab.id, {
                file: '/build/content/init_result.js'
            })
                .then(function () {
                return browser
                    .tabs
                    .sendMessage(tab.id, {
                    type: 'run',
                    code: code
                });
            });
        })
            .catch(function (e) { return _this.showError(e); });
    };
    /**
     * showError alerts the user and dumps an error to the console.
     */
    Testrun.prototype.showError = function (e) {
        alert("Error: " + e.message);
        error(e);
    };
    /**
     * runCLIScript on behalf of the running test.
     *
     * This method is the bridge between the injected script and the CLI
     * provided by this extension.
     */
    Testrun.prototype.runCLIScript = function (e) {
        if (this.isScriptPathSet()) {
            this.handleMessage(new message_1.NewFail(e.id, ERR_SCRIPT_PATH_NOT_SET));
        }
        else {
            if (!message_1.isCLISafe(e.name))
                this.handleMessage(new message_1.NewFail(e.id, ERR_NAME_UNSAFE));
            else if (!message_1.isCLISafe(e.args))
                this.handleMessage(new message_1.NewFail(e.id, ERR_ARGS_UNSAFE));
            else
                this.runner.postMessage(record_1.merge(e, {
                    name: this.values.exec.value + "/" + e.name
                }));
        }
    };
    /**
     * runSuite
     */
    Testrun.prototype.runSuite = function (s) {
        var _this = this;
        browser.runtime.onMessage.addListener(this.handleMessage);
        browser
            .tabs
            .create({ url: this.values.url.value })
            .then(function (tab) {
            _this.currentTab = maybe_1.just(tab);
            return tab;
        })
            .then(function (tab) {
            return browser
                .tabs
                .executeScript(tab.id, {
                file: '/build/content/init.js'
            })
                .then(function () {
                return browser
                    .tabs
                    .sendMessage(tab.id, {
                    type: 'run',
                    code: s.code
                });
            });
        })
            .catch(function (e) { return _this.showError(e); });
    };
    /**
     * run the application.
     */
    Testrun.prototype.run = function () {
        var main = this.window.document.getElementById(exports.ID_MAIN);
        if (main != null) {
            main.appendChild(this.view.render());
            this.runner.onMessage.addListener(this.handleMessage);
        }
        else {
            return this.showError(new Error("Missing \"" + exports.ID_MAIN + "\" id in application document!"));
        }
    };
    return Testrun;
}());
exports.Testrun = Testrun;
var file2Suites = function (files) {
    return readFiles(files).map(_2Suites(files));
};
var _2Suites = function (files) { return function (srcs) {
    return srcs.map(function (code, i) { return ({ name: files[i].name, code: code }); });
}; };
var readFiles = function (files) {
    return future_1.parallel(files.map(function (f) { return future_1.fromCallback(function (cb) {
        var r = new FileReader();
        r.onerror = function () { return cb(new Error('Read Error')); };
        r.onload = function () { return cb(undefined, r.result); };
        r.readAsText(f);
    }); }));
};
var getElementById = function (w, id) {
    return maybe_1.fromNullable(w.document.getElementById(id));
};
var removeElementById = function (w, id) {
    return getElementById(w, id)
        .map(function (e) {
        if (e.parentNode != null)
            e.parentNode.removeChild(e);
    });
};
var loadFromFilesFailed = function () { alert(ERR_LOAD_FILES_FAILED); };
var warn = function (msg) {
    return console.warn("[Testrun]: " + msg);
};
var error = function (e) {
    return console.error("[Testrun]: " + e.message, e);
};

},{"./columns":53,"./view/app":56,"@metasansana/testrun/lib/node/message":52,"@quenk/noni/lib/control/monad/future":2,"@quenk/noni/lib/data/maybe":8,"@quenk/noni/lib/data/record":9}],55:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("./");
var app = _1.Testrun.create(window, window.opener);
app.run();

},{"./":54}],56:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __document = require("@quenk/wml/lib/dom");
//@ts-ignore: 6192
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var main_1 = require("@quenk/wml-widgets/lib/layout/main");
;
var grid_1 = require("@quenk/wml-widgets/lib/layout/grid");
;
var text_field_1 = require("@quenk/wml-widgets/lib/control/text-field");
;
var file_input_1 = require("@quenk/wml-widgets/lib/control/file-input");
;
var table_1 = require("@quenk/wml-widgets/lib/data/table");
;
//@ts-ignore:6192
var __if = function (__expr, __conseq, __alt) {
    return (__expr) ? __conseq() : __alt ? __alt() : [];
};
//@ts-ignore:6192
var __forIn = function (list, f, alt) {
    var ret = [];
    for (var i = 0; i < list.length; i++)
        ret = ret.concat(f(list[i], i, list));
    return ret.length === 0 ? alt() : ret;
};
//@ts-ignore:6192
var __forOf = function (o, f, alt) {
    var ret = [];
    for (var key in o)
        if (o.hasOwnProperty(key))
            ret = ret.concat(f((o)[key], key, o));
    return ret.length === 0 ? alt() : ret;
};
var TestrunView = /** @class */ (function () {
    function TestrunView(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.widget(new main_1.MainLayout({}, [
                __this.widget(new grid_1.GridLayout({}, [
                    __this.widget(new grid_1.Row({}, [
                        __this.widget(new grid_1.Column({}, [
                            __this.node('h1', {}, [
                                __document.createTextNode('Testrun')
                            ]),
                            __this.widget(new text_field_1.TextField({ 'ww': __context.values.url }, []), { 'ww': __context.values.url })
                        ]), {})
                    ]), {}),
                    __this.widget(new grid_1.Row({}, [
                        __this.widget(new grid_1.Column({}, [
                            __this.widget(new text_field_1.TextField({ 'ww': __context.values.exec }, []), { 'ww': __context.values.exec })
                        ]), {})
                    ]), {}),
                    __this.widget(new grid_1.Row({}, [
                        __this.widget(new grid_1.Column({}, [
                            __this.node('p', {}, [
                                __document.createTextNode('Select the test files below:')
                            ]),
                            __this.widget(new file_input_1.FileInput({ 'ww': __context.values.files }, []), { 'ww': __context.values.files })
                        ]), {})
                    ]), {}),
                    __this.widget(new grid_1.Row({}, [
                        __this.widget(new grid_1.Column({}, [
                            __this.widget(new table_1.DataTable({ 'ww': __context.values.table }, []), { 'ww': __context.values.table })
                        ]), {})
                    ]), {}),
                    __this.widget(new grid_1.Row({}, [
                        __this.widget(new grid_1.Column({}, [
                            __context.values.results.content
                        ]), {})
                    ]), {})
                ]), {})
            ]), {});
        };
    }
    TestrunView.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    TestrunView.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    TestrunView.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    TestrunView.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    TestrunView.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    TestrunView.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    TestrunView.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    TestrunView.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return TestrunView;
}());
exports.TestrunView = TestrunView;

},{"@quenk/noni/lib/data/maybe":8,"@quenk/wml-widgets/lib/control/file-input":20,"@quenk/wml-widgets/lib/control/text-field":29,"@quenk/wml-widgets/lib/data/table":37,"@quenk/wml-widgets/lib/layout/grid":41,"@quenk/wml-widgets/lib/layout/main":44,"@quenk/wml/lib/dom":49}],57:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __document = require("@quenk/wml/lib/dom");
//@ts-ignore: 6192
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var button_1 = require("@quenk/wml-widgets/lib/control/button");
;
//@ts-ignore:6192
var __if = function (__expr, __conseq, __alt) {
    return (__expr) ? __conseq() : __alt ? __alt() : [];
};
//@ts-ignore:6192
var __forIn = function (list, f, alt) {
    var ret = [];
    for (var i = 0; i < list.length; i++)
        ret = ret.concat(f(list[i], i, list));
    return ret.length === 0 ? alt() : ret;
};
//@ts-ignore:6192
var __forOf = function (o, f, alt) {
    var ret = [];
    for (var key in o)
        if (o.hasOwnProperty(key))
            ret = ret.concat(f((o)[key], key, o));
    return ret.length === 0 ? alt() : ret;
};
var ActionColumnView = /** @class */ (function () {
    function ActionColumnView(__context) {
        this.ids = {};
        this.groups = {};
        this.views = [];
        this.widgets = [];
        this.tree = __document.createElement('div');
        this.template = function (__this) {
            return __this.node('td', { wml: { 'id': __context.id }, 'class': __context.className }, [
                __this.widget(new button_1.Button({ ww: { 'text': 'Run', 'onClick': __context.onClick } }, []), { ww: { 'text': 'Run', 'onClick': __context.onClick } })
            ]);
        };
    }
    ActionColumnView.prototype.registerView = function (v) {
        this.views.push(v);
        return v;
    };
    ActionColumnView.prototype.register = function (e, attrs) {
        var attrsMap = attrs;
        if (attrsMap.wml) {
            var _a = attrsMap.wml, id = _a.id, group = _a.group;
            if (id != null) {
                if (this.ids.hasOwnProperty(id))
                    throw new Error("Duplicate id '" + id + "' detected!");
                this.ids[id] = e;
            }
            if (group != null) {
                this.groups[group] = this.groups[group] || [];
                this.groups[group].push(e);
            }
        }
        return e;
    };
    ActionColumnView.prototype.node = function (tag, attrs, children) {
        var e = __document.createElement(tag);
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key];
            if (typeof value === 'function') {
                e[key] = value;
            }
            else if (typeof value === 'string') {
                //prevent setting things like disabled=''
                if (value !== '')
                    e.setAttribute(key, value);
            }
            else if (typeof value === 'boolean') {
                e.setAttribute(key, '');
            }
        });
        children.forEach(function (c) {
            switch (typeof c) {
                case 'string':
                case 'number':
                case 'boolean':
                    var tn = __document.createTextNode('' + c);
                    e.appendChild(tn);
                case 'object':
                    e.appendChild(c);
                    break;
                default:
                    throw new TypeError("Can not adopt child " + c + " of type " + typeof c);
            }
        });
        this.register(e, attrs);
        return e;
    };
    ActionColumnView.prototype.widget = function (w, attrs) {
        this.register(w, attrs);
        this.widgets.push(w);
        return w.render();
    };
    ActionColumnView.prototype.findById = function (id) {
        var mW = maybe_1.fromNullable(this.ids[id]);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findById(id);
        }, mW);
    };
    ActionColumnView.prototype.findByGroup = function (name) {
        var mGroup = maybe_1.fromArray(this.groups.hasOwnProperty(name) ?
            this.groups[name] :
            []);
        return this.views.reduce(function (p, c) {
            return p.isJust() ? p : c.findByGroup(name);
        }, mGroup);
    };
    ActionColumnView.prototype.invalidate = function () {
        var tree = this.tree;
        var parent = tree.parentNode;
        if (tree == null)
            return console.warn('invalidate(): ' + 'Missing DOM tree!');
        if (tree.parentNode == null)
            throw new Error('invalidate(): cannot invalidate this view, it has no parent node!');
        parent.replaceChild(this.render(), tree);
    };
    ActionColumnView.prototype.render = function () {
        this.ids = {};
        this.widgets.forEach(function (w) { return w.removed(); });
        this.widgets = [];
        this.views = [];
        this.tree = this.template(this);
        this.ids['root'] = (this.ids['root']) ?
            this.ids['root'] :
            this.tree;
        this.widgets.forEach(function (w) { return w.rendered(); });
        return this.tree;
    };
    return ActionColumnView;
}());
exports.ActionColumnView = ActionColumnView;

},{"@quenk/noni/lib/data/maybe":8,"@quenk/wml-widgets/lib/control/button":17,"@quenk/wml/lib/dom":49}]},{},[55]);
