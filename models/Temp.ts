import { Base, field, schema, makeModel, method, pre } from "~/lib/mongoose";
import { timeparser } from "~/lib/timeparser";
import { Events } from "~/lib/rpcapi";

export const tempModelEvents = new (class TemproleEvents extends Events<{
  appendRole(
    userId: string, 
    roleId: string, 
    timeEnd: number, 
    deltaTime: number, 
    moderId: string, 
    reson: string
  ): void

  updateRole(
    userId: string, 
    roleId: string, 
    timeEnd: number, 
    deltaTime: number, 
    moderId: string, 
    reson: string
  ): void

  deleteRole(
    userId: string, 
    roleId: string, 
    timeEnd: number, 
    deltaTime: number, 
    moderId: string, 
    reson: string
  ): void
}>{ })

@schema()
class Temp extends Base {
  @field({ type: Boolean, default: false })
  removed: boolean

  @field({ type: String, required: true })
  roleId: string

  @field({ type: String, required: true })
  userId: string

  @field({ type: Date, default: Date.now })
  created: Date

  @field({ type: Date, default: Date.now })
  endTime: Date

  @field({ type: Boolean, default: false })
  inUser: boolean

  @field({ type: Date })
  updateTime: Date

  @field({ type: Object, default: {} })
  info: {
    moderId?: string
    reson?: string
  }

  @field({ type: [Date], default: [] })
  appends: Date[]

  @method()
  append(time: string | Date | number, moderId?: string, reson?: string) {
    let { endTime } = this

    this.appends.push(new Date())

    if (typeof time == 'string')
      time = timeparser(time, endTime)

    if (time instanceof Date)
      endTime = time
    else
      endTime = new Date(+time)

    this.endTime = endTime
    return this.save()
  }

  @method()
  async deleteRole(deletedUser = false, moderId?: string, reson?: string) {
    this.removed = true

    if (deletedUser)
      this.inUser = false

    const { userId, roleId } = this
    tempModelEvents.emit('deleteRole', userId, roleId, +this.endTime, 0, moderId, reson)
    return this.save()
  }

  @pre('save')
  private _preSave() {
    this.updateTime = new Date()
  }
}

export class TempModel extends makeModel(Temp) {
  static async findLose() {
    return this.find({ removed: false, endTime: { $lte: new Date() } })
  }

  static async findRemoved() {
    return this.find({ removed: true, inUser: true })
  }

  static async getNew() {
    return this.find({ removed: false, inUser: false, endTime: { $gte: new Date() } })
  }

  static async appendRole(
    userId: string,
    roleId: string,
    time: string | Date | number,
    moderId?: string,
    reson?: string
  ) {
    const find = await this.findOne({ removed: false, userId, roleId })
      || new this({ userId, roleId, info: { moderId, reson } })

    const { endTime } = find

    await find.append(time, moderId, reson)

    const mode = find.appends.length == 1 ? 'appendRole' : 'updateRole'

    tempModelEvents.emit(mode, userId, roleId, +find.endTime,
      +find.endTime - +endTime, moderId, reson)

    return find
  }

  static async removeRole(
    userId: string,
    roleId: string,
    moderId?: string,
    reson?: string
  ) {
    const find = await this.findOne({ removed: false, userId, roleId })
    if (!find) return
    return find.deleteRole(false, moderId, reson)
  }
}