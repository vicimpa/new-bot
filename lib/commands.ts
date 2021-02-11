import { Client } from "discord.js";
import { bots } from "../config";
import { functions } from "./main";

functions.push(() =>
  client.login(bots.cmd.token)
    .then(() => console.log('Commands connect'))
    .catch(console.error))

export const client = new Client()