import { EventEmitter } from "koa";
import io from "socket.io-client";
import { rpcHost, rpcPort } from "~/config";
import { append } from "~/lib/main";
import { Logger } from "~/lib/logger";

const socket = io(`http://${rpcHost}:${rpcPort}`, {autoConnect: false})
const methods: string[] = []
const events: string[] = []
const runners = []

append(function rpcConnect() {
  socket.connect()
  socket.on('connect', () => {
    Logger.log('RPC connected')
    for (let m of methods)
      socket.emit('register', m)

    for (let m of events)
      socket.emit('subscribe', m)
  })
})

const subscribe = (name: string) => {
  if(events.indexOf(name) != -1) return
  events.push(name)
  if(socket.connected) socket.emit('subscribe', name)
}

socket.on('response', ({name, args = []}, callback) => {
  if(methods.indexOf(name) == -1) return callback({error: '1 No find method ' + name})
  const find = runners.find(e => typeof e[`_${name}`] == 'function')
  if(!find) return callback({error: '2 No find method ' + name})
  find[`_${name}`](...args)
    .then(e => callback({result: e}))
    .catch(e => callback({error: e.name || e}))
})

type Desc = TypedPropertyDescriptor<(...args) => Promise<any>>
class Base { }

export class Events<T = {}> {
  private _events = new EventEmitter()
  private _makeName(name: any) {
    return this['__proto__'].constructor.name + '.' + name
  }

  constructor() {
    socket.on('event', ({name, args = []}) => {
      this._events.emit(name, ...args)
    })
  }

  on<K extends keyof T>(name: K, listener: T[K]) {
    name = this._makeName(name) as any
    subscribe(name as string)
    this._events.on(name as string, listener as any)
  }
  once<K extends keyof T>(name: K, listener: T[K]) {
    name = this._makeName(name) as any
    subscribe(name as string)
    this._events.once(name as string, listener as any)
  }
  off<K extends keyof T>(name: K, listener?: T[K]) {
    name = this._makeName(name) as any
    this._events.once(name as string, listener as any)
  }
  /** @ts-ignore */
  emit<K extends keyof T, V = T[K]>(name: K, ...args: Parameters<V> ) {
    name = this._makeName(name) as any
    socket.emit('emit', {name, args})
  }
}

export const makeApi = <T extends typeof Base>(base: T) => {
  const meth: string[] = base['_methods'] || (base['_methods'] = [])
  if(meth.length == 0) return
  const runner = new base()

  for(let m of meth) {
    if(methods.indexOf(m) == -1) methods.push(m)
    if(socket.connected) socket.emit('register', m)
  }

  if(runners.indexOf(runner) == -1)
    runners.push(runner)
}

export const register = () => {
  return <T extends typeof Base>(base: T) => {
    const methods: string[] = base['_methods'] || (base['_methods'] = [])
  }
}

export const method = () => {
  return <T extends typeof Base>(c: T['prototype'], name: string, {value}: Desc) => {
    const base = c.constructor, { name: baseName } = base
    const methods: string[] = base['_methods'] || (base['_methods'] = [])

    if(typeof value != 'function') return

    const methodName = [baseName, name].join('_')

    if(methods.indexOf(methodName) == -1) 
      methods.push(methodName)

    base['prototype'][`_${methodName}`] = value

    return { async value(...args) {
      return new Promise((resolve, reject) => {
        socket.emit('request', {name: methodName, args}, ({error, result} = {} as any) => {
          if(error) return reject(error)
          resolve(result)
        })
      })
    }} as Desc
  }
}