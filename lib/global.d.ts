declare var cloneInto: any;

interface Window {

    execCLIScript: Function,

    cloneInto: any,

    Mocha: {

        reporters: {

            Base: import('mocha').reporters

        },

        Runner: {

            constants: {

                EVENT_TEST_PASS: string,
                EVENT_TEST_FAIL: string,
                EVENT_TEST_END: string,
                EVENT_RUN_END: string,
                EVENT_TEST_PENDING: string

            }

        }

    },

    mocha: {

        setup(opts?: Mocha.Interface | Mocha.MochaSetupOptions): Mocha

        run(): Mocha.Runner

    }

}

declare namespace browser {

    interface tabs { }

}
