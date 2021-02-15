import { guildId } from "~/config"
import {
  SlashCommand,
  CommandOptionType,
  CommandContext,
  ConvertedOption,
  SlashCreator
} from "slash-create";
import {
  permission,
  testPermission
} from "~/lib/permissions";
import { RolesApi } from "~/services/roles";
import { ApiSender } from "~/services/sender";
import { Logger } from "~/lib/logger";

const api = new RolesApi()
const sender = new ApiSender()

const {
  Status
} = RolesApi

const {
  INTEGER: Int,
  STRING: Str,
  USER: User,
  ROLE: Role,
  SUB_COMMAND: Sub
} = CommandOptionType

class Prorole extends SlashCommand {
  filePath = __filename
  guildID = guildId

  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'pro',
      description: 'Управление PRO ролями',

      options: [
        {
          type: Str,
          name: 'type',
          description: 'Добавить или удалить',
          required: true,
          choices: [
            { name: 'Добавить', value: 'append' },
            { name: 'Удалить', value: 'remove' }
          ]
        },
        {
          type: User,
          name: 'user',
          required: true,
          description: 'Пользователь'
        },
        {
          type: Role,
          name: 'role',
          required: true,
          description: 'Роль'
        }
      ]
    })
  }

  @permission('prorole.base')
  async pro(ctx: CommandContext, opt: ConvertedOption) {
    const { type, user: userId, role: roleId } = opt as {
      type: 'append' | 'remove',
      user: string,
      role: string
    }

    const role = await api.getEmoji(roleId)

    if(!role) return {
      ephemeral: true,
      content: `Вы не можете выдать эту роль!`
    }

    const can = await api.canCheck(ctx.member.roles, role)
    const can2 = await testPermission(ctx.member.id, 'prorole.all')

    Logger.log(can, can2)

    if(!can && !can2) return {
      ephemeral: true,
      content: `Вы не можете выдавать про роли или Вы не являетесь проверяющим на эту роль! Обратитесь за помощью к проверяющим.`
    }

    const status = await api.execute(type, userId, roleId)
    const typeName = type == 'append' ? 'добавлена' : 'удалена'

    switch(status) {
      case Status.OK: {
        sender.proRole(ctx.member.id, userId, roleId, type == 'append')
          .catch(e => Logger.error(e))
          
        return {
          ephemeral: true,
          content: `Роль <@&${roleId}> пользователю <@${userId}> успешно ${typeName}!`
        }
      }

      case Status.ROLE_EXISTS:
        return {
          ephemeral: true,
          content: `Роль <@&${roleId}> у пользователя <@${userId}> уже ${typeName}!`
        }

      case Status.NO_METHOD:
        throw new Error('No method')

      default:
        throw new Error('Unknow error')
    }
  }

  async run(ctx: CommandContext) {
    const { options } = ctx

    return this.pro(ctx, options)
      .catch(e => {
        Logger.error(e)
        return {
          ephemeral: true,
          content: `Ошибка выполнения команды! Обратитесь за помощью к <@&805944675243917369>!`
        }
      })
  }
}

export = Prorole