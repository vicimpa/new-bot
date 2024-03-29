import { CommandContext, CommandOptionType, SlashCommand, SlashCreator } from "slash-create";
import { guildId } from "~/config";
import { Logger } from "~/lib/logger";
import { permission } from "~/lib/permissions";
import { TempRoles } from "~/services/temps";

const api = new TempRoles();

const {
  INTEGER: Int,
  STRING: Str,
  USER: User,
  ROLE: Role,
  SUB_COMMAND: Sub
} = CommandOptionType;

class Temp extends SlashCommand {
  filePath = __filename;
  guildID = guildId;

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
    });
  }

  @permission('temps.role')
  async run(ctx: CommandContext) {
    const { options } = ctx;

    const { user = '', role = '', time = '' } = options as any;

    try {
      api.append(user, role, time, ctx.member.id)
        .catch(e => Logger.error(e));
    } catch (e) {
      Logger.error(e);
    }

    return {
      ephemeral: true,
      content: 'Выполнено.'
    };
  }
}

export = Temp;