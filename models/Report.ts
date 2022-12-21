import { Base, field, makeModel, method, pre, schema } from "~/lib/mongoose";
import { MyDate } from "~/lib/mydate";

enum Status {
  PENDING,
  ACCEPT,
  CLOSE
}

@schema()
class Report extends Base {
  @field({ type: Status, default: Status.PENDING })
  status: Status;

  @field({ type: String, required: true })
  userId: string;

  @field({ type: String, required: true })
  reportedId: string;

  @field(String)
  moderator?: string;

  @field({ type: String, required: true })
  message: String;

  @field({ type: Date, default: Date.now })
  created: Date;

  @field(Date)
  updated: Date;

  @method()
  async changeStatus(status: Status, moderator?: string) {
    if (moderator)
      this.moderator = moderator;

    this.status = status;
    return this.save();
  }

  @pre('save')
  private _presave() {
    this.updated = new Date();
  }
}

export class ReportModel extends makeModel(Report) {
  static async isPending(_id: string) {
    return !!await this.findOne({ _id, status: Status.PENDING });
  }

  static async checkReport(userId: string, reportedId: string) {
    return !!await this.findOne({ userId, reportedId, status: Status.PENDING });
  }

  static async appendReport(userId: string, reportedId: string, message: string) {
    return (new this({ userId, reportedId, message })).save();
  }

  static async getHoldtime(userId: string) {
    const prev = new MyDate();
    prev.h -= 24;
    const find = await this.find({ userId, status: Status.CLOSE, created: { $gt: prev } });
    if (!find.length) return new Date();
    const hold = new MyDate(find[0].created);
    for (let v of find) { hold.m += 30; }
    return new Date(hold);
  }

  static async closeReport(_id: string, moderator?: string) {
    const find = await this.findOne({ _id, status: Status.PENDING });
    if (!find) return;
    return find.changeStatus(Status.CLOSE, moderator);
  }

  static async acceptReport(_id: string, moderator?: string) {
    const find = await this.findOne({ _id, status: Status.PENDING });
    if (!find) return;
    return find.changeStatus(Status.ACCEPT, moderator);
  }

  static Status = Status;
}