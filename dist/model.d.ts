import { Field } from "./hbase.decorator";
export interface FieldP extends Field {
    value: any;
}
export interface DataRes {
    key?: string;
    column: string;
    timestamp: number;
    $: string;
}
export declare class PageE {
    rowKey: string;
    page: number;
    pageSize: number;
    startTime?: number | string | Date;
    endTime?: number | string | Date;
    only?: boolean;
}
export interface DeleteOptions {
    vague?: boolean;
}
export declare class PageData<T> {
    row: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPage: number;
}
export declare class HbaseModule<T> {
    rowKey: string;
    updateAt: number;
    constructor();
    /**
     * 插入数据
     * @param para 数据
     */
    create(para: CreationAttributes<T> | this): Promise<T>;
    /**
     * 同步表结构
     */
    syncField(): Promise<unknown>;
    /**
     * 查询单个数据
     * @param key 主键key
     */
    findKey(key: string): Promise<T>;
    /**
     * 查询多个数据
     */
    findAll(options: Omit<PageE, "page" | "pageSize">): Promise<HbaseModule<T>[]>;
    /**
     * 删除数据
     */
    delete(key?: string | string[], options?: DeleteOptions): Promise<string[]>;
    /**
     * 分页查询
     */
    findPage(options: PageE): Promise<PageData<T>>;
    /**
     * 保存、更新、创建数据
     */
    save(): Promise<unknown>;
    /**
     * 更新数据
     */
    update(para?: CreationAttributes<T> | this, rowKey?: string): Promise<unknown>;
    /**
     * 从装饰器中获取表名
     */
    getTableName(): string;
    /**
     * 从装饰器中获取字段列表
     */
    getFields(): Field[];
    /**
     * 获取表的控制器
     */
    getMyTable(): any;
}
export interface ScanOptions {
    startTime?: number;
    endTime?: number;
    filter?: any;
}
export declare type NullishPropertiesOf<T> = {
    [P in keyof T]-?: undefined extends T[P] ? P : null extends T[P] ? P : never;
}[keyof T];
export declare type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
/**
 * 使用此类型可以让填写的类型参数为可选的
 */
export declare type MakeNullishOptional<T extends object> = T extends any ? Optional<T, NullishPropertiesOf<T>> : never;
/**
 * 处理属性
 */
export declare type CreationAttributes<M extends object> = MakeNullishOptional<M>;
