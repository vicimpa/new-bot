import { guildId } from "~/config";
import { client } from "~/lib/commands";
import { 
  SlashCommand, 
  CommandOptionType, 
  CommandContext, 
  ConvertedOption, 
  SlashCreator
} from "slash-create";
import { permission } from "~/lib/permissions";
import { Logger } from "~/lib/logger";

const {
  INTEGER: Int,
  USER: User,
  SUB_COMMAND: Sub
} = CommandOptionType

class UserCMD extends SlashCommand {
  filePath = __filename
  guildID = guildId

  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'user',
      description: 'Генератор всякого',

      options: [
        {
          type: Sub,
          name: 'avatar',
          description: 'Получить аватар у себя или пользователя',
          options: [
            {
              type: User,
              name: 'user',
              description: 'Пользователь'
            }
          ]
        }
      ]
    })
  }

  @permission('user.avatar')
  async avatar(ctx: CommandContext, opt: ConvertedOption) {
    const { user = ctx.member.id } = opt as any

    return client.users.fetch(user)
      .then(e => e.avatarURL({format: 'jpeg', size: 2048}))
      .then(e => ({
        ephemeral: true,
        content: `Ссылка на аватар: [вот](${e})`,
        attachments: [e]
      }))
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

export = UserCMD