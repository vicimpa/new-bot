import { Invite, VoiceChannel } from "discord.js";
import { CommandContext, CommandOptionType, ConvertedOption, SlashCommand, SlashCreator } from "slash-create";
import { guildId } from "~/config";
import { client } from "~/lib/control";
import { Logger } from "~/lib/logger";
import { permission } from "~/lib/permissions";

const {
  STRING: Str,
  SUB_COMMAND: Sub
} = CommandOptionType;

class Games extends SlashCommand {
  filePath = __filename;
  guildID = guildId;

  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'start',
      description: 'Запустить',

      options: [
        {
          type: Sub,
          name: 'app',
          description: 'Запустить приложение',
          options: [
            {
              type: Str,
              name: 'appid',
              required: true,
              description: 'Выберите приложение',
              choices: [
                { name: "YouTube Together", value: "755600276941176913" },
                { name: "Betrayal.io", value: "773336526917861400" },
                { name: "Poker Night", value: "755827207812677713" },
                { name: "Fishington.io", value: "814288819477020702" }
              ]
            }
          ]
        }
      ]
    });
  }

  // APP ===
  @permission('start.app')
  async app(ctx: CommandContext, opt: ConvertedOption) {
    const { appid: appId = '' } = opt as any;
    const userId = ctx.member.id;

    const voice = client.guild.channels.cache
      .find(e => e instanceof VoiceChannel && !!e.members.find(e => e.id == userId));

    if (!voice) return {
      ephemeral: true,
      content: 'Для работы приложения, Вы должны находится в голосовом канале!'
    };

    const invite = new Invite(client,
      await client['api']['channels'](voice.id)
        .invites.post({
          data: {
            target_type: 2,
            target_application_id: appId
          },
        }));

    return {
      ephemeral: true,
      content: `Для запуска нажмите [сюда](${invite}).`
    };
  }

  async run(ctx: CommandContext) {
    const { options } = ctx;

    try {
      for (let key in options)
        if (typeof this[key] == 'function')
          if (this[key].name == 'value')
            return await this[key](ctx, options[key]);

      throw new Error('No method!');
    } catch (e) {
      Logger.error(e);
      return {
        ephemeral: true,
        content: `Ошибка выполнения команды! Обратитесь за помощью к <@&805944675243917369>!`
      };
    }
  }
}

export = Games;