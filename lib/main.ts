import { Testrun } from './app';

let app = Testrun.create(window, window.opener);

window.testrun = app;

if (app.check()) app.run();
