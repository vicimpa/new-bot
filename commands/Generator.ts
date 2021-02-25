import genName from "@vicimpa/nick-name";
import { guildId } from "~/config";
import { password } from "~/lib/password";
import { rand } from "~/lib/rand";
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
  SUB_COMMAND: Sub
} = CommandOptionType

class Generator extends SlashCommand {
  filePath = __filename
  guildID = guildId

  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'gen',
      description: 'Генератор всякого',

      options: [
        {
          type: Sub,
          name: 'nick',
          description: 'Сгенерировать ник',
          options: [
            {
              type: Int,
              name: 'method',
              description: 'Метод генерации',
              choices: [
                {
                  name: 'Простой',
                  value: 1
                },
                {
                  name: 'Средний',
                  value: 2
                },
                {
                  name: 'Сложный',
                  value: 3
                }
              ]
            },
            {
              type: Int,
              name: 'length',
              description: 'Длина ника (от 3 до 15)'
            }
          ]
        },

        {
          type: Sub,
          name: 'pass',
          description: 'Сгенерировать пароль',
          options: [
            {
              type: Int,
              name: 'length',
              description: 'Длина пароля (от 1 до 32)'
            }
          ]
        },

        {
          type: Sub,
          name: 'rand',
          description: 'Сгенерировать рандомное число',
          options: [
            {
              type: Int,
              name: 'one',
              description: 'Первое число'
            },
            {
              type: Int,
              name: 'two',
              description: 'Второе число'
            }
          ]
        }
      ]
    })
  }

  @permission('generator.nick')
  async nick(ctx: CommandContext, opt: ConvertedOption) {
    const { method = 1, length = undefined } = opt as any

    if (length && (length < 3 || length > 15))
      return {
        ephemeral: true,
        content: `Длина ника должна быть от 3 до 15`
      }

    return {
      ephemeral: true,
      content: `Ваш ник длиной ${length} и сложностью ${method}: \`${genName(method, length)}\``
    }
  }

  @permission('generator.pass')
  async pass(ctx: CommandContext, opt: ConvertedOption) {
    const { length = 8 } = opt as any

    if (length < 1 || length > 32)
      return {
        ephemeral: true,
        content: `Длина пароля должна быть от 1 до 32`
      }

    return {
      ephemeral: true,
      content: `Ваш пароль длиной в ${length} символов: \`${password(length)}\``
    }
  }

  @permission('generator.rand')
  async rand(ctx: CommandContext, opt: ConvertedOption) {
    const {one = Number.MAX_SAFE_INTEGER, two = 0} = opt as any

    if(isNaN(one) || isNaN(two))
      return {
        ephemeral: true,
        content: 'Один из аргументов не число!'
      }

    return {
      ephemeral: true,
      content: `Ваше число в диапазоне (${one} - ${two}): \`${rand(one, two)}\``
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

export = Generator