import { Logger } from "~/lib/logger";
import { Base, field, makeModel, method, schema } from "~/lib/mongoose";

@schema()
class Private extends Base {
  @field(String)
  _id: string;

  @field({ type: String, required: true })
  name: string;

  @field({ type: Number, default: 0 })
  limit: number;

  @field({ type: Array, default: [] })
  blocks: string[];

  @field({ type: Array, default: [] })
  mutes: string[];

  @field({ type: Date, default: Date.now })
  created: Date;

  @method()
  updateProps(d: Partial<Private>) {
    for (let key in d)
      this[key] = d[key];
  }
}

export class PrivateModel extends makeModel(Private) {
  static async updatePrivate(_id: string,
    {
      name = '',
      limit = 0,
      blocks = [],
      mutes = []
    }
  ) {
    const find = await this.findOne({ _id }) || new this({ _id });
    find.updateProps({ name, limit, blocks, mutes });
    await find.save().catch(e => Logger.error(e));
  }

  static async get(_id: string) {
    return await this.findOne({ _id });
  }
}