import { TextChannel } from "discord.js";
import { client } from "~/lib/control";
import { main } from "~/lib/main";
import { logs } from "~/config";

main(__filename, () => {
  client.on('ready', async () => {
    const channel = await client.channels.fetch(logs.pools)
    
    if(!(channel instanceof TextChannel))
      return

    const message = channel.lastMessage || await channel.send('Test')
    let i = 0
    setInterval(() => {
      message.edit('Update ' + (i++))
    }, 1000)
  })
})