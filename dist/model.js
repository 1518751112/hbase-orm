"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HbaseModule = exports.PageData = exports.PageE = void 0;
const nanoid_1 = require("nanoid");
const hbase_service_1 = require("./hbase.service");
const dayjs = require("dayjs");
const lodash_1 = require("lodash");
class PageE {
    rowKey;
    page;
    pageSize;
    startTime;
    endTime;
    //单一的只返回一列（可用于更高效地执行行计数操作）
    only;
}
exports.PageE = PageE;
class PageData {
    row;
    total;
    page;
    pageSize;
    totalPage;
}
exports.PageData = PageData;
class HbaseModule {
    constructor() {
        try {
            // this.myTable = HbaseService.getInstance().client.table(this['tableNamea']);
            /* this.fields =
             this.tableName = */
        }
        catch (e) {
        }
        return this;
    }
    /**
     * 插入数据
     * @param para 数据
     */
    // @ts-ignore
    async create(para) {
        const data = [];
        Object.keys(para).forEach(key => {
            const field = this.getFields().find(item => item.name === key);
            if (field && key != "rowKey") {
                data.push({
                    name: key,
                    value: para[key],
                    field: field.field
                });
            }
        });
        const result = this;
        const rowKey = para['rowKey'] || (0, nanoid_1.nanoid)(6) + (Date.now() >> 6);
        this.rowKey = rowKey;
        result.updateAt = Date.now();
        const rows = data.map(value => {
            result[value.name] = value.value;
            return {
                key: rowKey,
                column: value.field,
                timestamp: result.updateAt,
                $: value.value
            };
        });
        //检查key是否存在
        const isKeyExist = await new Promise((resolve, reject) => {
            this.getMyTable().row(rowKey)
                .exists((error, exists) => {
                if (error) {
                    reject(error);
                }
                {
                    resolve(exists);
                }
            });
        });
        if (isKeyExist) {
            throw new Error("key已存在");
            return null;
        }
        return new Promise((resolve, reject) => {
            this.getMyTable().row().put(rows, function (err, success) {
                if (err) {
                    reject(err);
                }
                else {
                    // @ts-ignore
                    resolve(result);
                }
            });
        });
    }
    /**
     * 同步表结构
     */
    async syncField() {
        try {
            const column = this.getFields().map(value => ({ name: value.name }));
            return new Promise((resolve, reject) => {
                this.getMyTable().update({ ColumnSchema: column }, function (err, success) {
                    if (err) {
                        console.error(err);
                        reject(err);
                    }
                    {
                        resolve(success);
                    }
                });
            });
        }
        catch (e) {
            console.error(e);
            throw e;
        }
    }
    /**
     * 查询单个数据
     * @param key 主键key
     */
    async findKey(key) {
        return new Promise((resolve, reject) => {
            this.getMyTable().row(key).get((err, data) => {
                if (err) {
                    resolve(null);
                }
                else {
                    const result = new HbaseModule();
                    data.forEach(value => {
                        if (value.key && !result.rowKey) {
                            result.rowKey = value.key;
                        }
                        else if (!value.key) {
                            result.rowKey = key;
                        }
                        if (!value.key || value.key == result.rowKey) {
                            result[value.column.replace(/\:\w+/, '')] = value.$;
                            if (!result.updateAt || result.updateAt < value.timestamp) {
                                result.updateAt = value.timestamp;
                            }
                        }
                    });
                    // @ts-ignore
                    resolve(result);
                }
            });
        });
    }
    /**
     * 查询多个数据
     */
    async findAll(options) {
        let { rowKey, startTime, endTime } = options;
        const config = {};
        const filters = [
            {
                "op": "EQUAL",
                "type": "RowFilter",
                "comparator": { "value": `${rowKey || ""}.*`, "type": "RegexStringComparator" }
            }
        ];
        // @ts-ignore
        if ((0, lodash_1.isDate)(startTime))
            startTime = startTime.getTime();
        // @ts-ignore
        if ((0, lodash_1.isDate)(endTime))
            endTime = endTime.getTime();
        if (typeof startTime == "string" && isNaN(Number(startTime)))
            startTime = dayjs(startTime).valueOf();
        if (typeof endTime == "string" && isNaN(Number(endTime)))
            endTime = dayjs(endTime).valueOf();
        if (typeof startTime == "number")
            config.startTime = startTime;
        if (typeof endTime == "number")
            config.endTime = endTime;
        if (options.only) {
            filters.push({
                "type": "FirstKeyOnlyFilter" // 只查询第一个key
            });
        }
        return new Promise((resolve, reject) => {
            this.getMyTable().scan({
                filter: {
                    "op": "MUST_PASS_ALL", "type": "FilterList", "filters": filters
                },
                maxVersions: 1,
                // batch:1,
                ...config
            }, (err, data) => {
                if (err) {
                    resolve(null);
                }
                else {
                    const result = [];
                    data.forEach(value => {
                        let temp = result.find(v => v.rowKey == value.key);
                        if (!temp) {
                            temp = new HbaseModule();
                            temp.rowKey = value.key;
                            result.push(temp);
                        }
                        if (!temp.updateAt || temp.updateAt < value.timestamp) {
                            temp.updateAt = value.timestamp;
                        }
                        //获取字段多余名称
                        temp[value.column.replace(/\:\w+/, '')] = value.$;
                    });
                    result.sort((a, b) => b.updateAt - a.updateAt);
                    // @ts-ignore
                    resolve(result);
                }
            });
        });
    }
    /**
     * 删除数据
     */
    async delete(key, options) {
        let keys = key ? Array.isArray(key) ? key : [key] : [this.rowKey];
        const arr = [];
        if (options) {
            if (options.vague) {
                const li = [];
                for (let i = 0; i < keys.length; i++) {
                    const result = await this.findAll({ rowKey: keys[i], only: true });
                    li.push(...result.map(v => v.rowKey));
                }
                keys = li;
            }
        }
        console.log("共：" + keys.length);
        for (let i = 0; i < keys.length; i++) {
            await new Promise((resolve, reject) => {
                this.getMyTable().row(keys[i]).delete((err, success) => {
                    if (success) {
                        arr.push(keys[i]);
                    }
                    resolve(null);
                });
            });
        }
        return arr;
    }
    /**
     * 分页查询
     */
    async findPage(options) {
        let { rowKey, page, pageSize, startTime, endTime } = options;
        page = Number(page || 1);
        pageSize = Number(pageSize || 10);
        const config = {};
        const filters = [
            {
                "op": "EQUAL",
                "type": "RowFilter",
                "comparator": { "value": `${rowKey || ""}.*`, "type": "RegexStringComparator" }
            }
        ];
        // @ts-ignore
        if ((0, lodash_1.isDate)(startTime))
            startTime = startTime.getTime();
        // @ts-ignore
        if ((0, lodash_1.isDate)(endTime))
            endTime = endTime.getTime();
        if (typeof startTime == "string" && isNaN(Number(startTime)))
            startTime = dayjs(startTime).valueOf();
        if (typeof endTime == "string" && isNaN(Number(endTime)))
            endTime = dayjs(endTime).valueOf();
        if (typeof startTime == "number")
            config.startTime = startTime;
        if (typeof endTime == "number")
            config.endTime = endTime;
        if (options.only) {
            filters.push({
                "type": "FirstKeyOnlyFilter" // 只查询第一个key
            });
        }
        return new Promise((resolve, reject) => {
            this.getMyTable().scan({
                filter: {
                    "op": "MUST_PASS_ALL", "type": "FilterList", "filters": filters
                },
                maxVersions: 1,
                // batch:1,
                ...config
            }, (err, data) => {
                if (err) {
                    resolve(null);
                }
                else {
                    const result = [];
                    data.forEach(value => {
                        let temp = result.find(v => v.rowKey == value.key);
                        if (!temp) {
                            temp = new HbaseModule();
                            temp.rowKey = value.key;
                            result.push(temp);
                        }
                        if (!temp.updateAt || temp.updateAt < value.timestamp) {
                            temp.updateAt = value.timestamp;
                        }
                        //获取字段多余名称
                        temp[value.column.replace(/\:\w+/, '')] = value.$;
                    });
                    //分页
                    const start = (page - 1) * pageSize;
                    const end = page * pageSize;
                    result.sort((a, b) => b.updateAt - a.updateAt);
                    resolve({
                        // @ts-ignore
                        row: result.slice(start, end),
                        total: result.length,
                        page,
                        pageSize,
                        totalPage: Math.ceil(result.length / pageSize)
                    });
                }
            });
        });
    }
    /**
     * 保存、更新、创建数据
     */
    async save() {
        return this.rowKey ? this.update() : this.create(this);
    }
    /**
     * 更新数据
     */
    // @ts-ignore
    async update(para, rowKey) {
        rowKey = rowKey || this.rowKey;
        para = para || this;
        if (!rowKey) {
            throw new Error('主键rowKey不能为空');
        }
        //检查key是否存在 不在就不更新
        const isKeyExist = await new Promise((resolve, reject) => {
            this.getMyTable().row(rowKey)
                .exists((error, exists) => {
                if (error) {
                    reject(error);
                }
                {
                    resolve(exists);
                }
            });
        });
        if (!isKeyExist) {
            return false;
        }
        const data = [];
        Object.keys(para).forEach(key => {
            const field = this.getFields().find(item => item.name === key);
            if (field && key != "rowKey") {
                data.push({
                    name: key,
                    value: para[key],
                    field: field.field
                });
            }
        });
        // const result: HbaseModule<T> = this;
        const rows = data.map(value => {
            // result[value.name] = value.value
            return {
                key: rowKey,
                column: value.field,
                timestamp: Date.now(),
                $: value.value
            };
        });
        return new Promise((resolve, reject) => {
            this.getMyTable().row().put(rows, function (err, success) {
                if (err) {
                    reject(err);
                }
                else {
                    // @ts-ignore
                    resolve(true);
                }
            });
        });
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
    getTableName() {
        return this['tableName'];
    }
    /**
     * 从装饰器中获取字段列表
     */
    getFields() {
        return this['fieldList'];
    }
    /**
     * 获取表的控制器
     */
    getMyTable() {
        const h = hbase_service_1.HbaseService.getInstance();
        return h.client.table(`${h.basicConfig.namesPaces}:${this['tableName']}`);
    }
}
exports.HbaseModule = HbaseModule;
