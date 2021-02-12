import { guildId } from "~/config"
import { 
  SlashCommand, 
  CommandOptionType, 
  SlashCreator, 
  CommandContext, 
  ConvertedOption
} from "slash-create"
import { permission } from "~/lib/permissions"

const {
  INTEGER: Int,
  STRING: Str,
  USER: User,
  SUB_COMMAND: Sub
} = CommandOptionType

class Donate extends SlashCommand {
  filePath = __filename
  guildID = guildId

  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'donate',
      description: 'Управление донатом',
      options: [
        {
          type: Sub,
          name: 'status',
          description: 'Узнать статус доната',
          options: [
            {
              type: User,
              name: 'user',
              description: 'Пользователь, чей статус хотите узнать'
            }
          ]
        },
        {
          type: Sub,
          name: 'list',
          description: 'Узнать список тех, кто донатил',
          options: [
            {
              type: Int,
              name: 'page',
              description: 'Страница списка'
            }
          ]
        },
        {
          type: Sub,
          name: 'append',
          description: 'Добавить донат пользователю',
          options: [
            {
              type: User,
              name: 'user',
              description: 'Пользовалеть, которому выдается донат',
              required: true
            },
            {
              type: Int,
              name: 'type',
              description: 'Тип доната',
              choices: [
                {
                  value: 0,
                  name: 'Sponsor'
                },
                {
                  value: 1,
                  name: 'Sponsor +'
                },
                {
                  value: 2,
                  name: 'Sponsor XL'
                }
              ],
              required: true
            },
            {
              type: Str,
              name: 'time',
              required: true,
              description: 'Время, на которое нужно выдать донат'
            }
          ]
        }
      ]
    })
  }
  
  @permission('donate.status')
  async status(ctx: CommandContext, opt: ConvertedOption) {
    return {
      ephemeral: true,
      content: `Статус: скоро ...`
    }
  }  
  
  @permission('donate.list')
  async list(ctx: CommandContext, opt: ConvertedOption) {
    return {
      ephemeral: true,
      content: `Список: скоро ...`
    }
  }
  
  @permission('donate.append')
  async append(ctx: CommandContext, opt: ConvertedOption) {
    return {
      ephemeral: true,
      content: `Добавление: скоро ...`
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
      console.error(e)
      return {
        ephemeral: true,
        content: `Ошибка выполнения команды! Обратитесь за помощью к <@&805944675243917369>!`
      }
    }
  }
}

export = Donate