import { assert } from '@quenk/test/lib/assert';

describe('button', () => {

    describe('button0', () => {

        it('should be disabled', () => {

            let e = <HTMLButtonElement>document.getElementById('button0');

            assert(e.disabled).true();

        });

        it('should execute cli scripts', done => {

            window.execCLIScript('echo', 'hello',
                (e: null | Error, msg: string) => {

                    try {

                        assert(e).undefined();

                        assert(msg).equal('hello');

                        done();

                    } catch (e) {

                        done(e);

                    }

                });

        });

        it('should not execute unknown cli scripts', done => {

            window.execCLIScript('tree', '/',
                (e: null | Error, _: string) => {

                    try {

                        assert(e).not.undefined();

                        done();

                    } catch (e) {

                        done(e);

                    }

                });

        });


    })

})
