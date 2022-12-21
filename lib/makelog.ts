import { Client, TextChannel } from "discord.js";
import { logs } from "~/config";
import { Logger } from "~/lib/logger";

class Base { }

type Room = keyof typeof logs;
type Desc = TypedPropertyDescriptor<(...args: any[]) => any>;

const logsKey = '_clients';

export function makeLogs<T extends Base>(root: T, client: Client) {
  const clients: Client[] = root.constructor[logsKey] || (root.constructor[logsKey] = []);
  clients.indexOf(client) == -1 && (clients.push(client));
}

export function logToRoom(keys: Room | Room[]) {
  return <T extends typeof Base>(p: T['prototype'], name: string, { value }: Desc) => {
    if (typeof value != 'function')
      return;

    if (!Array.isArray(keys))
      keys = [keys];

    const clients: Client[] = p.constructor[logsKey] || (p.constructor[logsKey] = []);

    return {
      async value(...args) {
        for (const c of clients) {
          for (const k of keys) {
            const channelId = logs[k];
            c.channels.fetch(channelId)
              .then(e => (e instanceof TextChannel) ? e : null)
              .then(async channel => {
                if (!channel) return null;
                const fun = (value as Function).bind(this);
                const result = await fun(...args);
                return channel.send(result);
              })
              .catch(e => Logger.error(e));
          }
        }
      }
    } as Desc;
  };
}
