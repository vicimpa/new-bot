import { Client } from "discord.js";
import { bots } from "../config";
import { functions } from "./main";

functions.push(() =>
  client.login(bots.ctl.token)
    .then(() => console.log('Controll connect'))
    .catch(console.error))

export const client = new Client()