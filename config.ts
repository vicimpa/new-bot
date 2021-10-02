import { join } from "path"
import { timeparser } from "~/lib/timeparser"

export const guildId = ''
export const rolesChannel = ''

import ctl from "./data/ctl.json"
import cmd from "./data/cmd.json"
import qiwi from "./data/qiwi.json"

/** @type {string[]} */
export const privates = []

/** @type {string[]} */
export const actions = []

export const logs = {
  logs: '',
  jail: '',
  report: '',
  admin:'',
  dmbot: '',
  news: '',
  pools: '',
  roles: '',
  battle: '',
  donations: '',
  voice: '',
  fines: '',
  bad: ''
}

export const createdName = 'Create room'
export const removePrivateAfter = 2000

export const commandsPath = {
  dirname: join(process.cwd(), 'commands'),
  filter: /^([^\.].*)\.js$/
}

export const mutes = {
  chat: '',
  voice: ''
}

/**
 * @type {string[]}
 */
export const onlyMedia = []

/**
 * @type {{
 *  id: string,
 *  price: number,
 *  name: string
 * }[]}
 */
export const sponsors = []

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

export const mongoUrl = 'mongodb://127.0.0.2:27017/server'

export const qiwiPublic = qiwi.public
export const qiwiPrivate = qiwi.private

export const bots = { ctl, cmd }