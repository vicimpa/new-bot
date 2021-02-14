import { Client } from "discord.js";
import { bots } from "~/config";
import { Logger } from "./logger";
import { append } from "./main";

export const client = new Client()

append(function commandClient() {
  client.login(bots.cmd.token)
    .then(() => Logger.log('Commands connect'))
    .catch(e => Logger.error(e))
})