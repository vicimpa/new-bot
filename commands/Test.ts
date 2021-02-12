import { guildId } from "~/config"
import {
  SlashCommand,
  CommandOptionType,
  CommandContext,
  ConvertedOption,
  SlashCreator
} from "slash-create";

import { permission } from "~/lib/permissions";
import { ApiSender } from "~/services/sender";

const api = new ApiSender()

const {
  INTEGER: Int,
  STRING: Str,
  USER: User,
  SUB_COMMAND: Sub
} = CommandOptionType

class Test extends SlashCommand {
  filePath = __filename
  guildID = guildId

  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'test',
      description: 'Проверка'
    })
  }

  @permission('test')
  async run(ctx: CommandContext) {
    const { options } = ctx
    try {
      await api.testSend('658403244749488177')
        .then(console.log)
        .catch(console.log)

    }catch(e) {
      console.log(e)
    }
    
    return {
      ephemeral: true,
      content: 'Выполнено.'
    }
  }
}

export = Test