#!/usr/bin/env ts-node

import { client } from "~/lib/control";
import { main } from "~/lib/main";
import { logToRoom, makeLogs } from "~/lib/makelog";
import { MessageOptions } from "discord.js";
import { makeApi, method, register } from "~/lib/rpcapi";
import { Logger } from "~/lib/logger";
import { tempModelEvents } from "~/models/Temp";
import { mutes, sponsors } from "~/config";
import { remaining } from "~/lib/remaining";
import { MyDate } from "~/lib/mydate";

const fmt = 'DD.MM.YY hh:mm:ss (по МСК)'

@register()
export class ApiSender {
  @logToRoom(['fines'])
  async ban(set = true, moderId: string, userId: string, reson: string) {
    
  }

  @method()
  @logToRoom(['donations'])
  async message(userId: string, message: string, amount: number) {
    return {
      content: `**[donate]** <@${userId}> ${amount.toFixed(2)}руб`,
      embed: {
        description: `<@${userId}> оставил сообщение: \`\`\`${message}\`\`\``
      }
    } as MessageOptions
  }

  @logToRoom(['donations'])
  async donate(
    mode: 'add' | 'update' | 'delete',
    userId: string, 
    roleId: string,
    deltaTime: number,
    timeEnd: number
  ) {

    let description = ``
    let big = deltaTime > 0

    const def = () => {
      description += `\nРоль будет снята: \`${MyDate.format(timeEnd, fmt)}\``
    }

    switch (mode) {
      case 'add': {
        description += `Пользователь <@${userId}> получил <@&${roleId}>`
        def()
      }; break

      case 'update': {
        description += `У пользователя <@${userId}> ${big ? 'увеличен' : 'уменьшен'} <@&${roleId}>`
        def()
      }; break

      case 'delete': {
        description += `Закончился срок <@&${roleId}> у пользователя <@${userId}>`
      }; break
    }

    return {
      content: `**[donate]** <@${userId}>`,
      embed: {
        description
      }
    } as MessageOptions
  }

  @logToRoom(['fines'])
  async muteChange(
    mode: 'add' | 'update' | 'delete',
    userId: string,
    roleId: string,
    timeEnd: number,
    deltaTime: number,
    moderId: string,
    reason: string
  ) {

    let description = ``
    let big = deltaTime > 0

    const def = () => {
      description += `\n на срок: \`${remaining(Math.abs(deltaTime))}\``
      description += ` до: \`${MyDate.format(timeEnd, fmt)}\``
    }

    switch (mode) {
      case 'add': {
        if (moderId) description += `<@${moderId}> выдал <@&${roleId}> пользователю <@${userId}>`
        else description += `Пользователь <@${userId}> получил <@&${roleId}>`
        def()
      }; break

      case 'update': {
        if (moderId) description += `<@${moderId}> ${big ? 'увеличил' : 'уменьшил'} <@&${roleId}> пользователю <@${userId}>`
        else description += `У пользователя <@${userId}> ${big ? 'увеличен' : 'уменьшен'} <@&${roleId}>`
        def()
      }; break

      case 'delete': {
        if (!moderId) description += `Закончился срок <@&${roleId}> у пользователя <@${userId}>`
        else description += `<@${moderId}> снял <@&${roleId}> пользователю <@${userId}>`
      }; break
    }

    if (reason) description += `\n\n Причина: \`\`\`${reason}\`\`\``

    return {
      content: `**[mute]** <@${userId}>`,
      embed: {
        description
      }
    } as MessageOptions
  }

  @method()
  @logToRoom('admin')
  async clearReport(chatId: string, userId: string, count: number, user?: string) {
    return {
      content: `**[clearMessage]**`,
      embed: {
        color: '#ff0000',
        description: `По запросу <@${userId}> в чате <#${chatId}> было удалено ${count} сообщений${user ? ` от пользователя <@${user}>` : ''}.`
      }
    } as MessageOptions
  }

  @method()
  @logToRoom('report')
  async report(reportId: string, userId: string, reportedId: string, message: string) {
    return {
      content: `**[report:${reportId}]** @here`,
      embed: {
        color: '#ff0000',
        description: `Пользователь <@${userId}> оправил на <@${reportedId}> жалобу с текстом: \`\`\`${message}\`\`\``
      }
    } as MessageOptions
  }

  @method()
  @logToRoom('roles')
  async proRole(checkerId: string, userId: string, roleId: string, type = false) {
    const action = type ? 'выдал' : 'забрал'
    return {
      embed: {
        color: '#ff0000',
        description: `Проверяющий <@${checkerId}> ${action} роль <@&${roleId}> пользователю <@${userId}>.`
      }
    } as MessageOptions
  }

  @method()
  @logToRoom('admin')
  async testSend(userId: string) {
    return {
      embed: {
        color: '#ff0000',
        description: `Потльзователь <@${userId}> вызвал тестовую команду.`
      }
    } as MessageOptions
  }

  @method()
  @logToRoom('voice')
  async privateMuteSend(userId: string, set = false, limitId: string = null) {
    let action = set ? 'замьютил' : 'размьютил'
    let target = limitId ? `пользователя <@${limitId}>` : 'всех пользователей'
    return {
      embed: {
        color: '#ff0000',
        description: `Пользователь <@${userId}> **${action}** ${target} у себя в канале.`
      }
    } as MessageOptions
  }

  @method()
  @logToRoom('voice')
  async privateBlockeSend(userId: string, set = false, limitId: string = null) {
    let action = set ? 'заблокировал' : 'разблокировал'
    let target = limitId ? `пользователя <@${limitId}>` : 'всех пользователей'
    return {
      embed: {
        color: '#ff0000',
        description: `Пользователь <@${userId}> **${action}** ${target} у себя в канале.`
      }
    } as MessageOptions
  }
}

main(__filename, () => {
  const sender = new ApiSender()

  const tempRoleEvent = (mode: 'add' | 'update' | 'delete') => {
    return ((userId: string,
      roleId: string,
      timeEnd: number,
      deltaTime: number,
      moderId: string,
      reason: string
    ) => {
      if (Object.values(mutes).includes(roleId))
        return sender.muteChange(
          mode, userId, roleId, timeEnd,
          deltaTime, moderId, reason
        ).catch(e => Logger.error(e))

      if(sponsors.find(e => e.id == roleId))
          return sender.donate( mode, userId, roleId, deltaTime, timeEnd)

    }) as Parameters<(typeof tempModelEvents)['on']>[1]
  }

  tempModelEvents.on('appendRole', tempRoleEvent('add'))
  tempModelEvents.on('updateRole', tempRoleEvent('update'))
  tempModelEvents.on('deleteRole', tempRoleEvent('delete'))

  makeApi(ApiSender)
  makeLogs(new ApiSender(), client)
})