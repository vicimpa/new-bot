import { json } from "body-parser"
import { Request } from "express"

export const parser = () => 
  (req: Request & { rawBody: string }, res, next) => {
    let buff = [] as Buffer[]
    let vd = (d) => buff.push(d)

    json()(req, res, () => {})
    req.on('data', vd)
    req.once('end', () => {
      req.rawBody = Buffer.concat(buff).toString()
      req.off('data', vd)
      next()
    })
  }