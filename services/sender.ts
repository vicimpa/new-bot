#!/usr/bin/env ts-node
import { Message, MessageOptions, TextChannel } from "discord.js";
import { mutes, sponsors } from "~/config";
import { client } from "~/lib/control";
import { Logger } from "~/lib/logger";
import { main } from "~/lib/main";
import { logToRoom, makeLogs } from "~/lib/makelog";
import { MyDate } from "~/lib/mydate";
import { remaining } from "~/lib/remaining";
import { makeApi, method, register } from "~/lib/rpcapi";
import { tempModelEvents } from "~/models/Temp";

const fmt = 'DD.MM.YY hh:mm:ss (по МСК)';

const code = (d = '', l = '') => '```' + l + '\n' + d.replace(/\`/g, '') + '\n```';

@register()
export class ApiSender {
  @method()
  @logToRoom(['logs'])
  async chatLog(userId: string, channelId: string, message: string, messageNew?: string) {
    return {
      content: `**[chatMonitor]**`,
      embed: {
        color: '#ff0000',
        description: `${messageNew ? 'Изменено' : 'Удалено'} сообщение: ${code(message)} ${messageNew ? ('на: ' + code(messageNew)) : ''} ${userId ? ('пользователя <@' + userId + '>') : ''} в канале <#${channelId}>`,
        footer: {
          text: MyDate.format(new Date(), fmt)
        }
      }
    } as MessageOptions;
  }

  @method()
  @logToRoom(['donations'])
  async message(userId: string, message: string, amount: number) {
    return {
      content: `**[donate]** <@${userId}> ${amount.toFixed(2)}руб`,
      embed: {
        description: message[0] == '!' ? message.substr(1) : `<@${userId}> оставил сообщение: ${code(message)}`
      }
    } as MessageOptions;
  }

  @logToRoom(['donations'])
  async role(
    mode: 'add' | 'update' | 'delete',
    userId: string,
    roleId: string,
    deltaTime: number,
    timeEnd: number
  ) {

    let description = ``;
    let big = deltaTime > 0;

    const def = () => {
      description += `\nРоль будет снята: \`${MyDate.format(timeEnd, fmt)}\``;
    };

    switch (mode) {
      case 'add': {
        description += `Пользователь <@${userId}> получил <@&${roleId}>`;
        def();
      }; break;

      case 'update': {
        description += `У пользователя <@${userId}> ${big ? 'увеличен' : 'уменьшен'} <@&${roleId}>`;
        def();
      }; break;

      case 'delete': {
        description += `Закончился срок <@&${roleId}> у пользователя <@${userId}>`;
      }; break;
    }

    return {
      content: `**[donate]** <@${userId}>`,
      embed: {
        description
      }
    } as MessageOptions;
  }

  @logToRoom(['fines'])
  async muteChange(
    mode: 'add' | 'update' | 'delete',
    userId: string,
    roleId: string,
    timeEnd: number,
    deltaTime: number,
    moderId: string,
    reason: string
  ) {

    let description = ``;
    let big = deltaTime > 0;

    const def = () => {
      description += `\n на срок: \`${remaining(Math.abs(deltaTime))}\``;
      description += ` до: \`${MyDate.format(timeEnd, fmt)}\``;
    };

    switch (mode) {
      case 'add': {
        if (moderId) description += `<@${moderId}> выдал <@&${roleId}> пользователю <@${userId}>`;
        else description += `Пользователь <@${userId}> получил <@&${roleId}>`;
        def();
      }; break;

      case 'update': {
        if (moderId) description += `<@${moderId}> ${big ? 'увеличил' : 'уменьшил'} <@&${roleId}> пользователю <@${userId}>`;
        else description += `У пользователя <@${userId}> ${big ? 'увеличен' : 'уменьшен'} <@&${roleId}>`;
        def();
      }; break;

      case 'delete': {
        if (!moderId) description += `Закончился срок <@&${roleId}> у пользователя <@${userId}>`;
        else description += `<@${moderId}> снял <@&${roleId}> пользователю <@${userId}>`;
      }; break;
    }

    if (reason) description += `\n\n Причина: ${code(reason)}`;

    return {
      content: `**[mute]** <@${userId}>`,
      embed: {
        description
      }
    } as MessageOptions;
  }

  @method()
  @logToRoom(['logs'])
  async clearReport(chatId: string, userId: string, count: number, user?: string) {
    return {
      content: `**[clearMessage]**`,
      embed: {
        color: '#ff0000',
        description: `По запросу <@${userId}> в чате <#${chatId}> было удалено ${count} сообщений${user ? ` от пользователя <@${user}>` : ''}.`
      }
    } as MessageOptions;
  }

  @method()
  @logToRoom('report')
  async report(reportId: string, userId: string, reportedId: string, message: string) {
    return {
      content: `**[report:${reportId}]** @here`,
      embed: {
        color: '#ff0000',
        description: `Пользователь <@${userId}> оправил на <@${reportedId}> жалобу с текстом: ${code(message)}`
      }
    } as MessageOptions;
  }

  @method()
  @logToRoom('roles')
  async proRole(checkerId: string, userId: string, roleId: string, type = false) {
    const action = type ? 'выдал' : 'забрал';
    return {
      embed: {
        color: '#ff0000',
        description: `Проверяющий <@${checkerId}> ${action} роль <@&${roleId}> пользователю <@${userId}>.`
      }
    } as MessageOptions;
  }

  @method()
  @logToRoom('admin')
  async testSend(userId: string) {
    return {
      embed: {
        color: '#ff0000',
        description: `Потльзователь <@${userId}> вызвал тестовую команду.`
      }
    } as MessageOptions;
  }

  @method()
  @logToRoom('voice')
  async privateMuteSend(userId: string, set = false, limitId: string = null) {
    let action = set ? 'замьютил' : 'размьютил';
    let target = limitId ? `пользователя <@${limitId}>` : 'всех пользователей';
    return {
      embed: {
        color: '#ff0000',
        description: `Пользователь <@${userId}> **${action}** ${target} у себя в канале.`
      }
    } as MessageOptions;
  }

  @method()
  @logToRoom('voice')
  async privateBlockeSend(userId: string, set = false, limitId: string = null) {
    let action = set ? 'заблокировал' : 'разблокировал';
    let target = limitId ? `пользователя <@${limitId}>` : 'всех пользователей';
    return {
      embed: {
        color: '#ff0000',
        description: `Пользователь <@${userId}> **${action}** ${target} у себя в канале.`
      }
    } as MessageOptions;
  }
}

main(__filename, () => {
  const sender = new ApiSender();

  const tempRoleEvent = (mode: 'add' | 'update' | 'delete') => {
    return ((userId: string,
      roleId: string,
      timeEnd: number,
      deltaTime: number,
      moderId: string,
      reason: string
    ) => {
      if (Object.values(mutes).includes(roleId))
        return sender.muteChange(
          mode, userId, roleId, timeEnd,
          deltaTime, moderId, reason
        ).catch(e => Logger.error(e));

      if (sponsors.find(e => e.id == roleId))
        return sender.role(mode, userId, roleId, deltaTime, timeEnd);

    }) as Parameters<(typeof tempModelEvents)['on']>[1];
  };

  client.on('messageUpdate', async (d, n) => {
    if (d.author.bot) return;
    // if(await testPermission(d.author.id, 'monitor.nolog')) return
    sender.chatLog(d.author.id, d.channel.id, d.content, n?.content)
      .catch(e => Logger.error(e));
  });

  client.on('messageDelete', async (d) => {
    if (d.author.bot) return;
    // if(await testPermission(d.author.id, 'monitor.nolog')) return
    sender.chatLog(d.author?.id, d.channel.id, d.content)
      .catch(e => Logger.error(e));
  });

  client.ws.on('MESSAGE_DELETE', async (d) => {
    if (!d || d.author?.bot) return;
    // if(await testPermission(d.author.id, 'monitor.nolog')) return

    const v = (client.channels.cache.get(d.channel_id) ||
      await client.channels.fetch(d.channel_id)) as TextChannel;

    const m = (v.messages.cache.get(d.id)) as Message;

    if (m) return;

    sender.chatLog(d.author?.id, d.channel_id, d.content)
      .catch(e => Logger.error(e));
  });

  client.ws.on('MESSAGE_UPDATE', async (d) => {
    if (!d || d.author.bot) return;
    // if(await testPermission(d.author.id, 'monitor.nolog')) return

    const v = (client.channels.cache.get(d.channel_id) ||
      await client.channels.fetch(d.channel_id)) as TextChannel;

    const m = (v.messages.cache.get(d.id)) as Message;

    if (m) return;

    await v.messages.fetch(d.id).catch(e => null);

    sender.chatLog(d.author.id, d.channel_id, '[[содержимое неизвестно]]', d.content)
      .catch(e => Logger.error(e));
  });

  tempModelEvents.on('appendRole', tempRoleEvent('add'));
  tempModelEvents.on('updateRole', tempRoleEvent('update'));
  tempModelEvents.on('deleteRole', tempRoleEvent('delete'));

  makeApi(ApiSender);
  makeLogs(new ApiSender(), client);
});