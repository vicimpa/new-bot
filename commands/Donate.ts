import { guildId, sponsors, qiwiPrivate } from "~/config"
import {
  SlashCommand,
  CommandOptionType,
  SlashCreator,
  CommandContext,
  ConvertedOption
} from "slash-create"
import { permission } from "~/lib/permissions"
import { Logger } from "~/lib/logger"
import { TempRoles } from "~/services/temps"
import { MyDate } from "~/lib/mydate"
import { QiwiPaymentsAPI } from "@vicimpa/qiwi-sdk";
import { PaymentModel } from "~/models/Payment";
import { timeparser } from "../lib/timeparser"

const {
  INTEGER: Int,
  STRING: Str,
  USER: User,
  SUB_COMMAND: Sub
} = CommandOptionType

const api = new TempRoles()
const qiwi = new QiwiPaymentsAPI(qiwiPrivate)

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
          description: 'Узнать статус донатной роли',
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
          name: 'message',
          description: 'Отправить донатное сообщение',
          options: [
            {
              type: Int,
              name: 'sum',
              description: 'Сумма, которую хотите пожертвовать',
              required: true
            },
            {
              type: Str,
              name: 'message',
              description: 'Сообщение, которое хотите отправить.',
              required: true
            }
          ]
        },
        {
          type: Sub,
          name: 'role',
          description: 'Получить роль спонсора',
          options: [
            {
              type: Str,
              name: 'role',
              required: true,
              description: 'Роль для получения.',
              choices: sponsors.map(({ id, name, price }) => {
                return { name: `${name} (от ${price}руб)`, value: id }
              })
            },
            {
              type: Int,
              name: 'sum',
              description: 'Сумма пожертвования. Должна быть не ниже выбранной роли.'
            }
          ]
        }
      ]
    })
  }

  @permission('donate.status')
  async status(ctx: CommandContext, opt: ConvertedOption) {
    const { user = ctx.member.id } = opt as any

    const donate = await api.getDonate(user)
    const target = user == ctx.member.id ? 'Вас' : `<@${user}>`
    const pays = await PaymentModel.find({userId: user, isPay: true})
    const roles = pays.filter(e => e.type == 'role')
    const messages = pays.filter(e => e.type == 'message')

    const foot = (
      `Количество оплат роли: **${roles.length}**\n` + 
      `Отправленных донатных сообщений: **${messages.length}**\n` +
      `Сумма всех донатов: **${pays.reduce((acc, v) => acc + v.amount, 0)} руб**`
    )
          
    if (donate) {
      const d = new MyDate(donate.endTime)
      return { 
        ephemeral: true,
        content:
          `У ${target} роль <@&${donate.roleId}>\n` +
          `Роль действует до: \`${d.format('DD.MM.YYYY hh:mm:ss')}\`\n` +
          foot
      }
    } else {
      return {
        ephemeral: true,
        content:
          `У ${target} нет роли спонсора 😢\n` + 
          foot
      }
    }
  }

  @permission('donate.role')
  async role(ctx: CommandContext, opt: ConvertedOption) {
    const { role = '', sum } = opt as any
    const findRole = sponsors.find(e => e.id == role)

    const donate = await api.getDonate(ctx.member.id)

    if (donate && donate.roleId != role) {
      const f = sponsors.find(e => e.id == donate.roleId)
      const d = new MyDate(donate.endTime)
      return {
        ephemeral: true,
        content:
          `Вы не можете купить роль **<@&${findRole.id}>**, так как у Вас уже куплена **<@&${f.id}>**! ` +
          `Дождитесь окончания действия роли \`${d.format()}\` или продлите текущую.`
      }
    }

    let amount = sum || 0


    if (typeof sum != 'number')
      amount = findRole.price

    if (amount < findRole.price)
      return {
        ephemeral: true,
        content:
          `Выбранная сумма не может быть меньше ${findRole.price} руб.`
      }
    
    const expirationDateTime = new Date(Date.now() + timeparser('5h'))

    const pay = new PaymentModel({ amount, type: 'role', data: role, userId: ctx.member.id })
    const bill = await qiwi.createBill(pay._id, {
      amount, currency: 'RUB', expirationDateTime
    })

    await pay.save()

    return {
      ephemeral: true,
      content: `[Ссылка](${bill.payUrl}) на оплату роли <@&${role}>`
    }
  }

  @permission('donate.message')
  async message(ctx: CommandContext, opt: ConvertedOption) {
    const { message = '', sum = 0 } = opt as any
    const donate = await api.getDonate(ctx.member.id)
    const min = donate ? 10 : 50
    const amount = 0 || sum

    if (sum < min)
      return {
        ephemeral: true,
        content:
          `Минимальная стоимость сообщения для Вас составляет ${min} 😢`
      }

    if(message.length < 3 || message.length > 1000)
      return {
        ephemeral: true,
        content:
          `Длина сообщения не может быть меньше 3 и больше 1000 символов`
      }

    const expirationDateTime = new Date(Date.now() + timeparser('5h'))

    const pay = new PaymentModel({ amount, type: 'message', data: message, userId: ctx.member.id })
    const bill = await qiwi.createBill(pay._id, {
      amount, currency: 'RUB', expirationDateTime
    })

    await pay.save()

    return {
      ephemeral: true,
      content: `[Ссылка](${bill.payUrl}) на оплату сообщения.`
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

export = Donate