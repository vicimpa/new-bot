import nacl from "tweetnacl"
import { Request } from "express"

export const access = (publicKey: string) =>
  (req: Request & { rawBody: string }, res, next) => {
    if(req.method != 'POST') return next()
    
    const sig = req.get('X-Signature-Ed25519')
    const time = req.get('X-Signature-Timestamp')
    const { rawBody } = req

    const isVerified = !!(
      sig && time && nacl.sign.detached.verify(
        Buffer.from(time + rawBody),
        Buffer.from(sig, 'hex'),
        Buffer.from(publicKey, 'hex')
      )
    )

    if (!isVerified) {
      res.statusCode = 401
      res.end('invalid request signature')
      return
    }
    
    next()
  }