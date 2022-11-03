import * as hbase from '@tg1518/hbase'
import {HbaseModule} from "./model";

export interface HbaseConfig {
    //地址
    host: string;
    //端口
    port: number | string;
    namesPaces?: string;
    //是否同步表
    isSyncTable?: boolean;
}

export interface AllTableData {
    name: string;
}

export class HbaseService {
    public readonly client;
    public readonly basicConfig: HbaseConfig;
    private static example: HbaseService = null;

    /**
     * 初始化
     * @param options
     */
    public static async init(options: HbaseConfig) {
        if(!options.namesPaces) options.namesPaces = "default";
        const client = await this.connect(options.host, options.port, options.namesPaces)
        this.example = new HbaseService(options, client);
        return this.example
    }

    private constructor(options: HbaseConfig, client: any) {
        this.client = client
        this.basicConfig = options
    }

    /**
     * 获取实例
     */
    public static getInstance() {
        return this.example;
    }

    /**
     * hbase连接
     * @param host 地址
     * @param port 端口
     */
    private static async connect(host: string, port: number | string,namesPaces: string) {
        // @ts-ignore
        const client = hbase({host, port})
        return new Promise((resolve, reject) => {
            client.version((error, version) => {
                if (error) {
                    console.error("hbase连接失败")
                    console.info(error)
                    reject(error)
                } else {
                    console.log("hbase连接成功")
                    client.spaceInfo(namesPaces,(err, version) => {
                        if (err){
                            console.error("命名空间不存在")
                        }else{
                            resolve(client)
                        }
                    })

                }
            })
        })

    }

    /**
     * 表初始化
     * @param targets
     */
    public static async forFeature(targets: any[]) {
        const example = this.example;
        if (example) {
            if (example.basicConfig.isSyncTable) {
                await example.createTable(targets)
            }
        }
        return targets
    }

    /**
     * 创建表
     * @param targets
     * @private
     */
    private async createTable(targets: any[]) {
        const allTable = await this.getAllTable()
        try {
            for (let i = 0; i < targets.length; i++) {
                const target = new targets[i]() as HbaseModule<any>;
                //表是否存在
                const isExist = allTable.find(item => item.name === target.getTableName())
                // console.log(55555,isExist)
                if (!isExist) {
                    const column = target.getFields().map(value => ({name: value.name}))
                    // console.log(column)
                    //创建表
                    await new Promise((resolve, reject) => {
                        this.client.table(`${this.basicConfig.namesPaces}:${target.getTableName()}`).create({
                            ColumnSchema: column
                        }, (err, data) => {
                            if (err) {
                                console.log(err)
                                throw err
                                reject(err)
                            } else {
                                // console.log(data)
                                resolve(data)
                            }
                        })
                    })

                }
            }
        } catch (e) {
            console.error(e)
            throw e
        }


    }

    /**
     * 表是否存在
     * @param tableName
     */
    public async isExistTable(tableName: string) {
        return new Promise((resolve, reject) => {
            this.client.table(`${this.basicConfig.namesPaces}:${tableName}`).exists((err, data) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    }

    /**
     * 移除表
     * @param tableName 表名
     */
    public async removeTable(tableName: string) {
        return new Promise((resolve, reject) => {
            this.client.table(`${this.basicConfig.namesPaces}:${tableName}`).delete((err, data) => {
                if (err) {
                    console.error(err)
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })

    }

    /**
     * 获取指定命名空间的表
     */
    public async getAllTable(): Promise<AllTableData[]> {
        return new Promise((resolve, reject) => {
            this.client.spaceTable(this.basicConfig.namesPaces,(err, data) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data.table)
                }
            })
        })
    }
}
