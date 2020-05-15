export declare const SCRIPT_INIT_TEST_ENV = "/build/content/initTestEnv.js";
export declare const SCRIPT_INIT_TEST_RESULT_ENV = "/build/content/initTestResultEnv.js";
/**
 * execContentScriptFile executes a content script using an extension file
 * path.
 *
 * This function preloads the chrome polyfill before execution.
 */
export declare const execContentScriptFile: (id: number, file: string) => Promise<void>;
