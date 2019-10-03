import { assert } from '@quenk/test/lib/assert';

describe('button', () => {

    describe('button0', () => {

        it('should be disabled', () => {

            let e = <HTMLButtonElement>document.getElementById('button0');

            assert(e.disabled).true();

        })

    })

})
