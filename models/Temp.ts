import { Base, field, makeModel, method, pre, schema } from "~/lib/mongoose";
import { Events } from "~/lib/rpcapi";
import { timeparser } from "~/lib/timeparser";

import { sponsors } from "../config";

export const tempModelEvents = new (class TemproleEvents extends Events<{
  appendRole(
    userId: string,
    roleId: string,
    timeEnd: number,
    deltaTime: number,
    moderId: string,
    reason: string
  ): void;

  updateRole(
    userId: string,
    roleId: string,
    timeEnd: number,
    deltaTime: number,
    moderId: string,
    reason: string
  ): void;

  deleteRole(
    userId: string,
    roleId: string,
    timeEnd: number,
    deltaTime: number,
    moderId: string,
    reason: string
  ): void;
}>{ });

@schema()
class Temp extends Base {
  @field({ type: Boolean, default: false })
  removed: boolean;

  @field({ type: String, required: true })
  roleId: string;

  @field({ type: String, required: true })
  userId: string;

  @field({ type: Date, default: Date.now })
  created: Date;

  @field({ type: Date, default: Date.now })
  endTime: Date;

  @field({ type: Boolean, default: false })
  inUser: boolean;

  @field({ type: Date })
  updateTime: Date;

  @field({ type: Object, default: {} })
  info: {
    moderId?: string;
    reason?: string;
  };

  @field({ type: [Date], default: [] })
  appends: Date[];

  @method()
  append(time: string | Date | number, moderId?: string, reason?: string) {
    let { endTime } = this;

    this.appends.push(new Date());

    if (typeof time == 'string')
      time = timeparser(time, endTime);

    if (time instanceof Date)
      endTime = time;
    else
      endTime = new Date(+time);

    this.endTime = endTime;
    return this.save();
  }

  @method()
  async deleteRole(deletedUser = false, moderId?: string, reason?: string) {
    this.removed = true;

    if (deletedUser)
      this.inUser = false;

    const { userId, roleId } = this;
    tempModelEvents.emit('deleteRole', userId, roleId, +this.endTime, 0, moderId, reason);
    return this.save();
  }

  @pre('save')
  private _preSave() {
    this.updateTime = new Date();
  }
}

export class TempModel extends makeModel(Temp) {
  static async findLose() {
    return this.find({ removed: false, endTime: { $lte: new Date() } });
  }

  static async findRemoved() {
    return this.find({ removed: true, inUser: true });
  }

  static async getNew() {
    return this.find({ removed: false, inUser: false, endTime: { $gte: new Date() } });
  }

  static async appendRole(
    userId: string,
    roleId: string,
    time: string | Date | number,
    moderId?: string,
    reason?: string
  ) {
    const find = await this.findOne({ removed: false, userId, roleId })
      || new this({ userId, roleId, info: { moderId, reason } });

    const { endTime } = find;

    await find.append(time, moderId, reason);

    const mode = find.appends.length == 1 ? 'appendRole' : 'updateRole';

    tempModelEvents.emit(mode, userId, roleId, +find.endTime,
      +find.endTime - +endTime, moderId, reason);

    return find;
  }

  static async checkDonate(userId: string) {
    return this.findOne({ userId, roleId: { $in: sponsors.map(e => e.id) }, endTime: { $gte: new Date() } });
  }

  static async removeRole(
    userId: string,
    roleId: string,
    moderId?: string,
    reason?: string
  ) {
    const find = await this.findOne({ removed: false, userId, roleId });
    if (!find) return;
    return find.deleteRole(false, moderId, reason);
  }
}