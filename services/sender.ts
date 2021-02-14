import { client } from "~/lib/control";
import { main } from "~/lib/main";
import { logToRoom, makeLogs } from "~/lib/makelog";
import { MessageOptions } from "discord.js";
import { makeApi, method, register } from "~/lib/rpcapi";
import { Logger } from "~/lib/logger";

@register()
export class ApiSender {
  async muteSend(moderId: string, userId: string, reson: string, time?: Date) {

  }

  async donateSend(userId: string, roleId: string, time?: Date) {
    Logger.log(userId, roleId, time)
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
  makeApi(ApiSender)
  makeLogs(new ApiSender(), client)
})