import { formatDiagnostic } from "typescript"

const re = /((h|m|s|D|M|Y)\2*)/g

export class MyDate extends Date {
  get h() { return this.getHours() }
  set h(v) { this.setHours(v) }

  get m() { return this.getMinutes() }
  set m(v) { this.setMinutes(v) }
  
  get s() { return this.getSeconds() }
  set s(v) { this.setSeconds(v) }
  
  get D() { return this.getDate() }
  set D(v) { this.setDate(v) }
  
  get M() { return this.getMonth()+1 }
  set M(v) { this.setMonth(v)-1 }
  
  get Y() { return this.getFullYear() }
  set Y(v) { this.setFullYear(v) }

  count(v = '', n = 2) {
    return ('0'.repeat(n) + v).substr(-n)
  }

  format(format = 'DD.MM.YYYY') {
    while(true) {
      const f = re.exec(format)
      if(!f) return format
      const [c, g, k] = f
      format = format.replace(g, this.count(`${this[k]}`, g.length))
    }
  }

  static format(d: Date | number | string, format = '') {
    return (new this(d)).format(format)
  }
}

export class MyUTCDate extends Date {
  get h() { return this.getUTCHours() }
  set h(v) { this.setUTCHours(v) }

  get m() { return this.getUTCMinutes() }
  set m(v) { this.setUTCMinutes(v) }
  
  get s() { return this.getUTCSeconds() }
  set s(v) { this.setUTCSeconds(v) }
  
  get D() { return this.getUTCDate() }
  set D(v) { this.setUTCDate(v) }
  
  get M() { return this.getUTCMonth()+1 }
  set M(v) { this.setUTCMonth(v-1) }
  
  get Y() { return this.getUTCFullYear() }
  set Y(v) { this.setUTCFullYear(v) }

  count(v = '', n = 2) {
    return ('0'.repeat(n) + v).substr(-n)
  }

  format(format = 'DD.MM.YYYY') {
    while(true) {
      const f = re.exec(format)
      if(!f) return format
      const [c, g, k] = f
      format = format.replace(g, this.count(`${this[k]}`, g.length))
    }
  }

  static format(d: Date | number | string, format = '') {
    return (new this(d)).format(format)
  }
}