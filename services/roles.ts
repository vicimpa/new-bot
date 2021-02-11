#!/usr/bin/env ts-node

import { GuildMember, Role, TextChannel, User } from "discord.js";
import { guildId, rolesChannel } from "~/config";
import { client } from "~/lib/control";
import { main } from "~/lib/main";
import { osRoles, specificRoles, languageRoles } from "~/roles.json";

const rolesStore = [...osRoles.roles, ...specificRoles.roles, ...languageRoles.roles] as {
  name: string,
  color: string,
  emoji: string,
  baseRole?: Role,
  proRole?: Role,
  checkRole?: Role
}[]

async function chechUser(user: GuildMember, react: string, check = true) {
  if (!user) return
  if (user.user.bot) return

  const havePro = false
  const storedRole = rolesStore.find(e => e.emoji == react)
  const { proRole, baseRole } = storedRole
  const role = (havePro && proRole) ? proRole : baseRole
  const alterRole = (havePro && proRole) ? baseRole : proRole || baseRole

  if (!role && !alterRole) return null

  if (!user.roles.cache.has(role.id) && check)
    user.roles.add(role).catch(console.error)

  if (alterRole && alterRole.id !== role.id && user.roles.cache.has(alterRole.id))
    user.roles.remove(alterRole).catch(console.error)

  if (user.roles.cache.has(role.id) && !check)
    user.roles.remove(role).catch(console.error)
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

  console.log('Check complate')
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

  client.on('ready', () => {
    Promise.resolve()
      .then(loadRoles)
      .catch(console.error)
      .then(check)
      .catch(console.error)
  })

  client.on('messageReactionAdd', (e, u) => {
    if (e.message.channel.id != rolesChannel)
      return null

    if (!rolesStore.find(v => v.emoji == e.emoji.name))
      return null

    chechUser(guild.member(u as User), e.emoji.name, true)
      .catch(console.error)
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
      .catch(console.error)
  })
})