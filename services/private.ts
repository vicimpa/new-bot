#!/usr/bin/env ts-node

import { client } from "~/lib/commands";
import { main } from "~/lib/main";
import { CategoryChannel, Guild, GuildMember, Permissions } from "discord.js";
import { VoiceChannel, Role, PermissionString, PermissionOverwrites } from "discord.js";
import { createdName, guildId, privates, removePrivateAfter, blockLimit } from "~/config";
import { delay } from "~/lib/delay";
import { PrivateModel } from "~/models/Private";
import { register, makeApi, method } from "~/lib/rpcapi";
import { Logger } from "~/lib/logger";

const groups: RoomsStore[] = []

enum Status {
  OK,
  NO_USER,
  NO_METHOD,
  USER_EXISTS,
  LIMIT,
  UNKNOW_ERROR
}

enum Action {
  NO,
  ADD,
  REMOVE
}

interface IInfo {
  id: string
  name: string
  limit: number
  blocks: string[]
  mutes: string[]
}

@register()
export class VoiceApi {
  @method()
  async set(user: string, blockId: string, block = Action.NO, mute = Action.NO) {
    if (!block && !mute) return Status.NO_METHOD

    const info = await this.getInfo(user)
    if(!info) return Status.UNKNOW_ERROR

    const blockIndex = info.blocks.indexOf(blockId)
    const muteIndex = info.mutes.indexOf(blockId)

    switch (block) {
      case Action.ADD: {
        if (blockIndex != -1) return Status.USER_EXISTS
        if (info.blocks.length + 1 >= blockLimit)
          return Status.LIMIT

        info.blocks.push(blockId)
      } break

      case Action.REMOVE: {
        if (blockIndex == -1) return Status.USER_EXISTS
        info.blocks.splice(blockIndex, 1)
      } break
    }

    switch (mute) {
      case Action.ADD: {
        if (muteIndex != -1) return Status.USER_EXISTS
        if (info.mutes.length + 1 >= blockLimit)
          return Status.LIMIT
        info.mutes.push(blockId)
      } break

      case Action.REMOVE: {
        if (muteIndex == -1) return Status.USER_EXISTS
        info.mutes.splice(blockIndex, 1)
      } break
    }

    const group = RoomsStore.findGroup(user)

    if (group) {
      const channelInfo = await group.convertInfo(info)
      const voiceChannel = group.findVoice(user).channel
      if (voiceChannel) voiceChannel.overwritePermissions(channelInfo.permissions)
        .catch(() => { })
    }else {
      PrivateModel.updatePrivate(user, info)
        .catch(e => null)
    }

    return Status.OK
  }

  @method()
  async list(user: string, block = false, mute = false) {
    if (!block && !mute) return []

    const info = await this.getInfo(user)
    if(!info) return []
    if (block) return info.blocks
    if (mute) return info.mutes
    return []
  }

  @method()
  async clear(user: string, block = false, mute = false) {
    if (!block && !mute) return Status.NO_METHOD

    const info = await this.getInfo(user)
    if(!info) return Status.UNKNOW_ERROR
    const group = RoomsStore.findGroup(user)

    if (block) {
      if(!info.blocks.length)
        return Status.USER_EXISTS

      info.blocks = []
    }
    if (mute) {
      if(!info.mutes.length)
        return Status.USER_EXISTS

      info.mutes = []
    }

    if (group) {
      const channelInfo = await group.convertInfo(info)
      const voiceChannel = group.findVoice(user).channel
      if (voiceChannel) voiceChannel.overwritePermissions(channelInfo.permissions)
        .catch(() => { })
    }else {
      PrivateModel.updatePrivate(user, info)
        .catch(e => null)
    }

    return Status.OK
  }

  @method()
  async getInfo(user: string) {
    const guild = await client.guilds.fetch(guildId)
      .catch(e => null as Guild)

    if (!guild) return null

    const member = await guild.members.fetch(user)
      .catch(e => null as GuildMember)

    if (!member) return null

    return await RoomsStore.loadInforoom(member)
  }

  @method()
  async setName(user: string, name: string) {
    const info = await this.getInfo(user)
    if(!info) return Status.UNKNOW_ERROR
    const group = RoomsStore.findGroup(user)

    info.name = name

    if (group) {
      const voiceChannel = group.findVoice(user).channel

      if (voiceChannel) {
        voiceChannel.setName(name, 'command user')
          .catch(e => null)
      }
    }else {
      PrivateModel.updatePrivate(user, info)
        .catch(e => null)
    }

    return Status.OK
  }

