import {Field, HColumn} from "./hbase.decorator";
import {nanoid} from "nanoid";
import {HbaseService} from "./hbase.service";
import * as dayjs from "dayjs";
import {isDate} from "lodash";

export interface FieldP extends Field {
    value: any;
}

export interface DataRes {
    key?: string;
    column: string;
    timestamp: number;
    $: string
}

export class PageE {
    rowKey: string
    page: number
    pageSize: number
    startTime?: number|string|Date
    endTime?: number|string|Date
    //单一的只返回一列（可用于更高效地执行行计数操作）
    only?:boolean
}

export interface DeleteOptions {
    //模糊移除，如果为true，则表示删除所有包含rowKey前缀的行
    vague?: boolean
}

export class PageData<T> {
    row: T[];
    total: number
    page: number
    pageSize: number
    totalPage: number

}

export class HbaseModule<T> {
    /*private readonly fields: Field[] = [];
    private readonly tableName:string;*/
    //唯一键
    // @HColumn()  不能在父类使用同样的装饰器
    declare rowKey: string;

    //更新时间戳
    declare updateAt: number;

    constructor() {
        try {
            // this.myTable = HbaseService.getInstance().client.table(this['tableNamea']);
            /* this.fields =
             this.tableName = */
        } catch (e) {

        }
        return this;

    }

    /**
     * 插入数据
     * @param para 数据
     */
    // @ts-ignore
    public async create(para: CreationAttributes<T> | this): Promise<T> {
        const data: FieldP[] = []
        Object.keys(para).forEach(key => {
            const field = this.getFields().find(item => item.name === key)
            if (field && key != "rowKey") {
                data.push({
                    name: key,
                    value: para[key],
                    field: field.field
                })
            }
        })
        const result: HbaseModule<T> = this;
        const rowKey = para['rowKey'] || nanoid(6) + (Date.now() >> 6)
        this.rowKey = rowKey
        result.updateAt = Date.now()
        const rows = data.map(value => {
            result[value.name] = value.value
            return {
                key: rowKey,
                column: value.field,
                timestamp: result.updateAt,
                $: value.value
            }
        });
        //检查key是否存在
        const isKeyExist = await new Promise((resolve, reject) => {
            this.getMyTable().row(rowKey)
                .exists((error, exists) => {
                    if (error) {
                        reject(error)
                    }
                    {
                        resolve(exists)
                    }
                })
        })
        if (isKeyExist) {
            throw new Error("key已存在")
            return null
        }
        return new Promise((resolve, reject) => {
            this.getMyTable().row().put(rows, function (err, success) {
                if (err) {
                    reject(err)
                } else {
                    // @ts-ignore
                    resolve(result)
                }
            })
        })

    }

    /**
     * 同步表结构
     */
    public async syncField() {
        try {
            const column = this.getFields().map(value => ({name: value.name}))
            return new Promise((resolve, reject) => {
                this.getMyTable().update({ColumnSchema: column}, function (err, success) {
                    if (err) {
                        console.error(err)
                        reject(err)
                    }
                    {
                        resolve(success)
                    }
                })
            })
        } catch (e) {
            console.error(e)
            throw e
        }


    }

    /**
     * 查询单个数据
     * @param key 主键key
     */
    public async findKey(key: string): Promise<T> {
        return new Promise((resolve, reject) => {
            this.getMyTable().row(key).get((err, data: DataRes[]) => {
                if (err) {
                    resolve(null)
                } else {
                    const result = new HbaseModule<T>()
                    data.forEach(value => {
                        if (value.key && !result.rowKey) {
                            result.rowKey = value.key
                        } else if (!value.key) {
                            result.rowKey = key
                        }
                        if (!value.key || value.key == result.rowKey) {
                            result[value.column.replace(/\:\w+/, '')] = value.$
                            if (!result.updateAt || result.updateAt < value.timestamp) {
                                result.updateAt = value.timestamp
                            }
                        }
                    })
                    // @ts-ignore
                    resolve(result)
                }
            })
        })
    }

