import { readFileSync } from "fs"
import { join } from "path"

export const guildId = '805944675188867112'
export const rolesChannel = '807067262569283645'
export const privates = [
  '808155036910616596'
]

export const createdName = 'Create room'
export const removePrivateAfter = 2000

export const commandsPath = {
  dirname: join(process.cwd(), 'commands'),
  filter: /^([^\.].*)\.ts$/
}

export const baseRoute = '/bot'
export const httpPort = 4000
export const httpHost = '127.0.0.1'
export const blockLimit = 30

export const mongoUrl = 'mongodb://localhost:27017/howdycord'

export const bots = {
  ctl: {
    client: readFileSync('./data/ctl_client', 'utf-8'),
    public: readFileSync('./data/ctl_public', 'utf-8'),
    secret: readFileSync('./data/ctl_secret', 'utf-8'),
    token: readFileSync('./data/ctl_token', 'utf-8'),
  },
  cmd: {
    client: readFileSync('./data/cmd_client', 'utf-8'),
    public: readFileSync('./data/cmd_public', 'utf-8'),
    secret: readFileSync('./data/cmd_secret', 'utf-8'),
    token: readFileSync('./data/cmd_token', 'utf-8'),
  }
}