import { Value } from '@quenk/noni/lib/data/json';
import { Column, CellContext } from '@quenk/wml-widgets/lib/data/table';
import { ActionColumnView } from './view/columns';
import { Suite } from './';
/**
 * NameColumn
 */
export declare class NameColumn implements Column<Value, Suite> {
    name: string;
    heading: string;
}
/**
 * ActionColumnViewCtx
 */
export interface ActionColumnViewCtx {
    id: string;
    className: string;
    onClick: () => void;
}
/**
 * ActionColumn
 */
export declare class ActionColumn implements Column<Value, Suite> {
    onClick: (n: number) => void;
    constructor(onClick: (n: number) => void);
    name: string;
    heading: string;
    cellFragment: (c: CellContext<Value, Suite>) => ActionColumnView;
}
