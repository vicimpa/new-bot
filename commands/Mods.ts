import { guildId } from "~/config"
import {
  SlashCommand,
  CommandOptionType,
  CommandContext,
  ConvertedOption,
  SlashCreator
} from "slash-create";
import { permission, testPermission } from "~/lib/permissions";

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
      name: 'voice',
      description: 'Управление голосовым каналом',

      options: [
        {
          type: Sub,
          name: 'block',
          description: 'Заблокировать пользователя в своем канале',
          options: [
            {
              type: User,
              name: 'user',
              required: true,
              description: 'Пользователь для блокировки'
            }
          ]
        }
      ]
    })
  }

  // @permission('voice.block')
  async block(ctx: CommandContext, opt: ConvertedOption) {
    // const { user = '' } = opt as any
    // if (ctx.member.id == user || await testPermission(user, 'voice.no.block'))
    //   return {
    //     ephemeral: true,
    //     content: `Вы не можете применить эту команду к данному пользоватею!`
    //   }

    // const status = await api.set(ctx.member.id, user, Action.ADD, Action.NO)

    // switch (status) {
    //   case Status.OK: return {
    //     ephemeral: true,
    //     content: `Запрет на подключение пользователя <@${user}> успешно добавлен.`
    //   }

    //   case Status.USER_EXISTS: return {
    //     ephemeral: true,
    //     content: `Пользователю <@${user}> **уже запрещено** подключаться к каналу.`
    //   }

    //   default:
    //     throw new Error(Status[status])
    // }
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
      console.error(e)
      return {
        ephemeral: true,
        content: `Ошибка выполнения команды! Обратитесь за помощью к <@&805944675243917369>!`
      }
    }
  }
}

// export = Mods