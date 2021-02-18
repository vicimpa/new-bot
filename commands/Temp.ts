import { guildId } from "~/config"
import {
  SlashCommand,
  CommandOptionType,
  CommandContext,
  SlashCreator
} from "slash-create";

import { permission } from "~/lib/permissions";
import { ApiSender } from "~/services/sender";
import { Logger } from "~/lib/logger";
import { TempRoles } from "~/services/temps";

const api = new TempRoles()

const {
  INTEGER: Int,
  STRING: Str,
  USER: User,
  ROLE: Role,
  SUB_COMMAND: Sub
} = CommandOptionType

class Temp extends SlashCommand {
  filePath = __filename
  guildID = guildId

  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'temp',
      description: 'Временная роль',
      options: [
        {
          type: User,
          name: 'user',
          description: 'Пользователь',
          required: true
        },
        {
          type: Role,
          name: 'role',
          description: 'Роль',
          required: true
        },
        {
          type: Str,
          name: 'time',
          description: 'Время',
          required: true
        }
      ]
    })
  }

  @permission('test')
  async run(ctx: CommandContext) {
    const { options } = ctx

    const {user = '', role = '', time = ''} = options as any

    try {
      api.append(user, role, time)
        .catch(e => Logger.error(e))
    }catch(e) {
      Logger.error(e)
    }
    
    return {
      ephemeral: true,
      content: 'Выполнено.'
    }
  }
}

export = Temp