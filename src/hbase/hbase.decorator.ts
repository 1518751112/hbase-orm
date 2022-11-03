
export interface HTableConfig{
    //表名
    tableName?:string;
}
export interface HColumnConfig{
    name?:string;
}

export interface Field{
    name:string;
    field:string
}

/**
 * hbase表注解 表示这是个表 [不配置表名默认使用类名]
 * @param options
 * @constructor
 */
export function HTable(options?: HTableConfig) {
    return function HTable(target: any) {
        // console.log(target['fieldList'],options);
        target.prototype.tableName = options?options.tableName:target.name ; // 给类增加属性
    }
}

/**
 * hbase列注解 表示这是个列
 * @param name
 * @constructor
 */
export function HColumn(name?:string) {
    return function HColumn(target: any, propertyKey: string) {
        const fieldList = target['fieldList'] || [] as Field[];
        fieldList.push({
            name:propertyKey,
            field:`${propertyKey}:c${fieldList.length+1}`
        })
        target['fieldList'] = fieldList
        // console.log(target)
    };
};

