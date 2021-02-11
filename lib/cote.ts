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
} from "cote"

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

export function makeRequester<T extends Base>(root: T): T {
  const keys = Object.getOwnPropertyNames(root.constructor.prototype)
    .filter(e => typeof root[e] == 'function' && e != 'constructor')

  const { name } = root.constructor
  const req = new Requester({ name })

  if (!keys.length) return {} as any
  const obj = {} as any

  for (let key of keys) {
    obj[key] = (...args) =>
      new Promise((resolve, reject) => {
        req.send({ type: [name, key].join('.'), args }, (err, result) => {
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
  const res = new Responder({ name: name })

  for (let key of keys) {
    res.on([name, key].join('.'), (event, callback) => {
      root[key](...(typeof event['args'] == 'undefined' ? [] : event['args']))
        .then(result => callback(null, result))
        .catch(callback)
    })
  }
}