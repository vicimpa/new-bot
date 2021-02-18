import { client } from "~/lib/control";
import { main } from "~/lib/main";
import { logToRoom, makeLogs } from "~/lib/makelog";
import { MessageOptions } from "discord.js";
import { makeApi, method, register } from "~/lib/rpcapi";
import { Logger } from "~/lib/logger";
import { tempModelEvents } from "~/models/Temp";
import { mutes } from "../config";
import { remaining } from "../lib/remaining";

@register()
export class ApiSender {
  async muteSend(moderId: string, userId: string, reson: string, time?: Date) {

  }

  async donateSend(userId: string, roleId: string, time?: Date) {
    Logger.log(userId, roleId, time)
  }

  @logToRoom(['jail'])
  async muteChange(
    mode: 'add' | 'update' | 'delete',
    userId: string,
    roleId: string,
    timeEnd: number,
    deltaTime: number,
    moderId: string,
    reson: string
  ) {

    let description = ``
    let big = deltaTime > 0

    switch(mode) {
      case 'add': {
        if(moderId) {
          description += `Модератор <@${moderId}> выдал <@&${roleId}> пользователю <@${userId}>`
        }else {
          description += `Пользователь <@${userId}> получил <@&${roleId}>`
        }

        if(reson) {
          description += ` по причине \`\`\`${reson}\`\`\``
        }

        description += ` на срок ${remaining(deltaTime)}.`
        description += `\n Mute будет снят примерно в ${new Date(timeEnd)}`
      }; break

      case 'update': {
        if(moderId) {
          description += `Модератор <@${moderId}> ${big? 'увеличил' : 'уменьшил'} mute чата пользователю <@${userId}>`
        }else {
          description += `У пользователя <@${userId}> ${big? 'увеличен' : 'уменьшен'} mute чата`
        }

        if(reson) {
          description += ` по причине \`\`\`${reson}\`\`\``
        }

        description += ` на срок ${remaining(Math.abs(deltaTime))}.`
        description += `\n Mute будет снят примерно в ${new Date(timeEnd)}`
      }; break

      case 'delete': {
        if(!moderId)
          description += `Закончился срок <@&${roleId}> у пользователя <@${userId}>`
        else
          description += `Модератор <@${moderId}> снял <@&${roleId}> пользователю <@${userId}>`

        if(reson) {
          description += ` по причине \`\`\`${reson}\`\`\``
        }
      }; break
    }

    return {
      embed: {
        title: '[mute]',
        description
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
      reson: string
    ) => {
      if(roleId == mutes.chat) 
        return sender.muteChange(
          mode, userId, roleId, timeEnd, 
          deltaTime, moderId, reson
        ).catch(e => Logger.error(e))

    }) as Parameters<(typeof tempModelEvents)['on']>[1]
  }
  
  tempModelEvents.on('appendRole', tempRoleEvent('add'))
  tempModelEvents.on('updateRole', tempRoleEvent('update'))
  tempModelEvents.on('deleteRole', tempRoleEvent('delete'))

  makeApi(ApiSender)
  makeLogs(new ApiSender(), client)
})