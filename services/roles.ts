#!/usr/bin/env ts-node

import { GuildMember, Role, TextChannel, User } from "discord.js";
import { guildId, rolesChannel } from "~/config";
import { client } from "~/lib/commands";
import { main } from "~/lib/main";
import { ProroleModel } from "~/models/Prorole";
import { register, method, makeApi } from "~/lib/rpcapi";
import { osRoles, specificRoles, languageRoles } from "~/roles.json";
import { Logger } from "~/lib/logger";


const rolesStore = [
  ...osRoles.roles,
  ...specificRoles.roles,
  ...languageRoles.roles
] as {
  name: string,
  color: string,
  emoji: string,
  baseRole?: Role,
  proRole?: Role,
  checkRole?: Role
}[]

enum Status {
  OK,
  NO_METHOD,
  ROLE_EXISTS,
  UNKNOW_ERROR
}

@register()
export class RolesApi {
  @method()
  async canCheck(roles: string[], role: string) {
    const can = rolesStore.filter(e => e.checkRole && roles.indexOf(e.checkRole.id) != -1)
    return !!can.find(e => e.emoji == role)
  }

  @method()
  async getEmoji(roleId: string) {
    const role = rolesStore.find(e => e.proRole && e.proRole.id == roleId)
    if (!role) return null
    return role.emoji
  }

  @method()
  async execute(type: 'append' | 'remove', userId: string, roleId: string) {
    const emoji = await this.getEmoji(roleId)

    try {
      const user = await ProroleModel.getUser(userId)

      if (type == 'append') {
        if (user.check(emoji))
          return Status.ROLE_EXISTS

        await user.addRole(emoji)
      } else
        if (type == 'remove') {
          if (!user.check(emoji))
            return Status.ROLE_EXISTS

          await user.delRole(emoji)
        } else {
          return Status.NO_METHOD
        }

      await this.checkUpdate(userId, emoji)
        .catch(e => { })
      return Status.OK
    } catch (e) {
      return Status.UNKNOW_ERROR
    }
  }

  @method()
  async checkUpdate(userId: string, role: string) {
    const guild = await client.guilds.fetch(guildId)
    const channel = await guild.channels.cache.get(rolesChannel)

    if (!(channel instanceof TextChannel))
      return

    const messages = await channel.messages.fetch()
    for (let [, mess] of messages) {
      for (let [, react] of mess.reactions.cache) {
        if (react.emoji.name == role) {
          const users = await react.users.fetch()
          const user = users.find(e => e.id == userId)
          const member = await guild.members.fetch(userId)
          chechUser(member, role, !!user)
            .catch(() => { })
          return
        }
      }
    }
  }

  static Status = Status
}

async function chechUser(user: GuildMember, react: string, check = true) {
  if (!user) return
  if (user.user.bot) return

  const havePro = await ProroleModel.check(user.id, react)
  const storedRole = rolesStore.find(e => e.emoji == react)
  const { proRole, baseRole } = storedRole
  const role = (havePro && proRole) ? proRole : baseRole
  const alterRole = (havePro && proRole) ? baseRole : proRole || baseRole

  if (!role && !alterRole) return null

  if (!user.roles.cache.has(role.id) && check)
    user.roles.add(role).catch(e => Logger.error(e))

  if (alterRole && alterRole.id !== role.id && user.roles.cache.has(alterRole.id))
    user.roles.remove(alterRole).catch(e => Logger.error(e))

  if (user.roles.cache.has(role.id) && !check)
    user.roles.remove(role).catch(e => Logger.error(e))
}

async function check() {
  const guild = await client.guilds.fetch(guildId)
  const channel = await client.channels.fetch(rolesChannel)

  if (!(channel instanceof TextChannel))
    return null

  const messages = await channel.messages.fetch()
  const cache: { [key: string]: string[] } = {}

  for (let [, mess] of messages) {
    for (let [, react] of mess.reactions.cache) {
      react.users.fetch()
        .then(async users => {
          for (let [userId, u] of users) {
            cache[userId] = cache[userId] || []

            if (cache[userId].indexOf(react.emoji.name) == -1)
              cache[userId].push(react.emoji.name)

            chechUser(await guild.members.fetch(u.id).catch(async () => {
              return null
            }), react.emoji.name, true)
              .catch(() => { })
          }
        })
    }
  }

  Logger.log('Check complate')
}

async function loadRoles() {
  const guild = await client.guilds.fetch(guildId)
  const roles = await (await guild.roles.fetch()).cache

  for (let store of rolesStore) {
    store.baseRole = roles.find(e => e.name == `${store.name}`)
    store.proRole = roles.find(e => e.name == `${store.name}✓`)
    store.checkRole = roles.find(e => e.name == `Проверяющий ${store.name}✓`)
  }
}

main(__filename, async () => {
  const guild = await client.guilds.fetch(guildId)
  makeApi(RolesApi)

  client.on('ready', () => {
    Promise.resolve()
      .then(loadRoles)
      .catch(e => Logger.error(e))
      .then(check)
      .catch(e => Logger.error(e))
  })

  client.on('messageReactionAdd', (e, u) => {
    if (e.message.channel.id != rolesChannel)
      return null

    if (!rolesStore.find(v => v.emoji == e.emoji.name))
      return null

    chechUser(guild.member(u as User), e.emoji.name, true)
      .catch(e => Logger.error(e))
  })

  client.on('messageReactionRemove', (e, u) => {
    if (e.message.channel.id != rolesChannel)
      return null

    if (!rolesStore.find(v => v.emoji == e.emoji.name))
      return null

    Promise.resolve()
      .then(() => chechUser(
        guild.member(u as User),
        e.emoji.name, false
      ))
      .catch(e => Logger.error(e))
  })
})
