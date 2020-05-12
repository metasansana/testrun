///<reference path="../../../global.d.ts" />
import * as columns from './columns';

import { View } from '@quenk/wml';
import { Value, Object } from '@quenk/noni/lib/data/json';
import { merge } from '@quenk/noni/lib/data/record';
import {
    Maybe,
    fromNullable,
    just,
    nothing
} from '@quenk/noni/lib/data/maybe';
import { Future, fromCallback, parallel } from '@quenk/noni/lib/control/monad/future';
import { Column } from '@quenk/wml-widgets/lib/data/table';
import { TextChangedEvent } from '@quenk/wml-widgets/lib/control/text-field';
import { FileChangedEvent } from '@quenk/wml-widgets/lib/control/file-input';

import { TestrunView } from './view/app';

export const ID_MAIN = 'main';
export const ID_MOCHA = 'mocha';
export const ID_MOCHA_SCRIPT = 'testrun-mocha-script';
export const ID_TEST_SCRIPT = 'testrun-test-script';

const MSG_EXEC_PATH_NOT_SET = 'You must set an exec path to run cli scripts!';

const MSG_LOAD_FILES_FAILED = 'Unable to load the file(s) specified!';

export const MSG_NO_PARENT = 'Unable to find a parent window for this Testrun ' +
    'instance. It may be that you have accessed the Testrun index file directly.' +
    ' Close this window and run the Testrun extension on your app page or ' +
    ' alternatively you can load Testrun using window.open() from your app.';

export const URL_MOCHA_JS = 'testrun/mocha.js';

export const MSG_TYPE_RESULTS = 'results';

/**
 * CLIScriptRequest
 */
export interface CLIScriptRequest {

    id: string,

    type: string,

    name: string,

    args: string

}

/**
 * Message is the data structure we use to pass data between 
 * the background, content and page contexts.
 */
export interface Message {

    [key: string]: any

    /**
     * type of message
     */
    type: string

}

/**
 * Suite describes a test suite that can be run.
 */
export interface Suite extends Object {

    /**
     * name of the suite (file name).
     */
    name: string,

    /**
     * code to run in order to execute the test.
     */
    code: string

}

/**
 * Testrun
 */
export class Testrun {

    constructor(public window: Window, public app: Window) { }

    view: View = new TestrunView(this);

    tab: number = -1;

    currentTab: Maybe<browser.tabs.Tab> = nothing();

    runner = browser.runtime.connectNative('testrun_native');

    values = {

        url: {

            name: 'url',

            label: 'App URL',

            value: 'http://localhost:8080',

            onChange: (e: TextChangedEvent) => {

                this.values.url.value = e.value;

            }

        },

        exec: {

            name: 'exec',

            label: 'Exec CLI Script Path',

            value: '',

            onChange: (e: TextChangedEvent) => {

                this.values.exec.value = e.value;

            }

        },

        files: {

            text: 'Select test files',

            multiple: true,

            onChange: (e: FileChangedEvent) => {

                this.loadFromFiles(e.value);

            }

        },

        table: {

            data: <Suite[]>[],

            columns: <Column<Value, Suite>[]>[

                new columns.NameColumn(),

                new columns.ActionColumn((id: number) => {

                    this.runSuite(this.values.table.data[id]);

                })

            ]

        },

        results: {

            content: <HTMLElement>document.createElement('div')

        }

    };

    /**
     * handleMessage dispatches messages received via the postMessage() api.
     */
    handleMessage = (m: object) => {

        let msg = <Message>m;

        switch (msg.type) {

            case MSG_TYPE_RESULTS:
                this.showResults(msg);
                break;

            case 'testrun-exec-cli-script':
                this.runCLIScript(<any>msg);
                break;

            case 'testrun-exec-cli-script-result':
            case 'testrun-exec-cli-script-error':
                if (this.currentTab.isJust())
                    browser
                        .tabs
                        .sendMessage(<number>this.currentTab.get().id, msg);
                break;

            default:
                warn(`Ignoring unknown message: ${JSON.stringify(msg)}.`);
                break;

        }

    }

