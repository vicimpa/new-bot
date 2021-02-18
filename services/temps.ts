#!/usr/bin/env ts-node

import { StoreModel } from "~/models/Store";
import { TempModel } from "~/models/Temp";
import { client } from "~/lib/control";
import { delay } from "~/lib/delay";
import { guildId } from "~/config";
import { main } from "~/lib/main";
import { makeApi, register, method, Events } from "~/lib/rpcapi";
import { Logger } from "~/lib/logger";
import { GuildMember, Role } from "discord.js";

interface ITempEvents {
  tempChange(type: 'append' | 'remove', userId: string, roleId: string): void
}

@register()
export class TempRoles extends Events<ITempEvents> {
  @method()
  async append(userId: string, roleId: string, time: string) {
    await TempModel.appendRole(userId, roleId, time)
  }
}


const api = new TempRoles()

async function tick() {
  const guild = await client.guilds.fetch(guildId)
  const newRoles = await TempModel.getNew()

  for(let role of newRoles) {
    const member = await guild.members.fetch(role.userId)
      .catch(e => null as GuildMember )
    const guildRole = await guild.roles.fetch(role.roleId)
      .catch(e => null as Role)

    if(!member || !guildRole) {
      await role.remove()
        .catch(e => null)

      continue
    }

    await member.roles.add(guildRole)
      .then(e => role.inUser = true)
      .then(e => role.save())
      .catch(e => null)
      .then(e => api.emit('tempChange', 'append', role.userId, role.roleId))
  }

  const loseRoles = await TempModel.findLose()

  for(let role of loseRoles) {
    const member = await guild.members.fetch(role.userId)
      .catch(e => null as GuildMember )
    const guildRole = await guild.roles.fetch(role.roleId)
      .catch(e => null as Role)

    if(!member || !guildRole) {
      await role.remove()
        .catch(e => null)
        .then(e => StoreModel.delRole(role.userId, role.roleId))
        .catch(e => null)
        .then(e => api.emit('tempChange', 'remove', role.userId, role.roleId))

      continue
    }

    await member.roles.remove(guildRole)
      .then(e => role.remove())
      .catch(e => null)
      .then(e => StoreModel.delRole(role.userId, role.roleId))
      .catch(e => null)
      .then(e => api.emit('tempChange', 'remove', role.userId, role.roleId))
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
