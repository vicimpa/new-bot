import { Router } from "express"
import { GatewayServer } from "slash-create"

export const exrouter = (router: Router) => 
  new GatewayServer((handler) => {
    router.post('/', (req, res) => {
      try {
        handler(req.body)
      }catch(e) { console.log(e) }
    })
  })