  @method()
  async setLimit(user: string, limit: number) {
    const info = await this.getInfo(user)
    if(!info) return Status.UNKNOW_ERROR
    const group = RoomsStore.findGroup(user)

    info.limit = limit

    if (group) {
      const voiceChannel = group.findVoice(user).channel
      if (voiceChannel) voiceChannel.setUserLimit(limit)
        .catch(e => null)
    }else {
      PrivateModel.updatePrivate(user, info)
        .catch(e => null)
    }

    return Status.OK
  }
 
  static Action = Action
  static Status = Status
}

class Voice {
  channel: VoiceChannel
  owner: GuildMember
  lastActive = new Date()

  constructor(channel: VoiceChannel) {
    this.channel = channel
  }

  async init() {
    const { channel } = this
    const { guild } = channel

    for (let [id, perm] of channel.permissionOverwrites) {
      if (perm.type == 'member' && perm.allow.has('MANAGE_CHANNELS')) {
        this.owner = await guild.members.fetch(id)
        break
      }
    }

    return this
  }

  count() {
    return this.channel && this.channel.members.size || 0
  }

  async isRemoved() {
    if (!this.channel) return false
    return !await client.channels.fetch(this.channel.id)
      .catch(e => null)
  }

  async join(member: GuildMember) {
    this.lastActive = new Date()
  }

  async leave(member: GuildMember) {
    this.lastActive = new Date()
  }
}

class RoomsStore {
  group: CategoryChannel
  create: VoiceChannel
  voices: Voice[] = []

  constructor(group: CategoryChannel) {
    this.group = group
  }

  async init() {
    const channels = await this.group.children
    this.create = channels
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      .find(e => e instanceof VoiceChannel) as any

    if (this.create.name != createdName)
      await this.create.setName(createdName)

    for (let [, member] of this.create.members)
      this.join(member, this.create)
        .catch(e => Logger.error(e))

    for (let [id, channel] of channels) {
      if (channel instanceof VoiceChannel)
        if (channel.id != this.create.id)
          this.voices.push(await (new Voice(channel)).init())
    }

    groups.push(this)
  }

  async convertInfo(info: IInfo) {
    const { id, name, limit, blocks, mutes } = info
    const parent = this.create.parent
    const { guild } = parent
    type F = Array<Role | GuildMember>
    type D = PermissionString | PermissionString[]
    const perms = parent.permissionOverwrites
    const map = (e: string) => {
      if (e[0] == '&')
        return guild.roles.fetch(e.substr(1))
          .catch(e => null as Role)

      return guild.members.fetch(e)
        .catch(e => null as GuildMember)
    }
    const toPerm = (e: F, p: D) => {
      const deny = (Array.isArray(p) ? p : [p]).map(e => new Permissions(e))
      return e.map(v => {
        if (v instanceof Role)
          return { id: v.id, type: 'role', deny }

        return { id: v.id, type: 'member', deny }
      }).filter(e => e.id != id && !perms.find(v => e.id == v.id && e.type == v.type))
    }

    const blocksItems: F =
      await Promise.all(blocks.map(map) as any)
        .then(e => e.filter(v => !!v))
        .catch(e => null) || []

    const mutesItems: F =
      await Promise.all(mutes.map(map) as any)
        .then(e => e.filter(v => !!v))
        .catch(e => null) || []

    const permissions = [
      ...toPerm(mutesItems, 'SPEAK'),
      ...toPerm(blocksItems, 'CONNECT'),
      ...perms.array(),
      {
        id: id, type: 'member', allow: [
          new Permissions('MANAGE_CHANNELS'),
          new Permissions('MOVE_MEMBERS')
        ]
      }
    ] as PermissionOverwrites[]

    return { id, name, limit, permissions }
  }

  async join(member: GuildMember, voice: VoiceChannel) {
    if (voice.id == this.create.id) {
      let find = this.findVoice(member.id)

      if (!find) {
        const info = await RoomsStore.loadInforoom(member)
        const voiceData = await this.convertInfo(info)

        const newVoice = await member.guild
          .channels.create(voiceData.name, {
            type: 'voice',
            userLimit: voiceData.limit,
            parent: voice.parent,
            permissionOverwrites: voiceData.permissions
          }).catch(e => member.voice.channel && member.voice.setChannel(null) && null)
          .catch(() => { })

        if (!newVoice) return

        this.voices.push(await (find = new Voice(newVoice)).init())
      }

      if (find.channel)
        member.voice.setChannel(find.channel)
          .catch(() => {
            member.voice.setChannel(null)
              .catch(() => { })
          })

      return
    }

    const find = this.voices.find(e => e.channel.id == voice.id)
    if (!find) return
    await find.join(member)
  }