    static create(w: Window, a: Window): Testrun {

        return new Testrun(w, a);

    }

    /**
     * @private
     */
    loadFromFiles(list: File[]) {

        file2Suites(list).fork(loadFromFilesFailed, (s: Suite[]) => {

            this.values.table.data = s;

            this.view.invalidate();

        });

    }

    /**
     * @private
     */
    clearSuite(): void {

        removeElementById(this.app, ID_MOCHA);

        removeElementById(this.app, ID_MOCHA_SCRIPT);

        removeElementById(this.app, ID_TEST_SCRIPT);

    }

    /**
     * @private
     */
    runMocha(f: () => void): void {

        this.app.mocha.run().on('end', f);

    }

    /**
     * showResults parses the html from the results and displays it
     * in the main UI.
     */
    showResults(msg: Message): void {

        let code = msg.value || '';

        browser
            .tabs
            .create({

                url: '/src/app/public/results.html'

            })
            .then(tab =>
                browser
                    .tabs
                    .executeScript(<number>tab.id, {

                        file: '/build/content/init_result.js'

                    })
                    .then(() =>
                        browser
                            .tabs
                            .sendMessage(<number>tab.id, {

                                type: 'run',

                                code: code

                            })))
            .catch(e => this.showError(e));

    }

    /**
     * showError alerts the user and dumps an error to the console.
     */
    showError(e: Error): void {

        alert(`Error: ${e.message}`);
        error(e);

    }

    runCLIScript(e: CLIScriptRequest) {

        if (this.values.exec.value === '')
            this.handleMessage({

                id: e.id,

                type: 'testrun-exec-cli-script-error',

                message: MSG_EXEC_PATH_NOT_SET,

                stack: ''

            });
        else
            this.runner.postMessage(merge(e, {
                name: `${this.values.exec.value}/${e.name}`
            }));

    }

    /**
     * runSuite 
     */
    runSuite(s: Suite): void {

        browser.runtime.onMessage.addListener(this.handleMessage);

        browser
            .tabs
            .create({ url: this.values.url.value })
            .then((tab: browser.tabs.Tab) => {

                this.currentTab = just(tab);

                return tab;

            })
            .then(tab =>
                browser
                    .tabs
                    .executeScript(<number>tab.id, {

                        file: '/build/content/init.js'

                    })
                    .then(() =>
                        browser
                            .tabs
                            .sendMessage(<number>tab.id, {

                                type: 'run',

                                code: s.code

                            })))
            .catch(e => this.showError(e));

    }

    /**
     * run the application.
     */
    run(): void {

        let main = <HTMLElement>this.window.document.getElementById(ID_MAIN);

        if (main != null) {

            main.appendChild(<Node>this.view.render());

            this.runner.onMessage.addListener(this.handleMessage);

        } else {

            return this.showError(new Error
                (`Missing "${ID_MAIN}" id in application document!`));

        }

    }

}

const file2Suites = (files: File[]): Future<Suite[]> =>
    readFiles(files).map(_2Suites(files));

const _2Suites = (files: File[]) => (srcs: string[]) =>
    srcs.map((code, i) => ({ name: files[i].name, code }));

const readFiles = (files: File[]): Future<string[]> =>
    parallel(files.map(f => fromCallback(cb => {

        let r = new FileReader();

        r.onerror = () => cb(new Error('Read Error'));

        r.onload = () => cb(undefined, <string>r.result);

        r.readAsText(f);

    })));

const getElementById = (w: Window, id: string): Maybe<HTMLElement> =>
    fromNullable(w.document.getElementById(id));

const removeElementById = (w: Window, id: string) =>
    getElementById(w, id)
        .map(e => {

            if (e.parentNode != null)
                e.parentNode.removeChild(e);

        });

const loadFromFilesFailed = () => { alert(MSG_LOAD_FILES_FAILED); }

const warn = (msg: string) =>
    console.warn(`[Testrun]: ${msg}`);

const error = (e: Error) =>
    console.error(`[Testrun]: ${e.message}`, e);