    /**
     * 查询多个数据
     */
    public async findAll(options: Omit<PageE,"page"|"pageSize">): Promise<HbaseModule<T>[]> {
        let {rowKey, startTime, endTime} = options
        const config: ScanOptions = {}
        const filters:any = [
            {
                "op": "EQUAL",
                // "type": "RowFilter", // 行过滤器
                "type": "PrefixFilter",
                value: rowKey || "",
                // "comparator": {"value": `${rowKey || ""}.*`, "type": "RegexStringComparator"} // 正则匹配 速度慢
            }
        ]
        // @ts-ignore
        if(isDate(startTime))startTime = startTime.getTime();
        // @ts-ignore
        if(isDate(endTime))endTime = endTime.getTime();
        if(typeof startTime == "string"&&isNaN(Number(startTime)))startTime = dayjs(startTime).valueOf();
        if(typeof endTime == "string"&&isNaN(Number(endTime)))endTime = dayjs(endTime).valueOf();

        if (typeof startTime == "number") config.startTime = startTime
        if (typeof endTime == "number") config.endTime = endTime
        if(options.only){
            filters.push({
                "type": "FirstKeyOnlyFilter" // 只查询第一个key
            })
        }

        return new Promise((resolve, reject) => {
            this.getMyTable().scan({
                filter: {
                    "op": "MUST_PASS_ALL", "type": "FilterList", "filters": filters
                },
                maxVersions:1,
                // batch:1,
                ...config
            }, (err, data: DataRes[]) => {
                if (err) {
                    resolve(null)
                } else {
                    const result: HbaseModule<T>[] = [];
                    data.forEach(value => {
                        let temp = result.find(v => v.rowKey == value.key)
                        if (!temp) {
                            temp = new HbaseModule<T>();
                            temp.rowKey = value.key
                            result.push(temp)
                        }

                        if (!temp.updateAt || temp.updateAt < value.timestamp) {
                            temp.updateAt = value.timestamp
                        }
                        //获取字段多余名称
                        temp[value.column.replace(/\:\w+/, '')] = value.$
                    })
                    result.sort((a,b)=>b.updateAt-a.updateAt)
                    // @ts-ignore
                    resolve(result)
                }
            })
        })
    }

    /**
     * 删除数据
     */
    public async delete(key?: string | string[],options?: DeleteOptions){
        let keys = key ? Array.isArray(key) ? key : [key] : [this.rowKey]
        const arr: string[] = []
        if (options) {
            if(options.vague){
                const li:string[] = []
                for (let i = 0; i < keys.length; i++) {
                    const result = await this.findAll({rowKey:keys[i],only:true})
                    li.push(...result.map(v=>v.rowKey))
                }
                keys = li

            }
        }
        console.log("共："+keys.length)
        for (let i = 0; i < keys.length; i++) {
            await new Promise((resolve, reject) => {
                this.getMyTable().row(keys[i]).delete((err, success) => {
                    if (success) {
                        arr.push(keys[i])
                    }
                    resolve(null)
                })
            })
        }
        return arr
    }

