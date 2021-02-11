// import roleDB from "~/roles.json"
// import { client } from "~/lib/client"
// import { bots, guildId } from "~/config"

// async function main() {
//   await client.login(bots.cmd.token)
//   console.log('Logged')
//   const guild = await client.guilds.fetch(guildId)
//   const { cache } = await guild.roles.fetch()
//   const roles = cache.array()
//     .sort((a, b) => a.position - b.position)

//   const start = roles.findIndex(e => e.name == '-')
//   const end = roles.findIndex((e, i) => i != start && e.name == '-')

//   if(start == -1 || end == -1)
//     return null

//   const deleted = roles.splice(start+1, end - start-1)
  
//   for(let del of deleted)
//     await del.delete()

//   for(let {name, color} of roleDB.osRoles.roles) {
//     await guild.roles.create({
//       data: { name, color, position: start + 1 }
//     })
//   }    
  
//   await guild.roles.create({
//     data: { name: "===", position: start + 1 }
//   })

//   for(let v of [roleDB.specificRoles, roleDB.languageRoles]) {
//     for(let {name, color} of v.roles) {
//       await guild.roles.create({
//         data: { name: `Проверяющий ${name}✓`, color, position: start + 1 }
//       })
//     }

//     await guild.roles.create({
//       data: { name: "===", position: start + 1 }
//     })
  
//     for(let {name, color} of v.roles) {
//       await guild.roles.create({
//         data: { name: `${name}✓`, color, position: start + 1 }
//       })
//     }

//     await guild.roles.create({
//       data: { name: "===", position: start + 1 }
//     })
  
//     for(let {name} of v.roles) {
//       await guild.roles.create({
//         data: { name: `${name}`, position: start + 1 }
//       })
//     }

//     if(v != roleDB.languageRoles)
//       await guild.roles.create({
//         data: { name: "===", position: start + 1 }
//       })
//   }
// }

// main()
//   .then(() => process.exit(0))
//   .catch(console.error)