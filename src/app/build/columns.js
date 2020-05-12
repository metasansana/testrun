"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var columns_1 = require("./view/columns");
/**
 * NameColumn
 */
var NameColumn = /** @class */ (function () {
    function NameColumn() {
        this.name = 'name';
        this.heading = 'Name';
    }
    return NameColumn;
}());
exports.NameColumn = NameColumn;
/**
 * ActionColumn
 */
var ActionColumn = /** @class */ (function () {
    function ActionColumn(onClick) {
        var _this = this;
        this.onClick = onClick;
        this.name = '';
        this.heading = 'Action';
        this.cellFragment = function (c) { return new columns_1.ActionColumnView({
            id: c.id,
            className: c.className,
            onClick: function () { return _this.onClick(c.row); }
        }); };
    }
    return ActionColumn;
}());
exports.ActionColumn = ActionColumn;
//# sourceMappingURL=columns.js.map