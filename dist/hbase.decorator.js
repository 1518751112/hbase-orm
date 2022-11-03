"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HColumn = exports.HTable = void 0;
/**
 * hbase表注解 表示这是个表 [不配置表名默认使用类名]
 * @param options
 * @constructor
 */
function HTable(options) {
    return function HTable(target) {
        // console.log(target['fieldList'],options);
        target.prototype.tableName = options ? options.tableName : target.name; // 给类增加属性
    };
}
exports.HTable = HTable;
/**
 * hbase列注解 表示这是个列
 * @param name
 * @constructor
 */
function HColumn(name) {
    return function HColumn(target, propertyKey) {
        const fieldList = target['fieldList'] || [];
        fieldList.push({
            name: propertyKey,
            field: `${propertyKey}:c${fieldList.length + 1}`
        });
        target['fieldList'] = fieldList;
        // console.log(target)
    };
}
exports.HColumn = HColumn;
;
