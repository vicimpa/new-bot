export class MyDate extends Date {
  get h() { return this.getHours() }
  set h(v) { this.setHours(v) }

  get m() { return this.getMinutes() }
  set m(v) { this.setMinutes(v) }
  
  get s() { return this.getSeconds() }
  set s(v) { this.setSeconds(v) }
  
  get D() { return this.getDate() }
  set D(v) { this.setDate(v) }
  
  get M() { return this.getMonth() }
  set M(v) { this.setMonth(v) }
  
  get Y() { return this.getFullYear() }
  set Y(v) { this.setFullYear(v) }
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
  
  get M() { return this.getUTCMonth() }
  set M(v) { this.setUTCMonth(v) }
  
  get Y() { return this.getUTCFullYear() }
  set Y(v) { this.setUTCFullYear(v) }
}