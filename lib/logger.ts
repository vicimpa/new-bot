import { performance as pf } from "perf_hooks"

import { Writable } from "stream";
import { Console } from "console";

export const logger = () =>
  (req, res, next) => {
    const time = pf.now()
    const { url, method, headers } = req

    res.once('close', () =>
      Logger.log(
        `[${method}]`,
        `(${res.statusCode})`,
        `"${url}"`,
        headers['x-real-ip'],
        (pf.now() - time).toFixed(2) + ' ms')
    )

    next()
  }

const out = new Writable()
const err = new Writable()
const con = new Console(out, err)

out.write = (c, cb) => {
  if (typeof c == 'string')
    console.log(c.trim())
  return false
}

err.write = (c, cb) => {
  if (typeof c == 'string')
    console.error(c.trim())
  return false
}

function getInfo() {
  const [, ...stack] = (new Error()).stack.split('\n')
  const [name] = stack.filter(e => !(new RegExp(__filename)).test(e))
  const regExp = /(\/[^:]+):?(\d+)?:?(\d+)?/
  const find = regExp.exec(name)

  if(!find) return {
    file: __filename.replace(process.cwd() + '/', ''),
    row: 0, char: 0
  }

  let [, file, row, char] = find
  file = file.replace(process.cwd() + '/', '')

  return {
    file, row: +row, char: +char
  }
}

export class Logger {
  static get _file() {
    const { file, row, char } = getInfo()
    return file.split('/').splice(-2).join('/')
      + ':' + [row, +char - 8].join(':')
  }

  static log(...args) {
    con.log(`[${Logger._file}]`, ...args)
  }

  static error(...args) {
    con.error(`[${Logger._file}]`, ...args)
  }
}
