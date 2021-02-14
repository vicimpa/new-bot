import {bots} from "~/config";
import fetch from "node-fetch";
import { Logger } from "~/lib/logger";
 
const baseUrl = (userId = '') => `https://discord.com/api/v8/users/${userId}`

fetch(baseUrl('608659533711278111'), {headers: {'Authorization': `Bot ${bots.ctl.token}`}})
  .then(e => e.buffer())
  .then(e => Logger.log(e.toString()))
  .catch(e => Logger.error(e))