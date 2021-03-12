import { readFileSync } from "fs"
import { join } from "path"
import { timeparser } from "~/lib/timeparser"

export const guildId = '805944675188867112'
export const rolesChannel = '807067262569283645'

import ctl from "./data/ctl.json"
import cmd from "./data/cmd.json"
import qiwi from "./data/qiwi.json"

export const privates = [
  '808155036910616596'
]

export const logs = {
  jail: '807670197740896326',
  report: '805944675743694910',
  admin:'805944675533717560',
  dmbot: '805944675743694911',
  news: '807581614821081090',
  pools: '807592657814945793',
  roles: '807593669985173504',
  battle: '807593935799189504',
  donations: '808458677727264819',
  voice: '808427116730515456',
  fines: '810114604721766420'
}

export const createdName = 'Create room'
export const removePrivateAfter = 2000

export const commandsPath = {
  dirname: join(process.cwd(), 'commands'),
  filter: /^([^\.].*)\.js$/
}

export const mutes = {
  chat: '805944675243917365',
  voice: '805944675243917366'
}

export const sponsors = [
  {id: '805944675235397680', price: 150, name: 'Sponsor'},
  {id: '805944675235397681', price: 250, name: 'Sponsor +'},
  {id: '805944675243917362', price: 500, name: 'Sponsor XL'}
]

export const blockLimit = 30

export const rpcHost = '127.0.0.1'
export const rpcPort = 2525
export const rpcTimeout = timeparser('20s')

export const baseRoute = '/'
export const httpPort = 4000
export const httpHost = '127.0.0.2'

export const webHost = '127.0.0.2'
export const webPort = 4001

export const qiwiHost = '127.0.0.2'
export const qiwiPort = 4002

export const mongoUrl = 'mongodb://127.0.0.2:65017/hellcord'

export const qiwiPublic = qiwi.public
export const qiwiPrivate = qiwi.private

export const bots = { ctl, cmd }