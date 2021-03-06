///<reference path="../../../global.d.ts" />
import * as nodeMessages from '@metasansana/testrun/lib/node/message';
import * as bgMessages from '@metasansana/testrun/lib/background/message';
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
import {
    Future,
    fromCallback,
    parallel
} from '@quenk/noni/lib/control/monad/future';
import { Column } from '@quenk/wml-widgets/lib/data/table';
import { TextChangedEvent } from '@quenk/wml-widgets/lib/control/text-field';
import { FileChangedEvent } from '@quenk/wml-widgets/lib/control/file-input';

import {
    Exec,
    NewFail,
    isCLISafe
} from '@metasansana/testrun/lib/node/message';
import { TargetTab } from '@metasansana/testrun/lib/background/message';
import { execContentScriptFile } from '@metasansana/testrun/lib/content';

import { TestrunView } from './view/app';

export const ID_MAIN = 'main';
export const ID_MOCHA = 'mocha';
export const ID_MOCHA_SCRIPT = 'testrun-mocha-script';
export const ID_TEST_SCRIPT = 'testrun-test-script';

const ERR_NAME_UNSAFE =
    `E001: Script name must match: (${nodeMessages.REGEX_SAFE_STRING})!`;

const ERR_ARGS_UNSAFE =
    `E002: Script arguments must match: (${nodeMessages.REGEX_SAFE_STRING})!`;

const ERR_SCRIPT_PATH_NOT_SET =
    `E003: No path for cli scripts set!`;

const ERR_LOAD_FILES_FAILED =
    `E004: Unable to load the file(s) specified!`;

const ERR_NODE_RUNNER_UNAVAILABLE =
    `E005: The cli runner is unavailable!`;

const MSG_TYPE_RESULTS = 'results';

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

    targetTab: Maybe<browser.tabs.Tab> = nothing();

    background = browser.runtime.connect();

    node = browser.runtime.connectNative('testrun_native');

    nodeRunnerAvailable = true;

    values = {

        url: {

            name: 'url',

            label: 'App URL',

            value: '',

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
     * handleError alerts the user and dumps an error to the console.
     */
    handleError = (e: Error) => {

        alert(`Error: ${e.message}`);
        error(e);

    }

    /**
     * handleNodeDisconnect handles the disconnect of the native cli runner.
     */
    handleNodeDisconnect = (p: browser.runtime.Port) => {

        this.nodeRunnerAvailable = false;

        if (p.error != null)
            this.handleError(<Error>p.error);

        if (browser.runtime.lastError != null)
            this.handleError(<Error>browser.runtime.lastError);

    }

    /**
     * handleMessage received from the message passing hooks.
     *
     * Messages may come from:
     * 1. Page scripts.
     * 2. Content scripts.
     * 3. Native scripts.
     * 4. This.
     */
    handleMessage = (m: object) => {

        let msg = <Message>m;

        switch (msg.type) {

            case MSG_TYPE_RESULTS:
                this.showResults(msg);
                break;

            case nodeMessages.MSG_EXEC:
                this.runCLIScript(<any>msg);
                break;

            case nodeMessages.MSG_EXEC_FAIL:
            case nodeMessages.MSG_EXEC_RESULT:
                if (this.targetTab.isJust())
                    browser
                        .tabs
                        .sendMessage(<number>this.targetTab.get().id, msg);
                break;

            case bgMessages.MSG_TARGET_TAB:
                this
                    .updateURLFromTab((<TargetTab>m).id)
                    .catch(this.handleError);
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
     * isScriptPathSet detects whether the user has specified a path to read
     * "execCLIScript" targets from.
     */
    isScriptPathSet(): boolean {

        return this.values.exec.value !== '';

    }

    /**
     * createTargetTab is used to create a new tab for testing.
     *
     * This is only used if we detect the targetTab is not set.
     */
    createTargetTab(): Promise<browser.tabs.Tab> {

        return browser
            .tabs
            .create({ url: this.values.url.value })
            .then((tab: browser.tabs.Tab) => {

                this.targetTab = just(tab);

                return tab;

            });

    }


    /**
     * updateURLFromTab attempts to update the target url using the tab
     * id specified.
     */
    updateURLFromTab(id: number): Promise<void> {

        return browser
            .tabs
            .get(id)
            .then((t: browser.tabs.Tab) => {

                if (t.url != null) {

                    this.values.url.value = t.url;

                    this.view.invalidate();

                }

            });

    }

    /**
     * showResults parses the html from the results and displays it
     * in the main UI.
     */
    xshowResults(msg: Message): void {

        let code = msg.value || '';

        browser
            .tabs
            .create({

                url: '/src/app/public/results.html'

            })
            .then(tab =>
                execContentScriptFile(<number>tab.id,
                    '/build/content/initTestResultEnv.js')
                    .then(() =>
                        browser
                            .tabs
                            .sendMessage(<number>tab.id, {

                                type: 'run',

                                code: code

                            })))
            .catch(this.handleError);

    }
    showResults(msg: Message): void {

        let code = msg.value || '';

        browser
            .tabs
            .create({

                url: '/src/app/public/results.html'

            })
            .then(tab =>
                browser.tabs.onUpdated.addListener((id, changes) => {

                    if (tab.id === id)
                        if (changes.status === 'complete')
                            browser
                                .tabs
                                .sendMessage(id, {

                                    type: 'run',

                                    code: code

                                })
                                .catch(this.handleError);
                }))
            .catch(this.handleError);

    }

    /**
     * show the application.
     */
    show() {

        let main = <HTMLElement>this.window.document.getElementById(ID_MAIN);

        if (main != null) {

            main.appendChild(<Node>this.view.render());

        } else {

            return this.handleError(new Error
                (`Missing "${ID_MAIN}" id in application document!`));

        }

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
     * runCLIScript on behalf of the running test.
     *
     * This method is the bridge between the injected script and the CLI
     * provided by this extension.
     */
    runCLIScript(e: Exec): void {

        if (!this.isScriptPathSet()) {

            this.handleMessage(new NewFail(e.id, ERR_SCRIPT_PATH_NOT_SET));

        } else if (!this.nodeRunnerAvailable) {

            this.handleMessage(new NewFail(e.id, ERR_NODE_RUNNER_UNAVAILABLE));

        } else {

            if (!isCLISafe(e.name))
                this.handleMessage(new NewFail(e.id, ERR_NAME_UNSAFE));
            else if (!isCLISafe(e.args))
                this.handleMessage(new NewFail(e.id, ERR_ARGS_UNSAFE));
            else
                this.node.postMessage(merge(e, {
                    name: `${this.values.exec.value}/${e.name}`
                }));

        }

    }

    /**
     * runSuite 
     */
    runSuite(s: Suite): void {

        this
            .createTargetTab()
            .then(tab =>
                execContentScriptFile(<number>tab.id,
                    '/build/content/initTestEnv.js')
                    .then(() =>
                        browser
                            .tabs
                            .sendMessage(<number>tab.id, {

                                type: 'run',

                                code: s.code

                            })))
            .catch(this.handleError);

    }

    /**
     * run the application.
     */
    run(): void {

        browser.runtime.onMessage.addListener(this.handleMessage);

        this.node.onMessage.addListener(this.handleMessage);

        this.node.onDisconnect.addListener(this.handleNodeDisconnect);

        this.background.onMessage.addListener(this.handleMessage);

        this.show();

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

const loadFromFilesFailed = () => { alert(ERR_LOAD_FILES_FAILED); }

const warn = (msg: string) =>
    console.warn(`[Testrun]: ${msg}`);

const error = (e: Error) =>
    console.error(`[Testrun]: ${e.message}`);
