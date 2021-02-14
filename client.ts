import { register, makeApi, method } from "~/lib/rpcapi";
import { Logger } from "~/lib/logger";

const test = (name: string) => {
  return (...args) => {
    Logger.log(name, args)
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
  .then(Logger.log)
  .catch(e => Logger.error(e))