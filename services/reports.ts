import { client } from "~/lib/control";
import { ReportModel } from "~/models/Report";
import { main } from "~/lib/main";
import { logs, guildId } from "~/config";
import { Guild, GuildEmoji, Message, MessageOptions, MessageReaction, TextChannel, User } from "discord.js"; 
import { Logger } from "~/lib/logger";
import { Collection } from "discord.js";
import { testPermission } from "~/lib/permissions";

const regExpId = /\[report:([^\]]+)\]/
let guild: Guild
let channel: TextChannel
let accept: GuildEmoji
let reject: GuildEmoji

async function load() {
  guild = await client.guilds.fetch(guildId)
  channel = await guild.channels.cache.find(e => e.id == logs.report) as TextChannel
  accept = guild.emojis.cache.find(e => e.name == 'accept')
  reject = guild.emojis.cache.find(e => e.name == 'reject')

  if(!(channel instanceof TextChannel))
    return

  let messages: Collection<string, Message>
  let last: string

  let obj = () => last ? {before: last} : {}

  while((messages = await channel.messages.fetch({limit: 100, ...obj()}))) {
    if(messages.size == 0) return
    for(let [,msg] of messages) {
      last = msg.id

      makeMessage(msg)
        .catch(e => Logger.error(e))
    }
  }
}

async function makeReactions(msg: Message) {
  msg.react(accept).catch(e => Logger.error(e))
  msg.react(reject).catch(e => Logger.error(e))
}

async function makeMessage(msg: Message) {
  if(!regExpId.test(msg.content))
    return msg.delete()

  const [,id] = regExpId.exec(msg.content)
  const rep = await ReportModel.findOne({_id: id})

  if(rep.status != ReportModel.Status.PENDING)
    return msg.delete()

  if(msg.reactions.cache.size)
    return

  makeReactions(msg)
  reply(rep.userId, `[report:${id}]`,`Ваша жалоба на <@${rep.reportedId}> получена.`)
}

async function reply(userId: string, title: string, message: string, color?: string) {
  return notify(userId, {
    embed: {
      color, title,
      description: message,
      footer: {
        text: 'Если у Вас не отображаются пинги, скопируйте эти записи и вставьте в любом текстовом канале на сервере HellCord.'
      }
    }
  }).catch(e => Logger.error(e))
}

async function notify(userId: string, msg: MessageOptions) {
  const user = await client.users.fetch(userId)
  const channel = user.dmChannel || await user.createDM().catch(e => {})
  if(!channel) return
  channel.send(msg).catch(e => Logger.error(e))
}

async function addReaction(msg: MessageReaction, user: User) {
  if(user.bot) return
  if(msg.message.channel.id != logs.report) return
  if(!regExpId.test(msg.message.content)) return
  if(!await testPermission(user.id, 'report.moder')) {
    msg.remove().catch(e => Logger.error(e))
    return
  }

  const [,id] = regExpId.exec(msg.message.content)

  switch(msg.emoji.name) {
    case accept.name: {
      const rep = await ReportModel.acceptReport(id)
        .catch(e => Logger.error(e))

      makeMessage(msg.message)

      if(rep)
        reply(
          rep.userId, 
          `[report:${id}]`,
          `Ваша жалоба на <@${rep.reportedId}> **принята** модератором <@${user.id}>.`, 
          '#00ff00'
        )
    } break

    case reject.name: {
      const rep = await ReportModel.closeReport(id)
        .catch(e => Logger.error(e))

      makeMessage(msg.message)

      if(rep)
        reply(
          rep.userId, 
          `[report:${id}]`,
          `Ваша жалоба на <@${rep.reportedId}> **отклонена** модератором <@${user.id}>.`, 
          '#00ff00'
        )
    } break

    default: {
      msg.remove().catch(e => Logger.error(e))
      return 
    }
  }
}

main(__filename, () => {
  client.on('ready', () => {
    Logger.log('Load start')
    load()
      .then(e => Logger.log('Load end'))
      .catch(e => Logger.error(e))
  })

  client.on('message', (e) => {
    if(e.channel.id != logs.report)
      return

    makeMessage(e)
      .catch(e => Logger.error(e))
  })

  client.on('messageReactionAdd', (v, e) => {
    addReaction(v, e as any)
      .catch(e => Logger.error(e))
  })
})