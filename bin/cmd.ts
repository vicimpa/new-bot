import { bots, commandsPath, guildId } from "~/config"
import { SlashCreator } from "slash-create"
import { Logger } from "~/lib/logger"

const creator = new SlashCreator({
  applicationID: bots.cmd.client,
  publicKey: bots.cmd.public,
  token: bots.cmd.token
})


async function main() {
  const d = await creator.api.getCommands(guildId)
  Logger.log('Regestred now ' + d.length)
  
  creator   
    .on('synced', async () => {
      const d = await creator.api.getCommands(guildId)
      Logger.log('Ok. Now count: ' + d.length)
      process.exit(0)
    })
    .on('error', (e) => {
      Logger.error(e)
    })
  
  await creator.syncCommandsIn(guildId, true)

  Logger.log('Deleted!')

  await creator
    .registerCommandsIn(commandsPath)
    .syncCommands()
}

main().catch(e => Logger.error(e))
