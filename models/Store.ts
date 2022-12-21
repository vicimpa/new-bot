import { Base, field, makeModel, schema } from "~/lib/mongoose";

@schema()
class Store extends Base {
  @field(String)
  _id: String;

  @field({ type: Array, default: [] })
  roles: string[];

  @field({ type: String, default: '' })
  name: string;

  @field({ type: Date, default: Date.now })
  created: Date;
}

export class StoreModel extends makeModel(Store) {
  static async delRole(_id: string, roleId: string) {
    let find = await this.findOne({ _id });
    if (!find) return;
    find.roles = find.roles.filter(e => e != roleId);
    await find.save();
  }

  static async clear(_id: string) {
    let find = await this.findOne({ _id });
    if (find) await find.delete();
  }

  static async stored(_id: string, name: string, roles: string[]) {
    let find = await this.findOne({ _id });

    if (!find)
      find = new this({ _id, roles, name });

    await find.save();
  }

  static async delRoles(_id: string) {
    let role = await this.find({ _id });

    if (!role.length) return;

    for (let r of role)
      await r.delete();
  }
}