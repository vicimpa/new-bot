import { basename, extname } from "path";
import { Logger } from "~/lib/logger";

const functions: Array<() => void> = [];

export function getName() {
  const file = process.env.pm_exec_path || process.argv[1];
  return basename(file, extname(file));
}

let running = false;

export function append(callback: (...args) => any) {
  Logger.log('Append dependency' + (callback.name ? (' ' + callback.name) : ''));
  functions.push(callback);
  if (running) callback();
}

export function main(file: string, callback: (...args: string[]) => any) {
  const [runner, nowfile, ...args] = process.argv;

  if (nowfile == file || file == process.env.pm_exec_path) {
    append(function mainFunction() {
      Promise.resolve()
        .then(e => args)
        .then(e => callback(...e))
        .catch(e => Logger.error(e));
    });

    setTimeout((functions) => {
      running ? null : functions.map(e => e());
      running = true;
    }, 1000, functions);
  }
}

