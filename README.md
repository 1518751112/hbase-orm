# hbase-orm

## 简介
由于项目需求使用hbase 但是发现它居然不是像mysql的使用方法。后来自己翻文档自己定义CURD尽量靠近mysql 但是查询还是有问题目前支持主键查询 可以模糊查询

## 注意
目前只是用了ts写法 js还没有试过

## 示例

```javascript
import {HbaseModule, HColumn, HTable} from "../../index";

//模型
@HTable({tableName: 'device_log'})
export class DeviceLog extends HbaseModule<DeviceLog> {
  @HColumn()
  declare value:string
}

```
```javascript
import {HbaseService} from "../index";
import {DeviceLog} from "./model/deviceLog.model";


const app = async ()=> {
//连接hbase rest服务
const service = await HbaseService.init({
host:'*******',
port:9021,
namesPaces:"test", //指定命名空间
isSyncTable:true, //是否自动创建表
})
// 这样也可以获取实例 HbaseService.getInstance()
    setTimeout(()=>{
        const log = new DeviceLog();
        log.rowKey = "edd_test_key" //指定行key 也可以不添加随机生成
        log.value = "11";
        log.save() //保存
        log.delete();//移除实例
        log.delete("test1"); //移除指定key
        log.create({value:"5545"})
    },5000)

}
app()
```

## 其他说明
### 连接成功有打印 失败会报错
![](https://github.com/1518751112/hbase-orm/blob/main/img/e46.png?raw=true)
###注解

  | 注解名            | description      | description      |
  | ---------------- | ---------------- | ---------------- |
  | HTable           | tableName 自定义表名 | 表注解 表示这是个表 [不配置表名默认使用类名]         |
  | HColumn          | name 自定义字段名 | 表示这是个列           |

###方法 具体参数看源码
| name             | description      |
| ---------------- | ---------------- |
| HbaseService.init           | 初始化hbase连接         |
| HbaseService.getInstance           | 获取hbase实例           |
| HbaseService.isExistTable           | 检测表是否存在           |
| HbaseService.removeTable           | 移除表           |
| HbaseService.getAllTable           | 获取指定命名空间的表           |
| Model.create           | 插入数据           |
| Model.findKey           | 查询单个数据           |
| Model.findAll           | 查询多个数据           |
| Model.delete           | 删除数据           |
| Model.findPage           | 分页查询。 注：其实是伪分页           |
| Model.save           | 保存、更新、创建数据           |
| Model.update           | 更新数据           |
| Model.getTableName           | 从装饰器中获取表名           |
| Model.getFields           | 从装饰器中获取字段列表           |
| Model.getMyTable           | 获取表的控制器           |


