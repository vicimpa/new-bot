import { Base, field, method, pre, schema, makeModel } from "~/lib/mongoose";
import { osRoles, specificRoles, languageRoles } from "~/roles.json";

@schema()
class Roles extends Base {
  @field({ type: String, required: true })
  _id: string

  @field({ type: Object, default() { return {} } })
  roles: { [key: string]: Date }

  @field({ type: Object, default() { return {} } })
  checks: { [key: string]: Date }

  // @field(String)
  // rolesString: string

  // @field(String)
  // checksString: string

  @method()
  hasRole(key: string, check = false) {
    return !!this.mutable(check)[key]
  }

  // @method()
  // mutable(check = false) {
  //   if (check) {
  //     try {
  //       this.checks = JSON.parse(this.checksString)
  //       for(let key in this.checks)
  //         this.checks[key] = new Date(this.checks[key])
  //     }catch(e) {
  //       this.checks = {}
  //     }
      
  //     return this.checks
  //   }

  //   try {
  //     this.roles = JSON.parse(this.rolesString)
  //     for(let key in this.roles)
  //       this.roles[key] = new Date(this.roles[key])

  //   }catch(e) {
  //     this.roles = {}
  //   }

  //   return this.roles
  // }

  @method()
  mutable(check = false) {
    if (check) {
      if(!this.checks) this.checks = {}
      Object.entries(this.checks).map(e => this.checks[e[0]] = new Date(e[1]))
      return this.checks = {...this.checks}
    }

    if(!this.roles) this.roles = {}
    Object.entries(this.roles).map(e => this.roles[e[0]] = new Date(e[1]))
    return this.roles = {...this.roles}
  }

  @method()
  toggleRole(key: string, check = false) {
    const mute = this.mutable(check)

    if (mute[key]) delete mute[key]
    else mute[key] = new Date()

    return this.save()
  }

  @method()
  setRole(key: string, check = false) {
    const mute = this.mutable(check)

    if (!mute[key]) {
      mute[key] = new Date()
      return this.save()
    }

    return this
  }

  @method()
  unsetRole(key: string, check = false) {
    const mute = this.mutable(check)

    if (mute[key]) {
      delete mute[key]
      return this.save()
    }

    return this
  }

  @pre('save')
  private _presave() {
    this.roles = JSON.parse(JSON.stringify(this.roles))
    this.checks = JSON.parse(JSON.stringify(this.checks))
  }
}

export class RolesModel extends makeModel(Roles) {
  static async getById(_id: string) {
    return (await this.findOne({ _id })) || new this({ _id })
  }
  static async toggleRole(_id: string, key: string, check = false) {
    const find = await this.getById(_id)
    return find.toggleRole(key, check)
  }

  static async setRole(_id: string, key: string, check = false) {
    const find = await this.getById(_id)
    return find.setRole(key, check)
  }

  static async unsetRole(_id: string, key: string, check = false) {
    const find = await this.getById(_id)
    return find.unsetRole(key, check)
  }

  static async hasRole(_id: string, key: string, check = false) {
    const find = await this.getById(_id)
    return find.hasRole(key, check)
  }
}