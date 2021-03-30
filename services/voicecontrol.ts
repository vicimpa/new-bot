#!/usr/bin/env ts-node

import { GuildMember, VoiceChannel } from "discord.js";
import { actions, guildId, privates } from "~/config";
import { client } from "~/lib/control";
import { main } from "~/lib/main";
import { Logger } from "~/lib/logger";

async function checkVoice(voice: VoiceChannel) {
  if (!voice) return
  for (let [id, member] of voice.members)
    checkMember(voice, member)
}

async function checkMember(voice: VoiceChannel, member: GuildMember) {
  if (!voice) return
  if (
    privates.indexOf(voice.parentID) == -1 &&
    actions.indexOf(voice.parentID) == -1
  ) return

  const isConnect = voice.permissionsFor(member).has('CONNECT')
  const isSpeak = voice.permissionsFor(member).has('SPEAK')

  if (!isConnect && voice.members.has(member.id))
    member.voice.setChannel(null).catch(() => { })

  if (isSpeak && voice.members.has(member.id) && member.voice.serverMute)
    if (member.voice.channel)
      member.voice.setMute(false).catch(() => { })

  if (!isSpeak && voice.members.has(member.id) && !member.voice.serverMute)
    if (member.voice.channel)
      member.voice.setMute(true).catch(() => { })

  if (!member.voice.channelID) return null

  // if (member.voice.selfDeaf && member.voice.selfMute)
  //   await member.voice.setChannel(null)
  //     .catch(e => Logger.error(e))
}

main(__filename, () => {
  client.on('ready', () => {
    Promise.resolve()
      .then(e => client.guild)
      .then(e => e.channels.cache.array())
      .then(e => e.filter(e => e instanceof VoiceChannel))
      .then(e => e.map(checkVoice))
      .then(e => Promise.all(e))
      .catch(e => Logger.error(e))
  })

  client.on('voiceStateUpdate', (_, { channel, member }) => {
    checkMember(channel, member)
      .catch(e => Logger.error(e))
  })

  client.on('guildMemberUpdate', (_, post) => {
    if (!post.voice.channel) return
    checkMember(post.voice.channel, post)
      .catch(e => Logger.error(e))
  })

  client.on('channelUpdate', (_, post) => {
    if (!(post instanceof VoiceChannel)) return
    checkVoice(post)
      .catch(e => Logger.error(e))
  })
})
