import { register, makeApi, method } from "~/lib/rpcapi";
const test = (name: string) => {
  return (...args) => {
    console.log(name, args)
  }
}

class Test {

  @method()
  async method(a = 1, b = 2) {
    return a + b
  }
}

const api = new Test()
makeApi(Test)

api.method(3, 1)
  .then(console.log)
  .catch(console.error)