    /**
     * 分页查询
     */
    public async findPage(options: PageE): Promise<PageData<T>> {
        let {rowKey, page, pageSize, startTime, endTime} = options
        page = Number(page || 1)
        pageSize = Number(pageSize || 10)
        const config: ScanOptions = {}
        const filters:any = [
            {
                "op": "EQUAL",
                "type": "PrefixFilter",
                value: rowKey || "",
                // "type": "RowFilter",
                // "comparator": {"value": `${rowKey || ""}.*`, "type": "RegexStringComparator"}
            }
        ]

        // @ts-ignore
        if(isDate(startTime))startTime = startTime.getTime();
        // @ts-ignore
        if(isDate(endTime))endTime = endTime.getTime();
        if(typeof startTime == "string"&&isNaN(Number(startTime)))startTime = dayjs(startTime).valueOf();
        if(typeof endTime == "string"&&isNaN(Number(endTime)))endTime = dayjs(endTime).valueOf();

        if (typeof startTime == "number") config.startTime = startTime
        if (typeof endTime == "number") config.endTime = endTime
        if(options.only){
            filters.push({
                "type": "FirstKeyOnlyFilter" // 只查询第一个key
            })
        }

        return new Promise((resolve, reject) => {
            this.getMyTable().scan({
                filter: {
                    "op": "MUST_PASS_ALL", "type": "FilterList", "filters": filters
                },
                maxVersions:1,
                // batch:1,
                ...config
            }, (err, data: DataRes[]) => {
                if (err) {
                    resolve(null)
                } else {
                    const result: HbaseModule<T>[] = [];
                    data.forEach(value => {
                        let temp = result.find(v => v.rowKey == value.key)
                        if (!temp) {
                            temp = new HbaseModule<T>();
                            temp.rowKey = value.key
                            result.push(temp)
                        }

                        if (!temp.updateAt || temp.updateAt < value.timestamp) {
                            temp.updateAt = value.timestamp
                        }
                        //获取字段多余名称
                        temp[value.column.replace(/\:\w+/, '')] = value.$
                    })
                    //分页
                    const start = (page - 1) * pageSize;
                    const end = page * pageSize;
                    result.sort((a,b)=>b.updateAt-a.updateAt)
                    resolve({
                        // @ts-ignore
                        row: result.slice(start, end),
                        total: result.length,
                        page,
                        pageSize,
                        totalPage: Math.ceil(result.length / pageSize)
                    })
                }
            })
        })
    }

    /**
     * 保存、更新、创建数据
     */
    public async save() {
        return this.rowKey ? this.update() : this.create(this)
    }

    /**
     * 更新数据
     */
    // @ts-ignore
    public async update(para?: CreationAttributes<T> | this, rowKey?: string) {
        rowKey = rowKey || this.rowKey;
        para = para || this;
        if (!rowKey) {
            throw new Error('主键rowKey不能为空')
        }

        //检查key是否存在 不在就不更新
        const isKeyExist = await new Promise((resolve, reject) => {
            this.getMyTable().row(rowKey)
                .exists((error, exists) => {
                    if (error) {
                        reject(error)
                    }
                    {
                        resolve(exists)
                    }
                })
        })
        if (!isKeyExist) {
            return false
        }

        const data: FieldP[] = []
        Object.keys(para).forEach(key => {
            const field = this.getFields().find(item => item.name === key)
            if (field && key != "rowKey") {
                data.push({
                    name: key,
                    value: para[key],
                    field: field.field
                })
            }
        })
        // const result: HbaseModule<T> = this;
        const rows = data.map(value => {
            // result[value.name] = value.value
            return {
                key: rowKey,
                column: value.field,
                timestamp: Date.now(),
                $: value.value
            }
        });

        return new Promise((resolve, reject) => {
            this.getMyTable().row().put(rows, function (err, success) {
                if (err) {
                    reject(err)
                } else {
                    // @ts-ignore
                    resolve(true)
                }
            })
        })


    }

    /*    public async toJSON(){
            const data:any={}
            this.fields.forEach(value => {
                data[value.name] = this[value.name]
            })
            return data
        }*/

    /**
     * 从装饰器中获取表名
     */
    public getTableName(): string {
        return this['tableName']
    }

    /**
     * 从装饰器中获取字段列表
     */
    public getFields(): Field[] {
        return this['fieldList']
    }

    /**
     * 获取表的控制器
     */
    public getMyTable() {
        const h = HbaseService.getInstance()
        return h.client.table(`${h.basicConfig.namesPaces}:${this['tableName']}`);
    }


}

export interface ScanOptions {
    startTime?: number; //开始时间戳
    endTime?: number; //结束时间戳
    filter?: any; //筛选配置

}

export type NullishPropertiesOf<T> = {
    [P in keyof T]-?: undefined extends T[P] ? P
        : null extends T[P] ? P
            : never
}[keyof T];
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 使用此类型可以让填写的类型参数为可选的
 */
export type MakeNullishOptional<T extends object> = T extends any ? Optional<T, NullishPropertiesOf<T>> : never;
/**
 * 处理属性
 */
export type CreationAttributes<M extends object> = MakeNullishOptional<M>;