  async leave(member: GuildMember, voice: VoiceChannel) {
    if (voice.id == this.create.id) return
    const find = this.voices.find(e => e.channel.id == voice.id)
    if (!find) return
    await find.leave(member)
  }

  findVoice(userId: string) {
    return this.voices.find(e => e.owner && e.owner.id == userId)
  }

  async remove(voice: Voice) {
    let index = this.voices.indexOf(voice)
    if (index == -1) return null
    this.voices.splice(index, 1)
    if (await voice.isRemoved()) return
    if (voice.channel) voice.channel.delete()
      .catch(e => Logger.error(e))
  }

  static async loadInforoom(member: GuildMember) {
    const {
      name = member.nickname || member.user.username,
      limit = 0, blocks = [], mutes = []
    } = await PrivateModel.get(member.id) || {}

    return {
      id: member.id, name, limit, blocks, mutes
    } as IInfo
  }

  static findGroup(userId: string) {
    return groups.find(e => e.findVoice(userId))
  }

  static async load() {
    const guild = await client.guilds.fetch(guildId)
    await Promise.all(privates.map(e => guild.channels.cache.get(e))
      .filter(e => e instanceof CategoryChannel)
      .map(e => new RoomsStore(e as any))
      .map(e => e.init()))
  }
}

async function tick() {
  for (let { group, voices, create } of groups) {
    const sorted = group.children
      .sort((a, b) =>
        a.createdTimestamp - b.createdTimestamp)

    for (let [, channel] of sorted) {
      if (!(channel instanceof VoiceChannel))
        continue

      if (create.id == channel.id)
        continue

      if (!voices.find(e => e.channel.id == channel.id))
        channel.delete().catch(e => Logger.error(e))
    }
  }

  for (let group of groups) {
    for (let channel of group.voices) {
      if (Date.now() - +channel.lastActive > removePrivateAfter)
        if (await channel.count() > 0)
          continue
        else
          await group.remove(channel)
    }
  }

  await delay(1000)
  await tick()
}

main(__filename, () => {
  // makeRunner(new VoiceApi())
  makeApi(VoiceApi)

  client.on('ready', () => {
    client.guilds.fetch(guildId)
      .then(e => e.members.fetch())
      .then(e => RoomsStore.load())
      .then(() => Logger.log('Loaded rooms'))
      .catch(e => Logger.error(e))

    tick().catch(e => Logger.error(e))
  })

  client.on('channelDelete', (channel) => {
    if (!(channel instanceof VoiceChannel)) return
    let voice: Voice = null

    const group = groups.find(e =>
      e.voices.find(e =>
        (voice = e).channel.id == channel.id))
    if (!group || !voice) return
    group.remove(voice).catch(e => Logger.error(e))
  })

  client.on('voiceStateUpdate', ({ channel, member }, _) => {
    if (!channel) return
    const store = groups.find(e =>
      e.group.id == channel.parentID)

    if (!store) return

    store.leave(member, channel).catch(e => Logger.error(e))
  })

  client.on('voiceStateUpdate', (_, { channel, member }) => {
    if (!channel) return
    const store = groups.find(e =>
      e.group.id == channel.parentID)

    if (!store) return

    store.join(member, channel).catch(e => Logger.error(e))
  })

  client.on('channelUpdate', (channel) => {
    if (!(channel instanceof VoiceChannel)) return
    const voice = groups.map(e => e.voices)
      .reduce((a, v) => ([...a, ...v]), [] as Voice[])
      .find(e => e.channel.id == channel.id)

    if (!voice) return

    const blocks = voice.channel.permissionOverwrites
      .filter(e => e.deny.has('CONNECT'))
      .filter(e => !channel.parent.permissionOverwrites.find(v => v.id == e.id && v.type == e.type))
      .map(e => (e.type == 'role' ? '&' : '') + e.id)

    const mutes = voice.channel.permissionOverwrites
      .filter(e => e.deny.has('SPEAK'))
      .filter(e => !channel.parent.permissionOverwrites.find(v => v.id == e.id && v.type == e.type))
      .map(e => (e.type == 'role' ? '&' : '') + e.id)

    const { name, userLimit: limit } = voice.channel

    if (voice.owner)
      PrivateModel.updatePrivate(voice.owner.id, { name, limit, blocks, mutes })
        .catch(e => Logger.error(e))
  })
})