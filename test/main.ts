import {HbaseService} from "../index";
import {DeviceLog} from "./model/deviceLog.model";


const app = async ()=> {
    //连接hbase rest服务
    await HbaseService.init({
        host:'*******',
        port:9021,
        namesPaces:"test", //指定命名空间
        isSyncTable:true, //是否自动创建表
    })

    setTimeout(()=>{
        const log = new DeviceLog();
        log.rowKey = "edd_test_key" //指定行key 也可以不添加随机生成
        log.value = "11";
        log.save() //保存
        log.delete()
    },5000)

}
app()
