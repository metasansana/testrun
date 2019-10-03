"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("./app");
var app = app_1.Testrun.create(window, window.opener);
window.testrun = app;
if (app.check())
    app.run();
//# sourceMappingURL=main.js.map