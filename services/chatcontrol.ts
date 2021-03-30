#!/usr/bin/env ts-node

import { Guild, TextChannel } from "discord.js";
import { guildId } from "~/config";
import { client } from "~/lib/control";
import { main } from "~/lib/main";
import { Logger } from "~/lib/logger";
import { register, method, makeApi } from "~/lib/rpcapi";
import { ApiSender } from "./sender";

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

main(__filename, () => {
  makeApi(ChatControl)
})