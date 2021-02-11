import { performance as pf } from "perf_hooks"

export const logger = () => 
  (req, res, next) => {
    const time = pf.now()
    const { url, method, headers } = req

    res.once('close', () =>
      console.log(
        `[${method}]`,
        `(${res.statusCode})`,
        `"${url}"`,
        headers['x-real-ip'],
        (pf.now() - time).toFixed(2)+' ms')
    )
    
    next()
  }