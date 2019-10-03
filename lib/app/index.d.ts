import { View } from '@quenk/wml';
import { Value, Object } from '@quenk/noni/lib/data/json';
import { Column } from '@quenk/wml-widgets/lib/data/table';
export declare const ID_MAIN = "main";
export declare const ID_MOCHA = "mocha";
export declare const ID_MOCHA_SCRIPT = "testrun-mocha-script";
export declare const ID_TEST_SCRIPT = "testrun-test-script";
export declare const MSG_NO_PARENT: string;
export declare const URL_MOCHA_JS = "testrun/mocha.js";
/**
 * Suite describes a test suite that can be run.
 */
export interface Suite extends Object {
    /**
     * name of the suite (file name).
     */
    name: string;
    /**
     * code to run in order to execute the test.
     */
    code: string;
}
/**
 * Testrun
 */
export declare class Testrun {
    window: Window;
    app: Window;
    constructor(window: Window, app: Window);
    view: View;
    values: {
        table: {
            data: Suite[];
            columns: Column<Value, Suite>[];
        };
        results: {
            content: HTMLElement;
        };
    };
    static create(w: Window, a: Window): Testrun;
    /**
     * @private
     */
    loadGlobalSuites(): void;
    /**
     * @private
     */
    clearSuite(): void;
    /**
     * @private
     */
    runMocha(f: () => void): void;
    /**
     * runSuite will run the code of the selected suite in the context
     * of the application window.
     */
    runSuite(s: Suite): void;
    /**
     * check the environment to ensure Testrun was initailzed correctly.
     */
    check(): boolean;
    /**
     * run the application.
     */
    run(): void;
}
