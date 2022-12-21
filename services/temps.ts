#!/usr/bin/env ts-node
import { GuildMember, Role } from "discord.js";
import { client } from "~/lib/control";
import { delay } from "~/lib/delay";
import { Logger } from "~/lib/logger";
import { main } from "~/lib/main";
import { makeApi, method, register } from "~/lib/rpcapi";
import { PaymentModel } from "~/models/Payment";
import { StoreModel } from "~/models/Store";
import { TempModel } from "~/models/Temp";

import { ApiSender } from "./sender";

const sender = new ApiSender();

@register()
export class TempRoles {
  @method()
  async append(userId: string, roleId: string, time: string, moderId?: string, reason?: string) {
    await TempModel.appendRole(userId, roleId, time, moderId, reason);
  }

  @method()
  async delete(userId: string, roleId: string, moderId?: string, reason?: string) {
    await TempModel.removeRole(userId, roleId, moderId, reason);
  }

  @method()
  async getDonate(userId: string) {
    const f = await TempModel.checkDonate(userId);
    if (!f) return null;
    const { roleId, endTime } = f;
    return { roleId, endTime: +endTime };
  }
}

async function tick() {
  const guild = client.guild;

  const removed = await TempModel.findRemoved();


  for (let role of removed) {
    const member = await guild.members.fetch(role.userId)
      .catch(e => null as GuildMember);
    const guildRole = await guild.roles.fetch(role.roleId)
      .catch(e => null as Role);

    if (!member || !guildRole) {
      await role.deleteRole(true)
        .catch(e => null);

      continue;
    }

    await member.roles.remove(guildRole)
      .then(e => role.inUser = false)
      .then(e => role.save())
      .catch(e => null);
  }

  const newRoles = await TempModel.getNew();

  for (let role of newRoles) {
    const member = await guild.members.fetch(role.userId)
      .catch(e => null as GuildMember);
    const guildRole = await guild.roles.fetch(role.roleId)
      .catch(e => null as Role);

    if (!member || !guildRole) {
      await role.deleteRole(true)
        .catch(e => null);

      continue;
    }

    await member.roles.add(guildRole)
      .then(e => role.inUser = true)
      .then(e => role.save())
      .catch(e => null);
  }

  const loseRoles = await TempModel.findLose();

  for (let role of loseRoles) {
    const member = await guild.members.fetch(role.userId)
      .catch(e => null as GuildMember);
    const guildRole = await guild.roles.fetch(role.roleId)
      .catch(e => null as Role);

    if (!member || !guildRole) {
      await role.deleteRole(true)
        .catch(e => null)
        .then(e => StoreModel.delRole(role.userId, role.roleId))
        .catch(e => null);

      continue;
    }

    await member.roles.remove(guildRole)
      .then(e => role.deleteRole(true))
      .catch(e => null)
      .then(e => StoreModel.delRole(role.userId, role.roleId))
      .catch(e => null);
  }

  await delay(1000);
  await tick();
}

async function donate() {
  const pays = await PaymentModel.find({ isPay: true, isApply: false, type: 'role' });

  for (let p of pays) {
    const { userId, data, amount } = p;
    TempModel.appendRole(userId, data, '30D')
      .then(() => sender.message(userId, `!Пожертвовал на роль <@&${data}>`, amount))
      .then(() => p.isApply = true)
      .then(() => p.save())
      .catch(e => Logger.error(e));
  }

  await delay(1000);
  await donate();
}

async function donate2() {
  const pays = await PaymentModel.find({ isPay: true, isApply: false, type: 'message' });

  for (let p of pays) {
    const { userId, data, amount } = p;
    sender.message(userId, data, amount)
      .then(e => (p.isApply = true) && p)
      .then(e => e.save())
      .catch(e => Logger.error(e));
  }

  await delay(1000);
  await donate2();
}


main(__filename, () => {
  makeApi(TempRoles);

  client.on('ready', () => {
    tick().catch(e => Logger.error(e));
    donate().catch(e => Logger.error(e));
    donate2().catch(e => Logger.error(e));
  });
});
