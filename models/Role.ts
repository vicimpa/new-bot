import { Base, field, makeModel, method, pre, schema } from "~/lib/mongoose";

@schema()
class Role extends Base {
  @field({ type: String, required: true })
  _id: string;

  @field({ type: Array, default: [] })
  roles: string[];

  @field({ type: Date })
  updated: Date;

  @method()
  async toggleRole(_id: string, key: string) {
    if (this.hasRole(_id, key))
      return this.unsetRole(_id, key);
    else
      return this.setRole(_id, key);
  }

  @method()
  async setRole(_id: string, key: string) {
    if (!this.hasRole(_id, key)) {
      this.roles.push(key);
      return this.save();
    }
    return this;
  }

  @method()
  async unsetRole(_id: string, key: string) {
    if (this.hasRole(_id, key)) {
      this.roles = this.roles.filter(e => e != key);
      return this.save();
    }
    return this;
  }

  @method()
  hasRole(_id: string, key: string) {
    return this.roles.indexOf(key) != -1;
  }

  @method()
  async getRoles(_id: string) {
    return [...this.roles];
  }

  @pre('save')
  private _presave() {
    this.updated = new Date();
  }
}

export class RoleModel extends makeModel(Role) {
  static async getById(_id: string) {
    return (await this.findOne({ _id })) || new this({ _id });
  }

  static async toggleRole(_id: string, key: string) {
    return (await this.getById(_id))
      .toggleRole(_id, key);
  }

  static async setRole(_id: string, key: string) {
    return (await this.getById(_id))
      .setRole(_id, key);
  }

  static async unsetRole(_id: string, key: string) {
    return (await this.getById(_id))
      .unsetRole(_id, key);
  }

  static async hasRole(_id: string, key: string) {
    return (await this.getById(_id))
      .hasRole(_id, key);
  }

  static async getRolesById(_id: string) {
    return (await this.getById(_id))
      .getRoles(_id);
  }
}