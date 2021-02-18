import { readFileSync } from "fs"
import { join } from "path"

export const guildId = '805944675188867112'
export const rolesChannel = '807067262569283645'

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
  filter: /^([^\.].*)\.ts$/
}

export const mutes = {
  chat: '805944675243917365',
  voice: '805944675243917366'
}

export const baseRoute = '/'
export const httpPort = 4000
export const httpHost = '127.0.0.1'
export const blockLimit = 30

export const rpcHost = '127.0.0.1'
export const rpcPort = 2525

export const webHost = '127.0.0.1'
export const webPort = 4001

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