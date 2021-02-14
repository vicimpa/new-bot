#!/usr/bin/env ts-node

import { StoreModel } from "~/models/Store";
import { TempModel } from "~/models/Temp";
import { client } from "~/lib/control";
import { delay } from "~/lib/delay";
import { guildId } from "~/config";
import { main } from "~/lib/main";
import { register } from "~/lib/rpcapi";
import { Logger } from "~/lib/logger";

@register()
export class TempRoles {

  async appendRole(userId: string, roleId: string, time?: string) {
    const guild = await client.guilds.fetch(guildId)
    const role = await guild.roles.fetch(roleId)
    const member = await guild.members.fetch(userId)

    await TempModel.appendRole(userId, roleId, time)
    await member.roles.add(role)
      .catch(e => Logger.error(e))
  }

  async removeRole(userId: string, roleId: string) {
    const guild = await client.guilds.fetch(guildId)
  }
}

async function tick() {
  const guild = await client.guilds.fetch(guildId)
  const closeRoles = await TempModel.findLose()

  for (let role of closeRoles) {
    const member = await guild.members.fetch(role.userId)
    const memberRole = await guild.roles.fetch(role.roleId)

    if (memberRole) {
      await member.roles.remove(memberRole)
        .catch(e => Logger.error(e))
    }

    await StoreModel.delRole(role.userId, role.roleId)
      .catch(e => Logger.error(e))
    await role.remove()
      .catch(e => Logger.error(e))
  }

  await delay(1000)
  await tick()
}

main(__filename, () => {
  // makeRunner(new TempRoles())

  // client.on('ready', () => {
  //   tick().catch(console.error)
  // })
})
