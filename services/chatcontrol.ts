#!/usr/bin/env ts-node

import { Guild, Message, TextChannel } from "discord.js";
import { onlyMedia } from "~/config";
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

  client.on('messageReactionAdd', async (r, u) => {
    if(u.bot || !await testPermission(u.id, 'humor.delete'))
      return

    if(deleted.indexOf(r.message.id) != -1)
      return

    deleted.push(r.message.id)
    r.message.delete()
      .then(e => {
        let index = deleted.indexOf(r.message.id)
        if(index != -1) deleted.splice(index, 1)
      })
      .catch(e => Logger.error(e))
  })

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