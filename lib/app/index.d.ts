import { View } from '@quenk/wml';
import { Value, Object } from '@quenk/noni/lib/data/json';
import { Column } from '@quenk/wml-widgets/lib/data/table';
import { FileChangedEvent } from '@quenk/wml-widgets/lib/control/file-input';
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
    tab: number;
    values: {
        files: {
            text: string;
            multiple: boolean;
            onChange: (e: FileChangedEvent) => void;
        };
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
    loadFromFiles(list: File[]): void;
    /**
     * @private
     */
    clearSuite(): void;
    /**
     * @private
     */
    runMocha(f: () => void): void;
    /**
     * runSuite
     */
    runSuite(s: Suite): void;
    /**
     * run the application.
     */
    run(): void;
}
