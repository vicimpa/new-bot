import {
  Requester,
  Responder,
  TimeBalancedRequester,
  PendingBalancedRequester,
  Publisher,
  Monitor,
  MonitoringTool,
  Sockend,
  Subscriber
} from "cote";
import { Logger } from "~/lib/logger";

export {
  Requester,
  Responder,
  TimeBalancedRequester,
  PendingBalancedRequester,
  Publisher,
  Monitor,
  MonitoringTool,
  Sockend,
  Subscriber
}

class Base { }

const state = { req: null as Requester, res: null as Responder }

export function makeRequester<T extends Base>(root: T): T {
  const keys = Object.getOwnPropertyNames(root.constructor.prototype)
    .filter(e => typeof root[e] == 'function' && e != 'constructor')

  const { name } = root.constructor
  const req = state.req || (state.req = new Requester({ name: name+'Req', key: name+'Req', requests: [name+'Res']}))

  if (!keys.length) return {} as any
  const obj = {} as any

  for (let key of keys) {
    obj[key] = (...args) =>
      new Promise((resolve, reject) => {
        req.send({ type: [name, key].join('.'), args }, (err, {result} = {}) => {
          if (err) return reject(err)
          resolve(result)
        })
      })
  }

  return obj
}

export function makeRunner<T extends Base>(root: T) {
  const keys = Object.getOwnPropertyNames(root.constructor.prototype)
    .filter(e => typeof root[e] == 'function' && e != 'constructor')

  const { name } = root.constructor
  const res = state.res || (state.res = new Responder({ name: name+'Res', key: name+'Res', respondsTo: [name+'Req'] }))

  for (let key of keys) {
    Logger.log([name, key].join('.'))
    res.on([name, key].join('.'), (event, callback) => {
      root[key](...(typeof event['args'] == 'undefined' ? [] : event['args']))
        .then(result => callback(null, {result}))
        .catch(callback)
    })
  }
}