import { Base, field, schema, makeModel, method, pre } from "~/lib/mongoose";
import { timeparser } from "~/lib/timeparser";

@schema()
class Temp extends Base {
  @field({ type: String, required: true })
  roleId: string

  @field({ type: String, required: true })
  userId: string

  @field({ type: Date, default: Date.now })
  created: Date

  @field({ type: Date, default: Date.now })
  endTime: Date

  @field({ type: Date })
  updateTime: Date

  @method()
  append(time: string | Date | number) {
    let { endTime } = this

    if (typeof time == 'string')
      time = timeparser(time)

    if (time instanceof Date)
      endTime = time
    else
      endTime = new Date(+endTime + time)

    this.endTime = endTime
    return this
  }

  @pre('save')
  private _preSave() {
    this.updateTime = new Date()
  }
}

export class TempModel extends makeModel(Temp) {
  static async findLose() {
    return this.find({ endTime: { $lte: new Date() } })
  }

  static async createRole(userId: string, roleId: string) {
    return new this({userId, roleId})
  }

  static async appendRole(userId: string, roleId: string, time: string | Date | number) {
    const find = await this.findOne({ userId, roleId }) || new this({ userId, roleId })
    return find.append(time).save()
  }

  static async removeRole(userId: string, roleId: string) {
    return this.deleteOne({userId, roleId}).exec()
  }
}