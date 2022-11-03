export interface HTableConfig {
    tableName?: string;
}
export interface HColumnConfig {
    name?: string;
}
export interface Field {
    name: string;
    field: string;
}
/**
 * hbase表注解 表示这是个表 [不配置表名默认使用类名]
 * @param options
 * @constructor
 */
export declare function HTable(options?: HTableConfig): (target: any) => void;
/**
 * hbase列注解 表示这是个列
 * @param name
 * @constructor
 */
export declare function HColumn(name?: string): (target: any, propertyKey: string) => void;
