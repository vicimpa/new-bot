import { guildId } from "~/config"
import {
  SlashCommand,
  CommandOptionType,
  CommandContext,
  ConvertedOption,
  SlashCreator
} from "slash-create";
import { permission, testPermission } from "~/lib/permissions";
import { Logger } from "../lib/logger";

const {
  INTEGER: Int,
  STRING: Str,
  USER: User,
  SUB_COMMAND: Sub
} = CommandOptionType

class Mods extends SlashCommand {
  filePath = __filename
  guildID = guildId

  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'mod',
      description: 'Команды для модерации',

      options: [
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
              name: 'reson',
              required: true,
              description: 'Причина блокировки'
            },
            {
              type: Str,
              name: 'time',
              description: 'Время блокировки (30m default)'
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
              name: 'reson',
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
              name: 'reson',
              required: true,
              description: 'Причина блокировки'
            },
            {
              type: Str,
              name: 'time',
              description: 'Время блокировки (30m default)'
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
              name: 'reson',
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

  @permission('mod.mutevoice')
  async mutevoice(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '', reson = '', time = '30m' } = opt as any
    if (ctx.member.id == user || await testPermission(user, 'mod.nomutevoice'))
      return {
        ephemeral: true,
        content: `Вы не можете применить эту команду к данному пользоватею!`
      }

    return {
      ephemeral: true,
      content: `Команда пока не готова!`
    }
  }

  @permission('mod.unmutevoice')
  async unmutevoice(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '', reson = '' } = opt as any


    return {
      ephemeral: true,
      content: `Команда пока не готова!`
    }
  }

  @permission('mod.mutechat')
  async mutechat(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '' } = opt as any
    if (ctx.member.id == user || await testPermission(user, 'mod.nomutechat'))
      return {
        ephemeral: true,
        content: `Вы не можете применить эту команду к данному пользоватею!`
      }

    return {
      ephemeral: true,
      content: `Команда пока не готова!`
    }
  }

  @permission('mod.unmutechat')
  async unmutechat(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '', count = 0 } = opt as any

    return {
      ephemeral: true,
      content: `Команда пока не готова!`
    }
  }

  @permission('mod.clear')
  async clear(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '', reson = '' } = opt as any

    return {
      ephemeral: true,
      content: `Команда пока не готова!`
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