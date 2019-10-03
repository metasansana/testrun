import * as columns from './columns';

import { View } from '@quenk/wml';

import { Value, Object } from '@quenk/noni/lib/data/json';
import { reduce } from '@quenk/noni/lib/data/record';
import { fromNullable, Maybe } from '@quenk/noni/lib/data/maybe';

import { Column } from '@quenk/wml-widgets/lib/data/table';

import { TestrunView } from './view/app';

export const ID_MAIN = 'main';
export const ID_MOCHA = 'mocha';
export const ID_MOCHA_SCRIPT = 'testrun-mocha-script';
export const ID_TEST_SCRIPT = 'testrun-test-script';

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

    values = {

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
    loadGlobalSuites(): void {

        this.values.table.data = getGlobalSuites(this.window);

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
     * runSuite will run the code of the selected suite in the context
     * of the application window.
     */
    runSuite(s: Suite): void {

        //will have to be modified for extensions
        this.clearSuite();

        let b = getBody(this.app);

        b.appendChild(createScript(this.app, URL_MOCHA_JS, ID_MOCHA_SCRIPT));

        b.appendChild(createDiv(this.app, 'display:none', ID_MOCHA));

        wait(1000, () => {

            this.app.mocha.setup({ ui: 'bdd' });

            b.appendChild(createIScript(this.app, s.code));

            wait(1000, () => this.runMocha(() => {

                let mResults = getElementById(this.app, ID_MOCHA);

                if (mResults.isNothing()) {

                    alert('Missing results div!');

                } else {

                    let results = mResults.get();

                    this.window.document.adoptNode(results);

                    results.style.display = 'unset';

                    this.values.results.content = results;

                    this.view.invalidate();

                }

            }));

        });

    }

    /**
     * check the environment to ensure Testrun was initailzed correctly.
     */
    check(): boolean {

        if (this.app == null) {

            alert(MSG_NO_PARENT);

            return false;

        }

        return true;

    }

    /**
     * run the application.
     */
    run(): void {

        let main = <HTMLElement>this.window.document.getElementById(ID_MAIN);

        if (main == null) {

            alert(`Missing "${ID_MAIN}" id in application document!`);

        } else {

            //give DOM time to change.
            wait(1000, () => {

                this.loadGlobalSuites();

                main.appendChild(this.view.render());

            });

        }

    }

}

const wait = (n: number, f: () => void) => setTimeout(f, n);

const getGlobalSuites = (w: Window): Suite[] => (w.TESTRUN_SUITES != null) ?
    reduce(w.TESTRUN_SUITES, <Suite[]>[], (p, code, name) =>
        p.concat({ name, code: atob(code) })) : [];

const getBody = (w: Window): HTMLBodyElement =>
    <HTMLBodyElement>w.document.body;

const getElementById = (w: Window, id: string): Maybe<HTMLElement> =>
    fromNullable(w.document.getElementById(id));

const removeElementById = (w: Window, id: string) =>
    getElementById(w, id)
        .map(e => {

            if (e.parentNode != null)
                e.parentNode.removeChild(e);

        });

const createDiv = (w: Window, style?: string, id?: string) => {

    let div = w.document.createElement('div');

    if (style) div.setAttribute('style', style);

    if (id) div.setAttribute('id', id);

    return div;

}

const createScript = (w: Window, src: string, id?: string) => {

    let script = w.document.createElement('script');

    script.setAttribute('src', src);

    if (id) script.setAttribute('id', id);

    return script;

}

const createIScript = (w: Window, code: string, id?: string) => {

    let script = w.document.createElement('script');
    let text = w.document.createTextNode(code);

    script.appendChild(text);

    if (id) script.setAttribute('id', id);

    return script;

}
