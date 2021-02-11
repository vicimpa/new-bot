#!/usr/bin/env ts-node

import { StoreModel } from "~/models/Store";
import { TempModel } from "~/models/Temp";
import { client } from "~/lib/control";
import { delay } from "~/lib/delay";
import { guildId } from "~/config";
import { main } from "~/lib/main";

export class TempRoles {
  async appendRole(userId: string, roleId: string, time?: string) {
    const guild = await client.guilds.fetch(guildId)
    const role = await guild.roles.fetch(roleId)
    const member = await guild.members.fetch(userId)

    await TempModel.appendRole(userId, roleId, time)
    await member.roles.add(role)
      .catch(console.error)
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
        .catch(console.error)
    }

    await StoreModel.delRole(role.userId, role.roleId)
      .catch(console.error)
    await role.remove()
      .catch(console.error)
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