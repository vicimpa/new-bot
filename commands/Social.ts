import { CommandContext, CommandOptionType, ConvertedOption, SlashCommand, SlashCreator } from "slash-create";
import { guildId } from "~/config";
import { Logger } from "~/lib/logger";
import { permission } from "~/lib/permissions";

const {
  INTEGER: Int,
  STRING: Str,
  SUB_COMMAND: Sub
} = CommandOptionType;

class Social extends SlashCommand {
  filePath = __filename;
  guildID = guildId;

  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'asoc',
      description: 'Социалочка',
      options: [
        {
          type: Sub,
          name: 'say',
          description: 'Сказать что-то',
          options: [
            {
              type: Str,
              name: 'message',
              description: 'Сообщение',
              required: true
            }
          ]
        }
      ]
    });
  }

  @permission('social.say')
  async say(ctx: CommandContext, opt: ConvertedOption) {
    const { message = '0-0' } = opt as any;

    Logger.log(`Author message: ${ctx.member.displayName}`);

    if (message.length < 1 || message.length > 1500)
      return {
        ephemeral: true,
        content: `Длина сообщения должна быть от 1 до 1500`
      };

    return {
      content: message
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

// export = Social