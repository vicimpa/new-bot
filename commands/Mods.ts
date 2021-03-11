import { guildId, mutes } from "~/config"
import {
  SlashCommand,
  CommandOptionType,
  CommandContext,
  ConvertedOption,
  SlashCreator
} from "slash-create";
import { permission, testPermission } from "~/lib/permissions";
import { Logger } from "~/lib/logger";
import { TempRoles } from "~/services/temps";
import { ChatControl } from "~/services/chatcontrol";
import { ApiSender } from "~/services/sender";
import { timeparser } from "~/lib/timeparser";

const {
  INTEGER: Int,
  STRING: Str,
  USER: User,
  SUB_COMMAND: Sub
} = CommandOptionType

const api = new TempRoles()
const sender = new ApiSender()
const chat = new ChatControl()

class Mods extends SlashCommand {
  filePath = __filename
  guildID = guildId

  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'mod',
      description: 'Команды для модерации',

      options: [
        // {
        //   type: Sub,
        //   name: 'ban',
        //   description: 'Забанить перманентно человека',
        //   options: [
        //     {
        //       type: User,
        //       name: 'user',
        //       required: true,
        //       description: 'Пользователь для блокировки'
        //     },
        //     {
        //       type: Str,
        //       name: 'reason',
        //       required: true,
        //       description: 'Причина блокировки'
        //     }
        //   ]
        // },
        // {
        //   type: Sub,
        //   name: 'unban',
        //   description: 'Забанить перманентно человека',
        //   options: [
        //     {
        //       type: User,
        //       name: 'user',
        //       required: true,
        //       description: 'Пользователь для блокировки'
        //     },
        //     {
        //       type: Str,
        //       name: 'reason',
        //       required: true,
        //       description: 'Причина блокировки'
        //     }
        //   ]
        // },
        {
          type: Sub,
          name: 'mutevoice',
          description: 'Выключить микрофон пользователю',
          options: [
            {
              type: User,
              name: 'user',
              required: true,
              description: 'Пользователь для блокировки'
            },
            {
              type: Str,
              name: 'reason',
              required: true,
              description: 'Причина блокировки'
            },
            {
              type: Str,
              name: 'time',
              required: true,
              description: 'Время блокировки'
            }
          ]
        },
        {
          type: Sub,
          name: 'unmutevoice',
          description: 'Включить микрофон пользователю',
          options: [
            {
              type: User,
              name: 'user',
              required: true,
              description: 'Пользователь для разблокировки'
            },
            {
              type: Str,
              name: 'reason',
              description: 'Причина разблокировки'
            }
          ]
        },


        {
          type: Sub,
          name: 'mutechat',
          description: 'Запретить писать сообщения пользователю',
          options: [
            {
              type: User,
              name: 'user',
              required: true,
              description: 'Пользователь для блокировки'
            },
            {
              type: Str,
              name: 'reason',
              required: true,
              description: 'Причина блокировки'
            },
            {
              type: Str,
              name: 'time',
              required: true,
              description: 'Время блокировки'
            }
          ]
        },
        {
          type: Sub,
          name: 'unmutechat',
          description: 'Разрешить писать сообщения пользователю',
          options: [
            {
              type: User,
              name: 'user',
              required: true,
              description: 'Пользователь для разблокировки'
            },
            {
              type: Str,
              name: 'reason',
              description: 'Причина разблокировки'
            }
          ]
        },

        {
          type: Sub,
          name: 'clear',
          description: 'Очистить чат',
          options: [
            {
              type: Int,
              name: 'count',
              required: true,
              description: 'Количество удаляемых сообщений'
            },
            {
              type: User,
              name: 'user',
              description: 'Пользователь, чьи сообщения нужно удалить.'
            }
          ]
        }
      ]
    })
  }

  @permission('mod.ban')
  async ban(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '', reason = ''} = opt as any
    if (ctx.member.id == user || await testPermission(user, 'mod.noban'))
      return {
        ephemeral: true,
        content: `Вы не можете применить эту команду к данному пользоватею!`
      }

    return null
  }

  @permission('mod.unban')
  async unban(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '', reason = ''} = opt as any

    return null
  }

  @permission('mod.mutevoice')
  async mutevoice(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '', reason = '', time = '30m' } = opt as any
    if (ctx.member.id == user || await testPermission(user, 'mod.nomutevoice'))
      return {
        ephemeral: true,
        content: `Вы не можете применить эту команду к данному пользоватею!`
      }

    const minTime = timeparser('30m')
    const nowTime = timeparser(time)

    if(nowTime < minTime)
      return {
        ephemeral: true,
        content: `Время блокировки не может быть меньше 30m!`
      }

    api.append(user, mutes.voice, time, ctx.member.id, reason)
      .catch(e => Logger.error(e))

    return {
      ephemeral: true,
      content: `Выполнено!`
    }
  }

  @permission('mod.unmutevoice')
  async unmutevoice(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '', reason = '' } = opt as any

    api.delete(user, mutes.voice, ctx.member.id, reason)
      .catch(e => Logger.error(e))

    return {
      ephemeral: true,
      content: `Выполнено!`
    }
  }

  @permission('mod.mutechat')
  async mutechat(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '', reason = '', time = '30m' } = opt as any
    if (ctx.member.id == user || await testPermission(user, 'mod.nomutechat'))
      return {
        ephemeral: true,
        content: `Вы не можете применить эту команду к данному пользоватею!`
      }

    const minTime = timeparser('30m')
    const nowTime = timeparser(time)

    if(nowTime < minTime)
      return {
        ephemeral: true,
        content: `Время блокировки не может быть меньше 30m!`
      }

    api.append(user, mutes.chat, time, ctx.member.id, reason)
      .catch(e => Logger.error(e))

    return {
      ephemeral: true,
      content: `Выполнено!`
    }
  }

  @permission('mod.unmutechat')
  async unmutechat(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '', reason = '' } = opt as any

    api.delete(user, mutes.chat, ctx.member.id, reason)
      .catch(e => Logger.error(e))

    return {
      ephemeral: true,
      content: `Выполнено!`
    }
  }

  @permission('mod.clear')
  async clear(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '', count = 0 } = opt as any

    if(count < 1 || count > 200)
      return {
        ephemeral: true,
        content: `Количество сообщений должно быть от 1 до 200!`
      }

    chat.clearMessages(ctx.member.id, ctx.channelID, count, user)
      .catch(e => null)
      
    return {
      ephemeral: true,
      content: `Запрос на выполнение передан!`
    }
  }

  async run(ctx: CommandContext) {
    const { options } = ctx

    try {
      for (let key in options)
        if (typeof this[key] == 'function')
          if (this[key].name == 'value')
            return await this[key](ctx, options[key])

      throw new Error('No method!')
    } catch (e) {
      Logger.error(e)
      return {
        ephemeral: true,
        content: `Ошибка выполнения команды! Обратитесь за помощью к <@&805944675243917369>!`
      }
    }
  }
}

export = Mods