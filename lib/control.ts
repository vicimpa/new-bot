import { Client } from "discord.js";
import { bots } from "~/config";
import { Logger } from "./logger";
import { append } from "./main";

export const client = new Client()

append(function controlClient() {
  client.login(bots.ctl.token)
    .then(() => Logger.log('Controll connect'))
    .catch(e => Logger.error(e))
})
