import { Value } from '@quenk/noni/lib/data/json';

import { Column, CellContext } from '@quenk/wml-widgets/lib/data/table';

import { ActionColumnView } from './view/columns';
import { Suite } from './';

/**
 * NameColumn
 */
export class NameColumn implements Column<Value, Suite> {

    name = 'name';

    heading = 'Name';

}

/**
 * ActionColumnViewCtx
 */
export interface ActionColumnViewCtx {

    id: string,

    className: string,

    onClick: () => void

}

/**
 * ActionColumn
 */
export class ActionColumn implements Column<Value, Suite> {

    constructor(public onClick: (n: number) => void) { }

    name = '';

    heading = 'Action';

    cellFragment = (c: CellContext<Value, Suite>) => new ActionColumnView({

        id: c.id,

        className: c.className,

        onClick: () => this.onClick(c.row)

    })

}
