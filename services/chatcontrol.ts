#!/usr/bin/env ts-node

import { Guild, Message, TextChannel } from "discord.js";
import { logs, onlyMedia } from "~/config";
import { client } from "~/lib/control";
import { main } from "~/lib/main";
import { Logger } from "~/lib/logger";
import { register, method, makeApi } from "~/lib/rpcapi";
import { ApiSender } from "./sender";
import { testPermission } from "../lib/permissions";

const sender = new ApiSender()

@register()
export class ChatControl {

  @method()
  async clearMessages(moderId: string, chatId: string, count = 0, user?: string) {
    const { guild } = client

    if (!guild) return null

    const channel = await guild.channels.cache.get(chatId) as TextChannel

    if (!(channel instanceof TextChannel)) return null

    let removed = 0
    let last: string = null

    while (count > 0) {
      try {
        let finds = await channel.messages.fetch({
          limit: 100, ...(last ? { before: last } : {})
        })
        for (let [, find] of finds) {
          last = find.id

          if (user && find.author.id != user)
            continue

          if (count <= 0) {
            sender.clearReport(chatId, moderId, removed, user)
              .catch(e => Logger.error(e))
            return removed
          }

          count--
          removed++
          find.delete().catch(e => Logger.error(e))
        }
      } catch (e) {
        sender.clearReport(chatId, moderId, removed, user)
          .catch(e => Logger.error(e))
        return removed
      }
    }

    sender.clearReport(chatId, moderId, removed, user)
      .catch(e => Logger.error(e))
    return removed
  }
}

const reactions = [`👍`, `👎`, `❌`]

async function makeMedia(msg: Message) {
  for (let react of msg.reactions.cache.array()) {
    if (reactions.indexOf(react.emoji.name) == -1)
      await react.remove().catch(e => Logger.error(e))
  }

  for (let reat of reactions) {
    if (!msg.reactions.cache.has(reat))
      await msg.react(reat).catch(e => Logger.error(e))
  }
}

main(__filename, () => {
  makeApi(ChatControl)

  client.on('ready', async () => {
    Logger.log('Scanning start...')
    for (let id of onlyMedia) {
      const channel = await client.channels.fetch(id)
        .catch(e => null) as TextChannel

      if (!channel) continue

      let last: Message, fetch: Message[]
      let start = { limit: 50 }
      let opt = (last: Message) =>
        last ? { before: last.id, ...start } : { ...start }

      while ((fetch = (await channel.messages.fetch(opt(last))).array()).length) {
        Logger.log(last?.id ? 'Start load ' + last?.id : 'Start load', fetch.length, 'count')

        for (let msg of fetch) {
          last = msg

          await makeMedia(msg)
            .catch(e => Logger.error(e))
        }
      }

    }
    Logger.log('Scanning end...')
  })

  const deleted: string[] = []

  client.ws.on('MESSAGE_REACTION_ADD',
    async ({ member: { user }, user_id, message_id, channel_id, emoji }) => {
      if (!emoji) return
      if (user.bot) return
      if (onlyMedia.indexOf(channel_id) == -1) return

      const { name } = emoji

      const channel = (client.channels.cache.get(channel_id) ||
        await client.channels.fetch(channel_id)) as TextChannel

      if (!(channel instanceof TextChannel)) return

      const message = (channel.messages.cache.get(message_id)) ||
        await channel.messages.fetch(message_id) as Message

      if (!(message instanceof Message)) return

      const react = message.reactions.cache.get(name)

      if (name == '❌') {
        if (!await testPermission(user_id, 'humor.remove'))
          return react.users.remove(user_id)
            .catch(e => Logger.error(e))

        if (deleted.indexOf(message_id) != -1)
          return react.users.remove(user_id)
            .catch(e => Logger.error(e))

        deleted.push(message_id)
        message.delete()
          .then(e => {
            let index = deleted.indexOf(message_id)
            if (index != -1) deleted.splice(index, 1)
          })
          .catch(e => Logger.error(e))
      } else {
        const like = message.reactions.cache.get('👍')
        const dislike = message.reactions.cache.get('👎')

        if (name == like.emoji.name && dislike.users.cache.has(user_id))
          await dislike.users.remove(user_id)
            .catch(e => Logger.error(e))

        if (name == dislike.emoji.name && like.users.cache.has(user_id))
          await like.users.remove(user_id)
            .catch(e => Logger.error(e))
      }
    })

  // client.on('message', (msg) => {
  //   const { channel } = msg
  //   if(logs.bad != channel.id) return
    
  //   if(containsMat(msg.content))
  //     msg.react('💔').catch(e => {})
  //   else
  //     msg.react('💚').catch(e => {})
  // })

  client.on('message', (msg) => {
    const { channel } = msg

    if (onlyMedia.indexOf(channel.id) == -1)
      return

    if (msg.attachments.size)
      return makeMedia(msg)
        .catch(e => Logger.error(e))

    if ((msg.content.match(/```/g)?.length || 0) > 1)
      return makeMedia(msg)
        .catch(e => Logger.error(e))

    msg.delete()
      .catch(e => Logger.error(e))
  })
})