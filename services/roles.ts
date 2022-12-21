#!/usr/bin/env ts-node
import { GuildMember, TextChannel } from "discord.js";
import { rolesChannel } from "~/config";
import { client } from "~/lib/commands";
import { Logger } from "~/lib/logger";
import { main } from "~/lib/main";
import { makeApi, method, register } from "~/lib/rpcapi";
import { ProroleModel } from "~/models/Prorole";
import { RoleModel } from "~/models/Role";
import rolesStore from "~/roles.json";

enum Status {
  OK,
  NO_METHOD,
  ROLE_EXISTS,
  UNKNOW_ERROR
}

const checkedRoles: string[] = [];
const cheksRole: string[] = [];
const proRoles: string[][] = [];

for (let key in rolesStore) {
  for (let role of rolesStore[key].roles) {
    for (let k in role.ids) {
      if (k != 'check')
        checkedRoles.push(role.ids[k]);
      else
        cheksRole.push(role.ids[k]);

      if (k == 'pro')
        proRoles.push([role.ids[k], role.emoji]);
    }
  }
}

function getStoreRole(name: string) {
  for (let key in rolesStore) {
    for (let role of rolesStore[key].roles) {
      if (role.emoji == name)
        return role;
    }
  }

  return null;
}

@register()
export class RolesApi {
  @method()
  async canCheck(roles: string[], roleId: string) {
    for (const key in rolesStore) {
      const find = rolesStore[key].roles
        .find(e => e.ids.pro == roleId);

      if (!find || roles.indexOf(find.ids.check) == -1)
        continue;

      return true;
    }

    return false;
  }

  @method()
  async getEmoji(roleId: string) {
    for (let key in rolesStore) {
      const find = rolesStore[key]
        .roles.find(e => e.ids.pro == roleId);

      if (find) return find.emoji;
    }

    return '';
  }

  @method()
  async execute(type: 'append' | 'remove', userId: string, roleId: string) {
    const emoji = await this.getEmoji(roleId);
    const guild = client.guild;

    try {
      const user = await ProroleModel.getUser(userId);

      if (type == 'append') {
        if (user.check(emoji))
          return Status.ROLE_EXISTS;

        await user.addRole(emoji);
      } else
        if (type == 'remove') {
          if (!user.check(emoji))
            return Status.ROLE_EXISTS;

          await user.delRole(emoji);
        } else {
          return Status.NO_METHOD;
        }
      const member = await guild.members.fetch(userId);
      this.checkUser(member.id)
        .catch(e => null);
      return Status.OK;
    } catch (e) {
      return Status.UNKNOW_ERROR;
    }
  }

  @method()
  async checkUser(user: string) {
    await checkUser(user);
  }

  static Status = Status;
}

async function checkUser(user: GuildMember | string) {
  const guild = client.guild;
  const userId = (user instanceof GuildMember) ? user.id : user;
  const member = guild.members.cache.get(userId) || await guild.members.fetch(userId)
    .catch(e => null as GuildMember);

  if (!member) return null;
  const needRoles = await RoleModel.getRolesById(userId);
  const proRoles = await ProroleModel.getRolesById(userId);
  const currentNeed = needRoles
    .map(e => getStoreRole(e))
    // .filter(e => !member.roles.cache.get(e.ids.check))
    .map(e => e.ids[proRoles.indexOf(e.emoji) == -1 ? 'def' : 'pro']);

  for (let role of checkedRoles) {
    const inUser = !!member.roles.cache.get(role);

    if (inUser && currentNeed.indexOf(role) == -1) {
      console.log(`Delete ${role} => ${user}`);
      member.roles.remove(role)
        .catch(e => { });
    }

    if (!inUser && currentNeed.indexOf(role) != -1) {
      console.log(`Append ${role} => ${user}`);
      member.roles.add(role)
        .catch(e => { });
    }
  }
}

async function loadReactions() {
  Logger.log('Start load reactions');
  const guild = client.guild;
  const channel = guild.channels.cache.get(rolesChannel) as TextChannel;
  const updateUsers: string[] = [];

  for (let msg of (await channel.messages.fetch()).array()) {
    for (let react of msg.reactions.cache.array()) {
      let count = 0, last: string = undefined;

      while (count < react.count) {
        const users = (await react.users.fetch({ limit: 50, after: last })).array();
        for (let user of users) {
          RoleModel.setRole(user.id, react.emoji.name)
            .catch(e => Logger.error(e));

          if (updateUsers.indexOf(user.id) == -1)
            updateUsers.push(user.id);

          last = user.id;
          count++;
        }
        Logger.log(`Loaded reactions for ${react.emoji.name} count ${users.length}`);
      }
    }
  }

  Logger.log('Load reactions end');

  Logger.log('Update users start');

  Promise.resolve()
    .then(async () => {
      for (let userId of updateUsers)
        await checkUser(userId)
          .catch(e => Logger.error(e));
    })
    .then(e => Logger.log('Update users end'));
}

main(__filename, async () => {
  makeApi(RolesApi);
  client.on('ready', async () => {
    Promise.resolve()
      .then(loadReactions)
      .then(e => {

        client.on('messageReactionAdd', (e, c) => {
          if (e.message.channel.id != rolesChannel)
            return;

          if (!getStoreRole(e.emoji.name))
            return;

          Promise.resolve()
            .then(() => RoleModel.setRole(c.id, e.emoji.name))
            .then(e => checkUser(c.id))
            .catch(e => Logger.error(e));
        });

        client.on('messageReactionRemove', (e, c) => {
          if (e.message.channel.id != rolesChannel)
            return;

          if (!getStoreRole(e.emoji.name))
            return;

          Promise.resolve()
            .then(() => RoleModel.unsetRole(c.id, e.emoji.name))
            .then(e => checkUser(c.id))
            .catch(e => Logger.error(e));
        });
      });
  });
});
