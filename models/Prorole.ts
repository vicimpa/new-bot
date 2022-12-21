import { Base, field, makeModel, method, pre, schema } from "~/lib/mongoose";

@schema()
class Prorole extends Base {
  @field(String)
  _id: string;

  @field({ type: Array, default: [] })
  roles: string[];

  @field({ type: Date, default: Date.now })
  created: Date;

  @method()
  check(role: string) {
    return this.roles.indexOf(role) != -1;
  }

  @method()
  async addRole(role: string) {
    if (this.roles.indexOf(role) == -1)
      this.roles.push(role);

    return this.save();
  }

  @method()
  async delRole(role: string) {
    let index = this.roles.indexOf(role);

    if (index != -1)
      this.roles.splice(index, 1);

    return this.save();
  }

  @pre('save')
  private _presave() {
    this.roles = this.roles.filter(
      (e, i, d) => d.indexOf(e) == i);
  }
}

export class ProroleModel extends makeModel(Prorole) {
  static async addRole(_id: string, role: string) {
    return this.getUser(_id)
      .then(e => e.addRole(role));
  }

  static async check(_id: string, role: string) {
    return this.getUser(_id)
      .then(e => e.check(role));
  }

  static async delRole(_id: string, role: string) {
    return this.getUser(_id)
      .then(e => e.delRole(role));
  }

  static async getUser(_id: string) {
    return await this.findOne({ _id }) || new this({ _id });
  }

  static async getRolesById(_id: string) {
    return this.getUser(_id)
      .then(e => [...e.roles]);
  }
}