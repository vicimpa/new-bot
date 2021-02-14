import { rpcHost, rpcPort } from "~/config";
import SocketIO from "socket.io";

import { Server } from "http";
import { main } from "~/lib/main";
import { Logger } from "~/lib/logger";

const server = new Server()
const socketServer = SocketIO(server)


main(__filename, () => {
  const sockets: SocketIO.Socket[] = []

  socketServer.on('connection', (socket) => {
    const methods: string[] = socket['_methods'] || (socket['_methods'] = [])

    if(sockets.indexOf(socket) == -1) sockets.push(socket)
    Logger.log((`Update clients +1 (${sockets.length})`))

    socket.on('register', (name: string) => {
      if(methods.indexOf(name) == -1) methods.push(name)
      Logger.log('register '+name)
    })

    socket.on('request', ({name, args}, callback) => {
      Logger.log('request '+name)
      let a = setTimeout(callback, 2000, {error: 'Error timeout'})

      for(let f of sockets) {
        if(f['_methods'].indexOf(name) != -1) {
          f.emit('response', {name, args}, (...args) => {
            Logger.log('response '+name)
            clearTimeout(a)
            callback(...args)
          })
          return
        }
      }
      callback({error: 'No find method!'})
    })

    socket.on('disconnect', () => {
      let index = sockets.indexOf(socket)
      if(index != -1) sockets.splice(index, 1)
      Logger.log((`Update clients -1 (${sockets.length})`))
    })
  })

  server.listen(rpcPort, rpcHost)

  server.on('listening', () =>
    Logger.log('RPC Server start'))
})