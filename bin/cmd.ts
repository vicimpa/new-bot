import { bots, commandsPath, guildId } from "~/config"
import { SlashCreator } from "slash-create"

const creator = new SlashCreator({
  applicationID: bots.cmd.client,
  publicKey: bots.cmd.public,
  token: bots.cmd.token
})


async function main() {
  const d = await creator.api.getCommands(guildId)
  console.log('Regestred now ' + d.length)
  
  creator   
    .on('synced', async () => {
      const d = await creator.api.getCommands(guildId)
      console.log('Ok. Now count: ' + d.length)
      process.exit(0)
    })
    .on('error', (e) => {
      console.error(e)
    })
  
  await creator.syncCommandsIn(guildId, true)

  console.log('Deleted!')

  await creator
    .registerCommandsIn(commandsPath)
    .syncCommands()
}

main().catch(console.error)
