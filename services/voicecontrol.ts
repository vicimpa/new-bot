#!/usr/bin/env ts-node

import { GuildMember, VoiceChannel } from "discord.js";
import { guildId } from "~/config";
import { client } from "~/lib/control";
import { main } from "~/lib/main";

async function checkVoice(voice: VoiceChannel) {
  if (!voice) return
  for(let [id, member] of voice.members)
    checkMember(voice, member)
}

async function checkMember(voice: VoiceChannel, member: GuildMember) {
  if (!voice) return
  if (member.roles.cache.find(e => e.name == 'Moderator')) return
  const isConnect = voice.permissionsFor(member).has('CONNECT')
  const isSpeak = voice.permissionsFor(member).has('SPEAK')

  if (!isConnect && voice.members.has(member.id))
    member.voice.setChannel(null).catch(() => {})

  if (isSpeak && voice.members.has(member.id) && member.voice.serverMute)
    if (member.voice.channel)
      member.voice.setMute(false).catch(() => {})

  if (!isSpeak && voice.members.has(member.id) && !member.voice.serverMute)
    if (member.voice.channel)
      member.voice.setMute(true).catch(() => {})
}

main(__filename, () => {
  client.on('ready', () => {
    client.guilds.fetch(guildId)
      .then(e => e.channels.cache.array())
      .then(e => e.filter(e => e instanceof VoiceChannel))
      .then(e => e.map(checkVoice))
      .then(e => Promise.all(e))
      .catch(console.error)
  })

  client.on('voiceStateUpdate', (_, { channel, member }) => {
    checkMember(channel, member)
      .catch(console.error)
  })

  client.on('guildMemberUpdate', (_, post) => {
    if (!post.voice.channel) return
    checkMember(post.voice.channel, post)
      .catch(console.error)
  })

  client.on('channelUpdate', (_, post) => {
    if (!(post instanceof VoiceChannel)) return
    checkVoice(post)
      .catch(console.error)
  })
})