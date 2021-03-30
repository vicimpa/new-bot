import { Client, Guild } from "discord.js";
import { bots, guildId } from "~/config";
import { Logger } from "./logger";
import { append } from "./main";

export const client: Client & { guild: Guild } = new Client() as any

append(function controlClient() {
  client.login(bots.ctl.token)
    .then(() => client.guilds.fetch(guildId))
    .then(e => client.guild = e)
    .then(() => Logger.log('Controll connect'))
    .catch(e => Logger.error(e))
})
