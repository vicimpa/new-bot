import { CommandContext, CommandOptionType, ConvertedOption, SlashCommand, SlashCreator } from "slash-create";
import { guildId } from "~/config";
import { Logger } from "~/lib/logger";
import { permission, testPermission } from "~/lib/permissions";
import { remaining } from "~/lib/remaining";
import { ReportModel } from "~/models/Report";
import { RolesApi } from "~/services/roles";
import { ApiSender } from "~/services/sender";

const sender = new ApiSender();

const {
  Status
} = RolesApi;

const {
  INTEGER: Int,
  STRING: Str,
  USER: User,
  ROLE: Role,
  SUB_COMMAND: Sub
} = CommandOptionType;

class Report extends SlashCommand {
  filePath = __filename;
  guildID = guildId;

  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'report',
      description: 'Пожаловаться на пользователя',

      options: [
        {
          type: User,
          name: 'user',
          description: 'Пользователь, для репорта',
          required: true
        },
        {
          type: Str,
          name: 'message',
          required: true,
          description: 'Краткое сообщение'
        }
      ]
    });
  }

  @permission('report.base')
  async report(ctx: CommandContext, opt: ConvertedOption) {
    const { user: userId, message } = opt as {
      user: string,
      message: string;
    };

    if (await testPermission(userId, 'report.moder')) return {
      ephemeral: true,
      content: `Увы. Вы не можете отправить жалобу на этого пользователя, так как он является модератором.`
    };

    if (userId == ctx.member.id) return {
      ephemeral: true,
      content: `Какой смысл кидать репорт на себя?`
    };

    if (await testPermission(ctx.member.id, 'report.moder')) return {
      ephemeral: true,
      content: `Уважаемый модер, данная команда для пользователей!`
    };

    const old = await ReportModel.checkReport(ctx.member.id, userId)
      .catch(e => Logger.error(e));

    if (old) return {
      ephemeral: true,
      content: `Вы уже отправили репорт на этого пользователя. Дождитесь рассмотрения.`
    };

    const hold = await ReportModel.getHoldtime(ctx.member.id)
      .catch(e => Logger.error(e));

    if (hold > new Date()) return {
      ephemeral: true,
      content: `Вы можете отправить следующий репорт только через ${remaining(+hold - +new Date())}.`
    };

    if (message.length < 3) return {
      ephemeral: true,
      content: `В Вашем репорте слишком которкое сообщение. Попробуйте еще раз.`
    };

    const report = await ReportModel.appendReport(ctx.member.id, userId, message);

    sender.report(report._id, ctx.member.id, userId, message)
      .catch(e => Logger.error(e));

    return {
      ephemeral: true,
      content: `Ваша жалоба успешно принята.`
    };
  }

  async run(ctx: CommandContext) {
    const { options } = ctx;

    return this.report(ctx, options)
      .catch(e => {
        Logger.error(e);
        return {
          ephemeral: true,
          content: `Ошибка выполнения команды! Обратитесь за помощью к <@&805944675243917369>!`
        };
      });
  }
}

export = Report;