/**
 *  /voice block @user
 *  /voice unblock @user
 *  /voice unblockall
 *
 *  /voice mute @user
 *  /voice unmute @user
 *  /voice unmuteall
 *
 *  /voice mutelist @page
 *  /voice blocklist @page
 *
 *  /voice set name @name
 *  /voice set limit @limit 
 */

import { guildId, logs } from "~/config"
import {
  SlashCommand,
  CommandOptionType,
  CommandContext,
  ConvertedOption,
  SlashCreator
} from "slash-create";
import { permission, testPermission } from "~/lib/permissions";
import { VoiceApi } from "~/services/private";
import { ApiSender } from "~/services/sender";
import { Logger } from "~/lib/logger";

const { Status, Action } = VoiceApi
const api = new VoiceApi()
const sender = new ApiSender()

const {
  INTEGER: Int,
  STRING: Str,
  USER: User,
  SUB_COMMAND: Sub
} = CommandOptionType

class Voice extends SlashCommand {
  filePath = __filename
  guildID = guildId

  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'voice',
      description: 'Управление голосовым каналом',

      options: [
        {
          type: Sub,
          name: 'block',
          description: 'Заблокировать пользователя в своем канале',
          options: [
            {
              type: User,
              name: 'user',
              required: true,
              description: 'Пользователь для блокировки'
            }
          ]
        },
        {
          type: Sub,
          name: 'unblock',
          description: 'Разблокировать пользователя в своем канале',
          options: [
            {
              type: User,
              name: 'user',
              required: true,
              description: 'Пользователь для разблокировки'
            }
          ]
        },
        {
          type: Sub,
          name: 'unblockall',
          description: 'Разблокировать всех пользователей в своем канале',
        },
        {
          type: Sub,
          name: 'blocklist',
          description: 'Показать всех, кому запрещено подключаться',
        },


        {
          type: Sub,
          name: 'mute',
          description: 'Запретить говорить пользователю в своем канале',
          options: [
            {
              type: User,
              name: 'user',
              required: true,
              description: 'Пользователь для блокировки'
            }
          ]
        },
        {
          type: Sub,
          name: 'unmute',
          description: 'Разрешить говорить пользователю в своем канале',
          options: [
            {
              type: User,
              name: 'user',
              required: true,
              description: 'Пользователь для разблокировки'
            }
          ]
        },
        {
          type: Sub,
          name: 'unmuteall',
          description: 'Разрешить говорить всем пользователям в своем канале',
        },
        {
          type: Sub,
          name: 'mutelist',
          description: 'Показать всех, кому запрещено говорить',
        },
        {
          type: Sub,
          name: 'name',
          description: 'Посмотерь имя Вашего канала',
          options: [
            {
              type: Str,
              name: 'name',
              description: 'Установить имя Вашему каналу'
            }
          ]
        },
        {
          type: Sub,
          name: 'limit',
          description: 'Посмотреть лимит Вашего канала',
          options: [
            {
              type: Int,
              name: 'limit',
              description: 'Установить лимит Вашему каналу'
            }
          ]
        }

      ]
    })
  }

  // BLOCK ===
  @permission('voice.block')
  async block(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '' } = opt as any
    if (ctx.member.id == user || await testPermission(user, 'voice.notblock'))
      return {
        ephemeral: true,
        content: `Вы не можете применить эту команду к данному пользователю!`
      }

    const status = await api.set(ctx.member.id, user, Action.ADD, Action.NO)


    switch (status) {
      case Status.OK: {
        sender.privateBlockeSend(ctx.member.id, true, user)
          .catch(e => Logger.error(e))

        if(ctx.channelID == logs.voice)
          return

        return {
          ephemeral: true,
          content: `Запрет на подключение пользователя <@${user}> успешно добавлен.`
        }
      }

      case Status.LIMIT: return {
        ephemeral: true,
        content: `Вы превысили лимит блокировок в канале.`
      }

      case Status.USER_EXISTS: return {
        ephemeral: true,
        content: `Пользователю <@${user}> **уже запрещено** подключаться к каналу.`
      }

      default:
        throw new Error(Status[status])
    }
  }

  @permission('voice.blocklist')
  async blocklist(ctx: CommandContext, opt: ConvertedOption) {
    const list = await api.list(ctx.member.id, true, false)
    return {
      ephemeral: true,
      content: `**Список людей с запретом на подключение**:\n${list.map(e => `<@${e}>`).join('\n')}`
    }
  }

  @permission('voice.unblock')
  async unblock(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '' } = opt as any
    const status = await api.set(ctx.member.id, user, Action.REMOVE, Action.NO)

    switch (status) {
      case Status.OK: {
        sender.privateBlockeSend(ctx.member.id, false, user)
          .catch(e => Logger.error(e))        
          
        if(ctx.channelID == logs.voice)
          return
        return {
          ephemeral: true,
          content: `Запрет на подключение пользователя <@${user}> успешно удален.`
        }
      }

      case Status.USER_EXISTS: return {
        ephemeral: true,
        content: `Пользователю <@${user}> **не запрещено** подключаться к каналу.`
      }

      default:
        throw new Error(Status[status])
    }
  }

  @permission('voice.unblockall')
  async unblockall(ctx: CommandContext, opt: ConvertedOption) {
    const status = await api.clear(ctx.member.id, true, false)

    switch (status) {
      case Status.OK: {
        sender.privateBlockeSend(ctx.member.id, false)
          .catch(e => Logger.error(e))

        if(ctx.channelID == logs.voice)
          return
        return {
          ephemeral: true,
          content: `Запрет на подключение всех пользователей успешно удален.`
        }
      }
      
      case Status.USER_EXISTS: return {
        ephemeral: true,
        content: `Ваш список блокировок пуст.`
      }

      default:
        throw new Error(Status[status])
    }
  }
  // BLOCK ===


  // MUTE ===
  @permission('voice.mute')
  async mute(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '' } = opt as any
    if (ctx.member.id == user || await testPermission(user, 'voice.notmute'))
      return {
        ephemeral: true,
        content: `Вы не можете применить эту команду к данному пользователю!`
      }

    const status = await api.set(ctx.member.id, user, Action.NO, Action.ADD)
    
    switch (status) {
      case Status.OK: {
        sender.privateMuteSend(ctx.member.id, true, user)
          .catch(e => Logger.error(e))


        if(ctx.channelID == logs.voice)
          return

        return {
          ephemeral: true,
          content: `Запрет голоса у пользователя <@${user}> успешно добавлен.`
        }
      }

      case Status.LIMIT: return {
        ephemeral: true,
        content: `Вы превысили лимит блокировок в канале.`
      }

      case Status.USER_EXISTS: return {
        ephemeral: true,
        content: `Пользователю <@${user}> уже запрещено говорить в канале.`
      }

      default:
        throw new Error(Status[status])
    }
  }

  @permission('voice.mutelist')
  async mutelist(ctx: CommandContext, opt: ConvertedOption) {
    const list = await api.list(ctx.member.id, false, true)
    return {
      ephemeral: true,
      content: `**Список людей с запретом на голос**:\n${list.map(e => `<@${e}>`).join('\n')}`
    }
  }

  @permission('voice.unmute')
  async unmute(ctx: CommandContext, opt: ConvertedOption) {
    const { user = '' } = opt as any

    const status = await api.set(ctx.member.id, user, Action.NO, Action.REMOVE)

    switch (status) {
      case Status.OK: {
        sender.privateMuteSend(ctx.member.id, false, user)
          .catch(e => Logger.error(e))

        if(ctx.channelID == logs.voice)
          return

        return {
          ephemeral: true,
          content: `Запрет голоса у пользователя <@${user}> успешно удален.`
        }
      }

      case Status.USER_EXISTS: return {
        ephemeral: true,
        content: `Пользователю <@${user}> не запрещено говорить в канале.`
      }

      default:
        throw new Error(Status[status])
    }
    return
  }

  @permission('voice.unmuteall')
  async unmuteall(ctx: CommandContext, opt: ConvertedOption) {
    const status = await api.clear(ctx.member.id, false, true)

    switch (status) {
      case Status.OK: {
        sender.privateMuteSend(ctx.member.id, false)
          .catch(e => Logger.error(e))
        
        if(ctx.channelID == logs.voice)
          return

        return {
          ephemeral: true,
          content: `Запрет голоса у всех пользователей успешно удален.`
        }
      }
      
      case Status.USER_EXISTS: return {
        ephemeral: true,
        content: `Ваш список мутов пуст.`
      }

      default:
        throw new Error(Status[status])
    }
  }
  // MUTE ===

  // SETTINGS ===
  @permission('voice.name')
  async name(ctx: CommandContext, opt: ConvertedOption) {
    const { name = '' } = opt as any
    if (!name) {
      const info = await api.getInfo(ctx.member.id)
      if (!info) throw new Error('No info')
      return {
        ephemeral: true,
        content: `Имя Вашей комнаты \`${info.name}\``
      }
    }
    return this.setName(ctx, name)
  }

  @permission('voice.setname')
  async setName(ctx: CommandContext, name: string) {
    if(name.length < 3 || name.length > 40)
      return {
        ephemeral: true,
        content: `Имя Вашей комнаты должно быть длиной от 3 до 40 символов!`
      }

    const v = await api.setName(ctx.member.id, name)
    if(v == Status.UNKNOW_ERROR) throw new Error(Status[v])
    return {
      ephemeral: true,
      content: `Имя Вашей комнаты успешно изменено`
    }
  }

  @permission('voice.limit')
  async limit(ctx: CommandContext, opt: ConvertedOption) {
    const { limit } = opt as { limit?: number }
    if (typeof limit == 'undefined') {
      const info = await api.getInfo(ctx.member.id)
      if (!info) throw new Error('No info')
      return {
        ephemeral: true,
        content: `Лимил Вашей комнаты \`${info.limit}\``
      }
    }
    return this.setLimit(ctx, limit)
  }

  @permission('voice.setlimit')
  async setLimit(ctx: CommandContext, limit: number) {
    const v = await api.setLimit(ctx.member.id, limit)
    if(v == Status.UNKNOW_ERROR) throw new Error(Status[v])
    return {
      ephemeral: true,
      content: `Лимит Вашей комнаты успешно изменен`
    }
  }

  // SETTINGS

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

export = Voice