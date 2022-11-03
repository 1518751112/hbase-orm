"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HbaseService = void 0;
const hbase = require("@tg1518/hbase");
class HbaseService {
    client;
    basicConfig;
    static example = null;
    /**
     * 初始化
     * @param options
     */
    static async init(options) {
        if (!options.namesPaces)
            options.namesPaces = "default";
        const client = await this.connect(options.host, options.port, options.namesPaces);
        this.example = new HbaseService(options, client);
        return this.example;
    }
    constructor(options, client) {
        this.client = client;
        this.basicConfig = options;
    }
    /**
     * 获取实例
     */
    static getInstance() {
        return this.example;
    }
    /**
     * hbase连接
     * @param host 地址
     * @param port 端口
     */
    static async connect(host, port, namesPaces) {
        // @ts-ignore
        const client = hbase({ host, port });
        return new Promise((resolve, reject) => {
            client.version((error, version) => {
                if (error) {
                    console.error("hbase连接失败");
                    console.info(error);
                    reject(error);
                }
                else {
                    console.log("hbase连接成功");
                    client.spaceInfo(namesPaces, (err, version) => {
                        if (err) {
                            console.error("命名空间不存在");
                        }
                        else {
                            resolve(client);
                        }
                    });
                }
            });
        });
    }
    /**
     * 表初始化
     * @param targets
     */
    static async forFeature(targets) {
        const example = this.example;
        if (example) {
            if (example.basicConfig.isSyncTable) {
                await example.createTable(targets);
            }
        }
        return targets;
    }
    /**
     * 创建表
     * @param targets
     * @private
     */
    async createTable(targets) {
        const allTable = await this.getAllTable();
        try {
            for (let i = 0; i < targets.length; i++) {
                const target = new targets[i]();
                //表是否存在
                const isExist = allTable.find(item => item.name === target.getTableName());
                // console.log(55555,isExist)
                if (!isExist) {
                    const column = target.getFields().map(value => ({ name: value.name }));
                    // console.log(column)
                    //创建表
                    await new Promise((resolve, reject) => {
                        this.client.table(`${this.basicConfig.namesPaces}:${target.getTableName()}`).create({
                            ColumnSchema: column
                        }, (err, data) => {
                            if (err) {
                                console.log(err);
                                throw err;
                                reject(err);
                            }
                            else {
                                // console.log(data)
                                resolve(data);
                            }
                        });
                    });
                }
            }
        }
        catch (e) {
            console.error(e);
            throw e;
        }
    }
    /**
     * 表是否存在
     * @param tableName
     */
    async isExistTable(tableName) {
        return new Promise((resolve, reject) => {
            this.client.table(`${this.basicConfig.namesPaces}:${tableName}`).exists((err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    /**
     * 移除表
     * @param tableName 表名
     */
    async removeTable(tableName) {
        return new Promise((resolve, reject) => {
            this.client.table(`${this.basicConfig.namesPaces}:${tableName}`).delete((err, data) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    /**
     * 获取指定命名空间的表
     */
    async getAllTable() {
        return new Promise((resolve, reject) => {
            this.client.spaceTable(this.basicConfig.namesPaces, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data.table);
                }
            });
        });
    }
}
exports.HbaseService = HbaseService;
