import * as columns from './columns';

import { View } from '@quenk/wml';

import { Value, Object } from '@quenk/noni/lib/data/json';
import { fromNullable, Maybe } from '@quenk/noni/lib/data/maybe';
import { Future, fromCallback, parallel } from '@quenk/noni/lib/control/monad/future';

import { Column } from '@quenk/wml-widgets/lib/data/table';
import { FileChangedEvent } from '@quenk/wml-widgets/lib/control/file-input';

import { TestrunView } from './view/app';

export const ID_MAIN = 'main';
export const ID_MOCHA = 'mocha';
export const ID_MOCHA_SCRIPT = 'testrun-mocha-script';
export const ID_TEST_SCRIPT = 'testrun-test-script';

const MSG_LOAD_FILES_FAILED = 'Unable to load the file(s) specified!';

export const MSG_NO_PARENT = 'Unable to find a parent window for this Testrun ' +
    'instance. It may be that you have accessed the Testrun index file directly.' +
    ' Close this window and run the Testrun extension on your app page or ' +
    ' alternatively you can load Testrun using window.open() from your app.';

export const URL_MOCHA_JS = 'testrun/mocha.js';

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

    values = {

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
     * runSuite 
     */
    runSuite(s: Suite): void {

        browser.tabs.sendMessage(this.tab, { type: 'run', code: s.code })
            .catch((e: Error) => alert(e.message));

    }

    /**
     * run the application.
     */
    run(): void {

        let main = <HTMLElement>this.window.document.getElementById(ID_MAIN);

        if (main == null) {

            alert(`Missing "${ID_MAIN}" id in application document!`);

        } else {

            browser.runtime.getBackgroundPage()
                .then((p: { tab: number }) => { this.tab = p.tab; })
                .then(() => {

                    browser.runtime.onMessage.addListener((m: any) => {

                        if (m.type === 'results') {

                            let div = document.createElement('div');

                            div.innerHTML = m.value;

                            div.style.display = null;

                            this.values.results.content = div;

                            this.view.invalidate();

                        }

                    });

                    main.appendChild(this.view.render());

                })
                .then(() => browser.tabs.executeScript(this.tab, {

                    file: '/lib/scripts/content/run_test.js'

                }))
                .catch((e: Error) => alert(e.message));

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
