import {HbaseModule, HColumn, HTable} from "../../index";

@HTable({tableName: 'device_log'})
export class DeviceLog extends HbaseModule<DeviceLog> {
  @HColumn()
  declare value:string
}
