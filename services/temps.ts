#!/usr/bin/env ts-node

import { StoreModel } from "~/models/Store";
import { TempModel } from "~/models/Temp";
import { client } from "~/lib/control";
import { delay } from "~/lib/delay";
import { guildId } from "~/config";
import { main } from "~/lib/main";
import { makeApi, register, method } from "~/lib/rpcapi";
import { Logger } from "~/lib/logger";
import { GuildMember, Role } from "discord.js";

@register()
export class TempRoles {
  @method()
  async append(userId: string, roleId: string, time: string, moderId?: string, reason?: string) {
    await TempModel.appendRole(userId, roleId, time, moderId, reason)
  }

  @method()
  async delete(userId: string, roleId: string, moderId?: string, reason?: string) {
    await TempModel.removeRole(userId, roleId, moderId, reason)
  }
}

async function tick() {
  const guild = await client.guilds.fetch(guildId)

  const removed = await TempModel.findRemoved()


  for (let role of removed) {
    const member = await guild.members.fetch(role.userId)
      .catch(e => null as GuildMember)
    const guildRole = await guild.roles.fetch(role.roleId)
      .catch(e => null as Role)

    if (!member || !guildRole) {
      await role.deleteRole(true)
        .catch(e => null)

      continue
    }

    await member.roles.remove(guildRole)
      .then(e => role.inUser = false)
      .then(e => role.save())
      .catch(e => null)
  }

  const newRoles = await TempModel.getNew()

  for (let role of newRoles) {
    const member = await guild.members.fetch(role.userId)
      .catch(e => null as GuildMember)
    const guildRole = await guild.roles.fetch(role.roleId)
      .catch(e => null as Role)

    if (!member || !guildRole) {
      await role.deleteRole(true)
        .catch(e => null)

      continue
    }

    await member.roles.add(guildRole)
      .then(e => role.inUser = true)
      .then(e => role.save())
      .catch(e => null)
  }

  const loseRoles = await TempModel.findLose()

  for (let role of loseRoles) {
    const member = await guild.members.fetch(role.userId)
      .catch(e => null as GuildMember)
    const guildRole = await guild.roles.fetch(role.roleId)
      .catch(e => null as Role)

    if (!member || !guildRole) {
      await role.deleteRole(true)
        .catch(e => null)
        .then(e => StoreModel.delRole(role.userId, role.roleId))
        .catch(e => null)

      continue
    }

    await member.roles.remove(guildRole)
      .then(e => role.deleteRole(true))
      .catch(e => null)
      .then(e => StoreModel.delRole(role.userId, role.roleId))
      .catch(e => null)
  }

  await delay(1000)
  await tick()
}

main(__filename, () => {
  makeApi(TempRoles)

  client.on('ready', () => {
    tick().catch(e => Logger.error(e))
  })
})
