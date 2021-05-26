#!/usr/bin/env ts-node

import { client } from "~/lib/control";
import { GuildMember } from "discord.js";
import { StoreModel } from "~/models/Store";
import { main } from "~/lib/main";
import { Logger } from "~/lib/logger";
import { RolesApi } from "./roles";

const roles = new RolesApi()
 
export async function restore(member: GuildMember) {
  const guild = client.guild
  const roles = await guild.roles.fetch()
  const store = await StoreModel.findOne({_id: member.id})

  if(!store) return

  const me = guild.member(client.user)
    .roles.cache.array().sort((a, b) => {
      return b.position - a.position
    })[0]
    
  if(store.name)
   await member.setNickname(store.name)

  await member.roles.set(store.roles.map((roleId) => {
    return roles.cache.get(roleId)
  }).filter(e => !!e).filter(e => {
    return me.position > e.position
  }))
}

main(__filename, () => {
  client.on('guildMemberAdd', (e) => {
    restore(e)
      .then(() => roles.checkUser(e.id))
      .then(() => StoreModel.clear(e.id))
      .catch(e => Logger.error(e))
  })
  
  client.on('guildMemberRemove', (e) => {
    StoreModel.stored(e.id, e.nickname, e.roles.cache.map(e => e.id))
      .catch(e => Logger.error(e))
  })
})