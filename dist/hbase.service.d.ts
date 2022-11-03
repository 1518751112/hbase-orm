export interface HbaseConfig {
    host: string;
    port: number | string;
    namesPaces?: string;
    isSyncTable?: boolean;
}
export interface AllTableData {
    name: string;
}
export declare class HbaseService {
    readonly client: any;
    readonly basicConfig: HbaseConfig;
    private static example;
    /**
     * 初始化
     * @param options
     */
    static init(options: HbaseConfig): Promise<HbaseService>;
    private constructor();
    /**
     * 获取实例
     */
    static getInstance(): HbaseService;
    /**
     * hbase连接
     * @param host 地址
     * @param port 端口
     */
    private static connect;
    /**
     * 表初始化
     * @param targets
     */
    static forFeature(targets: any[]): Promise<any[]>;
    /**
     * 创建表
     * @param targets
     * @private
     */
    private createTable;
    /**
     * 表是否存在
     * @param tableName
     */
    isExistTable(tableName: string): Promise<unknown>;
    /**
     * 移除表
     * @param tableName 表名
     */
    removeTable(tableName: string): Promise<unknown>;
    /**
     * 获取指定命名空间的表
     */
    getAllTable(): Promise<AllTableData[]>;
}
