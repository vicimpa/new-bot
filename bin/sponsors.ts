import { TempModel } from "~/models/Temp";
import { timeparser } from "~/lib/timeparser";
import { main } from "~/lib/main";

const re = /(\d+)\.(\d+)\.(\d+)\s*(\d+)\:(\d+)\:(\d+)/
const parse = (d: string) => {
  const [, D, M, Y, h, m, s] = re.exec(d)
  return new Date(`${Y}-${M}-${D} ${h}:${m}:${s} UTC(0300)`)
}

const stopTime = parse('02.02.2021 15:20:00')
const startTime = new Date()
const append = +startTime - +stopTime
const roles = ['805944675235397680', '805944675235397681', '805944675243917362']

const data: {userId: string, role: number, time: string, start: string, name: string}[] = [
]

main(__filename, async () => {
  for (let f of data) {
    const userId = f.userId
    const roleId = roles[f.role]
    const time = timeparser(f.time)

    let start = parse(f.start)
    let end = +start + time

    if (start < stopTime) {
      end += append
    } else {
      start = startTime
      end = +start + time
    }

    await TempModel.appendRole(userId, roleId, '-1h -30m')
      .then(e => console.log(userId, f.name, 'Ok'))
      .catch(e => console.error(e))
  }
})